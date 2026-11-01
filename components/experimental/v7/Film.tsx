"use client";

import { useEffect, useRef, useState } from "react";

// Hosts the v7 film: a fixed WebGL canvas behind the page, and the loader. three.js loads on the client only.
const Film = ({ rootId }: { rootId: string }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // a night piece: dark theme while this page is open
  useEffect(() => {
    const root = document.documentElement;
    const had = { dark: root.classList.contains("dark"), light: root.classList.contains("light"), scheme: root.style.colorScheme };
    root.classList.add("dark");
    root.classList.remove("light");
    root.style.colorScheme = "dark";
    return () => {
      root.classList.toggle("dark", had.dark);
      root.classList.toggle("light", had.light);
      root.style.colorScheme = had.scheme;
    };
  }, []);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    if (!document.createElement("canvas").getContext("webgl2")) {
      setFailed(true);
      return;
    }
    import("./film").then(({ startFilm }) => {
      const root = document.getElementById(rootId);
      if (cancelled || !canvas.current || !root) return;
      stop = startFilm({ canvas: canvas.current, root, base: "/experimental/v6", onProgress: setProgress, onReady: () => setReady(true) });
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [rootId]);

  const pct = Math.round(progress * 100);
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[#0b0303]">
        <canvas ref={canvas} className="absolute inset-0 size-full" />
        {/* phones skip the post pass, so the vignette is drawn here */}
        <div className="absolute inset-0 md:hidden" style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,.55) 100%)" }} />
        {/* scrims where the text sits: the left on desktop, top and bottom on phones */}
        <div className="absolute inset-0 hidden bg-linear-to-r from-black/60 via-black/15 to-transparent md:block" />
        <div className="absolute inset-x-0 top-0 h-[42%] bg-linear-to-b from-black/70 to-transparent md:hidden" />
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-linear-to-t from-black/75 to-transparent md:hidden" />
      </div>
      {!ready && !failed && (
        <div aria-hidden="true" className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-[#050303] text-[#ededed]">
          <span lang="ja" className="font-jp text-3xl font-semibold">侍</span>
          <span className="block h-px w-56 overflow-hidden bg-white/15">
            <span className="block h-px bg-white transition-[width] duration-200" style={{ width: `${pct}%` }} />
          </span>
          <span className="font-mono text-xs tracking-[0.3em] text-[#8b8b8b]">{String(pct).padStart(3, "0")} / 100 · LIGHTING THE PATH</span>
        </div>
      )}
    </>
  );
};

export default Film;
