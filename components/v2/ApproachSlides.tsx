"use client";

import { useEffect, useRef, useState } from "react";
import { STEPS } from "@/components/HomeSections";

// The four stages are the four moves of the kata: see it, draw, cut, resheathe.
const KATA = [
  ["目付", "Metsuke"],
  ["抜付", "Nukitsuke"],
  ["切付", "Kiritsuke"],
  ["納刀", "Nōtō"],
];

// Approach for /v2 (v7's slides): the section pins while the camera walks the stepping stones toward the gate, one stage
// per ghost. Each stop has two anchors (the camera holds between them): stage i is shown over progress [i/4, (i+1)/4].
const ApproachSlides = () => {
  const wrap = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const run = r.height - window.innerHeight;
      const p = run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
      setProgress(p);
      setStep(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length * 0.999)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section id="approach" ref={wrap} className="relative h-[400svh]" aria-label="Approach">
      {/* the pinned run is 300svh: progress p sits at top = p × 300svh */}
      {["s04a", "s04b", "s04c", "s04d"].flatMap((shot, i) =>
        [0.07, 0.18].map((d) => <div key={shot + d} data-shot={shot} data-at="0" className="absolute h-px w-full" style={{ top: `${(i / 4 + d) * 300}svh` }} />),
      )}

      <div className="sticky top-0 flex h-svh flex-col justify-between pt-24 pb-10 md:pt-32 md:pb-16">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-16">
          <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500 xl:text-xs dark:text-[#8b8b8b]">
            <span lang="ja" className="font-jp text-[15px] tracking-normal text-foreground xl:text-base">
              道
            </span>
            Approach
          </p>
          <h2 className="mt-4 max-w-[640px] text-[30px] font-medium leading-[1.1] tracking-[-0.04em] xl:mt-5 xl:text-[48px] xl:leading-[1.08]">
            One clean path from plan to production.
          </h2>
        </div>

        <div className="mx-auto w-full max-w-7xl px-6 md:px-16">
          {/* one stage at a time; the others are stacked underneath, faded out */}
          <div className="relative grid max-w-[460px]">
            {STEPS.map((s, i) => (
              <div
                key={s.name}
                aria-hidden={i !== step}
                className="col-start-1 row-start-1 flex flex-col gap-3 transition-[opacity,transform] duration-500 ease-out"
                style={{ opacity: i === step ? 1 : 0, transform: `translateY(${i === step ? 0 : i < step ? -16 : 16}px)` }}
              >
                <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-accent uppercase xl:text-xs">
                  0{i + 1} / 0{STEPS.length} ·
                  <span lang="ja" className="font-jp tracking-normal">
                    {KATA[i][0]}
                  </span>
                  {KATA[i][1]}
                </span>
                <span className="text-[34px] font-medium leading-none tracking-[-0.03em] xl:text-[56px]">{s.name}</span>
                <span className="text-[15px] leading-[1.6] text-neutral-700 xl:text-[17px] dark:text-neutral-300">{s.body}</span>
              </div>
            ))}
          </div>

          {/* the path's progress: four marks, one per ghost */}
          <div className="mt-8 flex items-center gap-3 xl:mt-10">
            {STEPS.map((s, i) => (
              <span key={s.name} className={`size-[7px] rotate-45 border ${i <= step ? "border-foreground bg-foreground" : "border-foreground/40"}`} />
            ))}
            <span className="relative ml-2 h-px flex-1 bg-foreground/15">
              <span className="absolute inset-y-0 left-0 bg-foreground" style={{ width: `${progress * 100}%` }} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApproachSlides;
