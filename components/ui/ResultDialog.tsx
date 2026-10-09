"use client";
import { useEffect, useId, useRef } from "react";

/** Mount once per completed result; native modal supplies Escape and focus trapping. */
export default function ResultDialog({ title, reason, locale }: { title: string; reason: string; locale: "zh" | "en" }) {
  const ref = useRef<HTMLDialogElement>(null), headingRef = useRef<HTMLHeadingElement>(null), id = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    // A focused footer button scrolls long explanations past their beginning.
    // Start reading at the heading while retaining the native modal focus trap.
    headingRef.current?.focus({ preventScroll: true });
    if (dialog) dialog.scrollTop = 0;
    return () => { dialog?.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={`${id}-title`} aria-describedby={`${id}-reason`} className="m-auto max-h-[85dvh] w-[min(92vw,560px)] overflow-y-auto rounded-xl border-2 border-[#ae8550] bg-[#f3e7cd] p-6 text-[#392616] shadow-2xl backdrop:bg-black/60 sm:p-8">
    <p className="text-sm font-bold text-[#803d2b]">{locale === "zh" ? "结果与原因" : "Result and explanation"}</p>
    <h2 ref={headingRef} tabIndex={-1} id={`${id}-title`} className="mt-3 text-2xl font-bold">{title}</h2>
    <p id={`${id}-reason`} className="mt-5 whitespace-pre-line text-base leading-8">{reason}</p>
    <form method="dialog" className="mt-6"><button className="btn-sign min-h-11">{locale === "zh" ? "明白了，查看棋盘／牌面" : "Understood — review the position"}</button></form>
  </dialog>;
}
