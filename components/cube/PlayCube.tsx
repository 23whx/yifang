"use client";

import { useRef, useState } from "react";
import RubiksCube, { RubiksCubeHandle } from "./RubiksCube";

interface Props {
  labels: { scramble: string; reset: string; hint: string };
  className?: string;
  heightClass?: string;
  /** 招牌按钮放在纸白底还是墨黑底 */
  onDark?: boolean;
}

export default function PlayCube({ labels, className, heightClass = "h-[420px] sm:h-[520px]", onDark }: Props) {
  const cube = useRef<RubiksCubeHandle>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className={className}>
      <div className={`relative w-full ${heightClass}`}>
        <RubiksCube ref={cube} onBusyChange={setBusy} />
      </div>
      <div className={`flex flex-wrap items-center justify-between gap-3 border-t-2 pt-4 ${onDark ? "border-paper" : "border-ink"}`}>
        <div className="flex gap-2">
          <button onClick={() => cube.current?.scramble()} disabled={busy} className={`btn-sign ${onDark ? "btn-sign-paper" : ""}`}>
            {labels.scramble}
          </button>
          <button onClick={() => cube.current?.reset()} className={`btn-sign btn-sign-outline ${onDark ? "text-paper border-paper hover:bg-paper hover:text-ink" : ""}`}>
            {labels.reset}
          </button>
        </div>
        <p className={`text-xs ${onDark ? "text-paper" : "text-ink-3"}`}>{labels.hint}</p>
      </div>
    </div>
  );
}
