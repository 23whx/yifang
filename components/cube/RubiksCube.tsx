"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { parseAlg, randomScramble, type Move } from "@/lib/cube/alg";
import { facePalette, type CubeOrientation } from '@/lib/cube/stickers';

// ---------- 类型 ----------

type AxisName = "x" | "y" | "z";

/** 内部旋转任务：绕 axis 转动 layer 层，quarterTurns 个 90°（带符号） */
interface Turn {
  axis: AxisName;
  layer: number; // -1 | 0 | 1
  quarterTurns: number;
  fast?: boolean;
}

export interface RubiksCubeHandle {
  /** 动画播放一段公式 */
  play: (alg: string) => void;
  /** 瞬间应用一段公式（无动画，用于摆出教程初始状态） */
  applyInstant: (alg: string) => void;
  reset: () => void;
  scramble: () => string;
  isBusy: () => boolean;
  /** 是否已还原（允许整体旋转后的还原态） */
  isSolved: () => boolean;
}

interface RubiksCubeProps {
  colorOrientation?: CubeOrientation;
  allowUserTurns?: boolean;
  /** 每次用户手动拧动一层时回调 */
  onUserMove?: () => void;
  /** 动画状态变化 */
  onBusyChange?: (busy: boolean) => void;
  /** 场景就绪、API 可用（Canvas 内部异步挂载，早于此调用 API 会被忽略） */
  onReady?: () => void;
}

// ---------- 常量 ----------

const COLORS = {
  U: "#f8fafc", // 白
  D: "#facc15", // 黄
  F: "#22c55e", // 绿
  B: "#3b82f6", // 蓝
  R: "#ef4444", // 红
  L: "#f97316", // 橙
  core: "#16130f",
};

const AXES: Record<AxisName, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

const FACE_TO_TURN: Record<Move["face"], { axis: AxisName; layer: number }> = {
  R: { axis: "x", layer: 1 },
  L: { axis: "x", layer: -1 },
  U: { axis: "y", layer: 1 },
  D: { axis: "y", layer: -1 },
  F: { axis: "z", layer: 1 },
  B: { axis: "z", layer: -1 },
};

function moveToTurn(m: Move): Turn {
  const { axis, layer } = FACE_TO_TURN[m.face];
  // 顺时针（面朝自己看）= 绕该面外法线负方向旋转
  return { axis, layer, quarterTurns: -m.turns * layer };
}

const CUBIE_SIZE = 0.97;
const TURN_SPEED = 7; // rad/s
const FAST_TURN_SPEED = 22;

// ---------- 单个小方块 ----------

interface CubieData {
  id: number;
  initial: [number, number, number];
}

const CUBIES: CubieData[] = (() => {
  const list: CubieData[] = [];
  let id = 0;
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        list.push({ id: id++, initial: [x, y, z] });
      }
  return list;
})();

/** 贴纸：贴在小块朝外的面上 */
function stickersFor([x, y, z]: [number, number, number], orientation: CubeOrientation) {
  const COLORS = facePalette(orientation);
  const s: { pos: [number, number, number]; rot: [number, number, number]; color: string }[] = [];
  const o = CUBIE_SIZE / 2 + 0.001;
  if (x === 1) s.push({ pos: [o, 0, 0], rot: [0, Math.PI / 2, 0], color: COLORS.R });
  if (x === -1) s.push({ pos: [-o, 0, 0], rot: [0, -Math.PI / 2, 0], color: COLORS.L });
  if (y === 1) s.push({ pos: [0, o, 0], rot: [-Math.PI / 2, 0, 0], color: COLORS.U });
  if (y === -1) s.push({ pos: [0, -o, 0], rot: [Math.PI / 2, 0, 0], color: COLORS.D });
  if (z === 1) s.push({ pos: [0, 0, o], rot: [0, 0, 0], color: COLORS.F });
  if (z === -1) s.push({ pos: [0, 0, -o], rot: [0, Math.PI, 0], color: COLORS.B });
  return s;
}

// ---------- 场景内部 ----------

interface DragState {
  cubieId: number;
  startPoint: THREE.Vector3; // 世界坐标交点
  normalAxis: AxisName; // 被点击贴纸的法线轴
  startScreen: { x: number; y: number };
  triggered: boolean;
}

interface SceneProps extends RubiksCubeProps {
  registerApi: (api: RubiksCubeHandle) => void;
  setOrbitEnabled: (v: boolean) => void;
}

function CubeScene({ registerApi, onUserMove, onBusyChange, onReady, allowUserTurns = true, colorOrientation = 'white-up', setOrbitEnabled }: SceneProps) {
  const meshRefs = useRef<(THREE.Group | null)[]>([]);
  // 每个 cubie 的逻辑网格坐标
  const grids = useRef<THREE.Vector3[]>(CUBIES.map((c) => new THREE.Vector3(...c.initial)));
  const queue = useRef<Turn[]>([]);
  const active = useRef<{
    turn: Turn;
    ids: number[];
    startPos: THREE.Vector3[];
    startQuat: THREE.Quaternion[];
    progress: number; // 已旋转角度
    target: number; // 目标角度（带符号）
  } | null>(null);
  const busyRef = useRef(false);
  const drag = useRef<DragState | null>(null);
  const { raycaster, camera, gl } = useThreeCompat();

  const setBusy = useCallback(
    (b: boolean) => {
      if (busyRef.current !== b) {
        busyRef.current = b;
        onBusyChange?.(b);
      }
    },
    [onBusyChange]
  );

  const cubiesInLayer = useCallback((axis: AxisName, layer: number) => {
    const ids: number[] = [];
    grids.current.forEach((g, i) => {
      if (Math.round(g[axis]) === layer) ids.push(i);
    });
    return ids;
  }, []);

  /** 逻辑上完成一次转动：更新网格坐标，并把 mesh 精确对齐 */
  const commitTurn = useCallback((turn: Turn, ids: number[], startPos: THREE.Vector3[], startQuat: THREE.Quaternion[]) => {
    const angle = (turn.quarterTurns * Math.PI) / 2;
    const q = new THREE.Quaternion().setFromAxisAngle(AXES[turn.axis], angle);
    ids.forEach((id, i) => {
      const mesh = meshRefs.current[id];
      if (!mesh) return;
      mesh.position.copy(startPos[i]).applyQuaternion(q);
      mesh.position.round();
      mesh.quaternion.copy(startQuat[i]).premultiply(q);
      const g = grids.current[id];
      g.applyQuaternion(q);
      g.set(Math.round(g.x), Math.round(g.y), Math.round(g.z));
    });
  }, []);

  const applyTurnInstant = useCallback(
    (turn: Turn) => {
      const ids = cubiesInLayer(turn.axis, turn.layer);
      const startPos = ids.map((id) => meshRefs.current[id]!.position.clone());
      const startQuat = ids.map((id) => meshRefs.current[id]!.quaternion.clone());
      commitTurn(turn, ids, startPos, startQuat);
    },
    [cubiesInLayer, commitTurn]
  );

  useFrame((_, delta) => {
    if (!active.current) {
      const next = queue.current.shift();
      if (!next) {
        setBusy(false);
        return;
      }
      const ids = cubiesInLayer(next.axis, next.layer);
      active.current = {
        turn: next,
        ids,
        startPos: ids.map((id) => meshRefs.current[id]!.position.clone()),
        startQuat: ids.map((id) => meshRefs.current[id]!.quaternion.clone()),
        progress: 0,
        target: (next.quarterTurns * Math.PI) / 2,
      };
      setBusy(true);
    }
    const a = active.current;
    const speed = a.turn.fast ? FAST_TURN_SPEED : TURN_SPEED;
    const dir = Math.sign(a.target);
    a.progress += dir * speed * delta;
    const done = Math.abs(a.progress) >= Math.abs(a.target);
    const angle = done ? a.target : a.progress;
    const q = new THREE.Quaternion().setFromAxisAngle(AXES[a.turn.axis], angle);
    a.ids.forEach((id, i) => {
      const mesh = meshRefs.current[id];
      if (!mesh) return;
      mesh.position.copy(a.startPos[i]).applyQuaternion(q);
      mesh.quaternion.copy(a.startQuat[i]).premultiply(q);
    });
    if (done) {
      commitTurn(a.turn, a.ids, a.startPos, a.startQuat);
      active.current = null;
    }
  });

  // ---------- 对外 API ----------
  useEffect(() => {
    registerApi({
      play: (alg: string) => {
        for (const m of parseAlg(alg)) queue.current.push(moveToTurn(m));
      },
      applyInstant: (alg: string) => {
        for (const m of parseAlg(alg)) applyTurnInstant(moveToTurn(m));
      },
      reset: () => {
        queue.current = [];
        active.current = null;
        CUBIES.forEach((c, i) => {
          const mesh = meshRefs.current[i];
          if (!mesh) return;
          mesh.position.set(...c.initial);
          mesh.quaternion.identity();
          grids.current[i].set(...c.initial);
        });
        setBusy(false);
      },
      scramble: () => {
        const alg = randomScramble(20);
        for (const m of parseAlg(alg)) queue.current.push({ ...moveToTurn(m), fast: true });
        return alg;
      },
      isBusy: () => busyRef.current || queue.current.length > 0 || !!active.current,
      isSolved: () => {
        // 以 0 号块的姿态为基准：每块位置和每张贴纸法线都应与基准整体旋转一致
        const ref = meshRefs.current[0];
        if (!ref) return false;
        const q0 = ref.quaternion;
        const tmp = new THREE.Vector3();
        const tmp2 = new THREE.Vector3();
        return CUBIES.every((c, i) => {
          const m = meshRefs.current[i];
          if (!m) return false;
          tmp.set(...c.initial).applyQuaternion(q0);
          if (tmp.distanceToSquared(m.position) > 1e-3) return false;
          for (const k of [0, 1, 2] as const) {
            if (c.initial[k] === 0) continue;
            tmp.set(0, 0, 0).setComponent(k, c.initial[k]);
            tmp2.copy(tmp).applyQuaternion(q0);
            tmp.applyQuaternion(m.quaternion);
            if (tmp.distanceToSquared(tmp2) > 1e-3) return false;
          }
          return true;
        });
      },
    });
    onReady?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- 鼠标拖动转层 ----------

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>, cubieId: number) => {
      if (!allowUserTurns || busyRef.current || active.current || queue.current.length > 0) return;
      e.stopPropagation();
      const mesh = meshRefs.current[cubieId];
      if (!mesh || !e.face) return;
      // 世界法线（父组不旋转，mesh 四元数即世界旋转）
      const n = e.face.normal.clone().applyQuaternion(mesh.quaternion);
      const abs = [Math.abs(n.x), Math.abs(n.y), Math.abs(n.z)];
      const normalAxis: AxisName = abs[0] > abs[1] && abs[0] > abs[2] ? "x" : abs[1] > abs[2] ? "y" : "z";
      drag.current = {
        cubieId,
        startPoint: e.point.clone(),
        normalAxis,
        startScreen: { x: e.clientX, y: e.clientY },
        triggered: false,
      };
      setOrbitEnabled(false);
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [setOrbitEnabled, allowUserTurns]
  );

  const finishDrag = useCallback(() => {
    drag.current = null;
    setOrbitEnabled(true);
  }, [setOrbitEnabled]);

  const onPointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const d = drag.current;
      if (!d || d.triggered) return;
      const dx = e.clientX - d.startScreen.x;
      const dy = e.clientY - d.startScreen.y;
      if (Math.hypot(dx, dy) < 14) return;

      // 把屏幕位移换算成世界方向：用相机的右/上向量
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      const worldDrag = right.multiplyScalar(dx).add(up.multiplyScalar(-dy));

      // 在拖拽面内投影：去掉法线方向分量
      const nAxis = AXES[d.normalAxis];
      worldDrag.addScaledVector(nAxis, -worldDrag.dot(nAxis));
      if (worldDrag.lengthSq() < 1e-6) return;

      // 候选旋转轴：除法线轴外的两个轴。旋转时交点速度 v = a × p
      let best: { axis: AxisName; score: number } | null = null;
      (["x", "y", "z"] as AxisName[]).forEach((axis) => {
        if (axis === d.normalAxis) return;
        const v = AXES[axis].clone().cross(d.startPoint);
        const score = v.dot(worldDrag);
        if (!best || Math.abs(score) > Math.abs(best.score)) best = { axis, score };
      });
      if (!best) return;
      const chosen = best as { axis: AxisName; score: number };
      const layer = Math.round(grids.current[d.cubieId][chosen.axis]);
      queue.current.push({
        axis: chosen.axis,
        layer,
        quarterTurns: chosen.score > 0 ? 1 : -1,
      });
      d.triggered = true;
      onUserMove?.();
    },
    [camera, onUserMove]
  );

  void raycaster;
  void gl;

  return (
    <group
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerLeave={finishDrag}
    >
      {CUBIES.map((c, i) => (
        <group
          key={c.id}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={c.initial}
        >
          <RoundedBox
            args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]}
            radius={0.06}
            smoothness={4}
            onPointerDown={(e) => onPointerDown(e, i)}
          >
            <meshStandardMaterial color={COLORS.core} roughness={0.35} metalness={0.1} />
          </RoundedBox>
          {stickersFor(c.initial, colorOrientation).map((s, j) => (
            <mesh key={j} position={s.pos} rotation={s.rot}>
              <planeGeometry args={[0.82, 0.82]} />
              <meshStandardMaterial color={s.color} roughness={0.3} metalness={0.05} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// 小工具：在组件里拿 three 上下文
function useThreeCompat() {
  const camera = useThree((s) => s.camera);
  const raycaster = useThree((s) => s.raycaster);
  const gl = useThree((s) => s.gl);
  return { camera, raycaster, gl };
}

// ---------- 导出组件 ----------

const RubiksCube = forwardRef<RubiksCubeHandle, RubiksCubeProps>(function RubiksCube(
  { onUserMove, onBusyChange, onReady, allowUserTurns = true, colorOrientation = 'white-up' },
  ref
) {
  const apiRef = useRef<RubiksCubeHandle | null>(null);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  // Canvas 只在客户端渲染，避免 SSR hydration 不一致
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useImperativeHandle(ref, () => ({
    play: (alg) => apiRef.current?.play(alg),
    applyInstant: (alg) => apiRef.current?.applyInstant(alg),
    reset: () => apiRef.current?.reset(),
    scramble: () => apiRef.current?.scramble() ?? "",
    isBusy: () => apiRef.current?.isBusy() ?? false,
    isSolved: () => apiRef.current?.isSolved() ?? false,
  }));

  if (!mounted) return <div className="h-full w-full" />;

  return (
    <Canvas
      camera={{ position: [4.2, 4.2, 5.6], fov: 42 }}
      dpr={[1, 2]}
      style={{ touchAction: "none" }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[6, 10, 6]} intensity={1.4} />
      <directionalLight position={[-6, -4, -6]} intensity={0.5} />
      <CubeScene
        registerApi={(api) => {
          apiRef.current = api;
        }}
        onUserMove={onUserMove}
        onBusyChange={onBusyChange}
        onReady={onReady}
        allowUserTurns={allowUserTurns}
        colorOrientation={colorOrientation}
        setOrbitEnabled={setOrbitEnabled}
      />
      <OrbitControls
        enabled={orbitEnabled}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={0.4}
        maxPolarAngle={Math.PI - 0.4}
      />
    </Canvas>
  );
});

export default RubiksCube;
