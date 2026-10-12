"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ISOLATED_PAGE } from "@/lib/cross-origin";

/**
 * The cross-origin isolation headers only apply to a fresh document load. After a client-side
 * navigation into an engine page (or out of one, where isolation would block ad frames), reload once
 * so the page gets the policy its URL is served with. A direct load is never reloaded, so a host
 * without those headers cannot cause a loop.
 */
export default function CrossOriginGuard() {
  const pathname = usePathname();
  useEffect(() => {
    if (ISOLATED_PAGE.test(pathname) === window.crossOriginIsolated) return;
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const loadedPath = entry ? new URL(entry.name).pathname : pathname;
    if (loadedPath.replace(/\/?$/, "/") !== pathname.replace(/\/?$/, "/")) window.location.reload();
  }, [pathname]);
  return null;
}
