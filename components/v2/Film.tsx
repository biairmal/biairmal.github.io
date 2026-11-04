"use client";

import { useEffect, useRef, useState } from "react";

// Hosts the /v2 film: a fixed WebGL canvas behind the page, the text scrims, the timecode and the loader.
// It follows the site's theme toggle (dark first); three.js loads on the client only.
const Film = ({ rootId }: { rootId: string }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    if (!document.createElement("canvas").getContext("webgl2")) {
      setFailed(true);
      return;
    }
    import("./scene").then(({ startFilm }) => {
      const root = document.getElementById(rootId);
      if (cancelled || !canvas.current || !root) return;
      stop = startFilm({ canvas: canvas.current, root, base: "/v2", clock: clock.current, onProgress: setProgress, onReady: () => setReady(true) });
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [rootId]);

  const pct = Math.round(progress * 100);
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[#f3f0ea] dark:bg-[#0b0303]">
        <canvas ref={canvas} className="absolute inset-0 size-full" />
        {/* phones skip the post pass, so the vignette is drawn here */}
        <div className="absolute inset-0 md:hidden dark:bg-[radial-gradient(ellipse_at_50%_45%,transparent_45%,rgba(0,0,0,.55)_100%)]" />
        {/* scrims where the text sits: the left on desktop, top and bottom on phones. Black at night, paper by day */}
        <div className="absolute inset-0 hidden bg-linear-to-r from-[#f3f0ea]/85 via-[#f3f0ea]/30 to-transparent md:block dark:from-black/60 dark:via-black/15" />
        <div className="absolute inset-x-0 top-0 h-[42%] bg-linear-to-b from-[#f3f0ea]/85 to-transparent md:hidden dark:from-black/70" />
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-linear-to-t from-[#f3f0ea]/90 to-transparent md:hidden dark:from-black/75" />
      </div>
      {/* the instant's timecode: ticks, slows, stops (■ frozen) while you scroll, resumes at Contact */}
      <span
        ref={clock}
        aria-hidden="true"
        className="group pointer-events-none fixed right-5 bottom-5 z-10 hidden items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-neutral-500 tabular-nums md:flex dark:text-[#8b8b8b]"
      >
        <span>00:00:00.000</span>
        <span lang="ja" className="order-first font-jp text-foreground">
          刹那
        </span>
        <span className="hidden items-center gap-1.5 text-accent group-data-[frozen=1]:inline-flex">
          <span className="size-1.5 bg-accent" />
          FROZEN
        </span>
      </span>
      {!ready && !failed && (
        <div aria-hidden="true" className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-[#f3f0ea] text-[#171717] dark:bg-[#050303] dark:text-[#ededed]">
          <span lang="ja" className="font-jp text-3xl font-semibold">
            刹那
          </span>
          <span className="block h-px w-56 overflow-hidden bg-current/15">
            <span className="block h-px bg-current transition-[width] duration-200" style={{ width: `${pct}%` }} />
          </span>
          <span className="font-mono text-xs tracking-[0.3em] text-[#8b8b8b]">{String(pct).padStart(3, "0")} / 100 · HOLDING THE INSTANT</span>
        </div>
      )}
    </>
  );
};

export default Film;
