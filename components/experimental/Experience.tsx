"use client";

import { useEffect, useRef, useState } from "react";

// Hosts the WebGL film behind the /experimental page: a fixed canvas, the overlay that slices
// the screen at the cut, and the prologue loader. three.js loads only on the client.
const Experience = ({ rootId }: { rootId: string }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // the film is a night piece: dark theme while this page is open
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
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) {
      setFailed(true);
      return;
    }
    import("./engine").then(({ startExperience }) => {
      if (cancelled || !canvas.current || !overlay.current) return;
      const root = document.getElementById(rootId);
      if (!root) return;
      stop = startExperience({
        canvas: canvas.current,
        overlay: overlay.current,
        root,
        modelUrl: "/experimental/ronin.glb",
        texturesBase: "/experimental",
        onProgress: (p) => setProgress(p),
        onReady: () => setReady(true),
      });
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [rootId]);

  const pct = Math.round(progress * 100);
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[#05060a]">
        <canvas ref={canvas} className="absolute inset-0 size-full" />
        <canvas ref={overlay} className="absolute inset-0 size-full opacity-0" />
        {/* a soft scrim on the left, where the text sits */}
        <div className="absolute inset-0 bg-linear-to-r from-black/55 via-black/15 to-transparent" />
      </div>
      {!ready && !failed && (
        <div aria-hidden="true" className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-[#050506] text-[#ededed] transition-opacity">
          <span lang="ja" className="font-jp text-3xl font-semibold">侍</span>
          <span className="block h-px w-56 overflow-hidden bg-white/15">
            <span className="block h-px bg-white transition-[width] duration-200" style={{ width: `${pct}%` }} />
          </span>
          <span className="font-mono text-xs tracking-[0.3em] text-[#8b8b8b]">{String(pct).padStart(3, "0")} / 100 · SHARPENING</span>
        </div>
      )}
    </>
  );
};

export default Experience;
