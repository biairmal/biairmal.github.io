"use client";

import { useEffect, useRef, useState } from "react";
import { STEPS } from "@/components/HomeSections";

// Approach for the v7 film: the section pins while the camera walks the lantern path, and shows one
// stage at a time (Plan → Build → Ship → Sustain), each as the camera passes its lantern.
// The outer element carries the camera anchors (c03a at its top, c03b at its bottom).
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
      <div data-shot="c03a" data-at="0" className="absolute top-0 h-px w-full" />
      <div data-shot="c03b" data-at="1" className="absolute bottom-0 h-px w-full" />

      <div className="sticky top-0 flex h-svh flex-col justify-between pt-24 pb-10 md:pt-32 md:pb-16">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-16">
          <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[#8b8b8b] xl:text-xs">
            <span lang="ja" className="font-jp text-[15px] tracking-normal text-foreground xl:text-base">道</span>
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
                <span className="font-mono text-[11px] tracking-[0.12em] text-[#c9a46a] xl:text-xs">
                  0{i + 1} / 0{STEPS.length}
                </span>
                <span className="text-[34px] font-medium leading-none tracking-[-0.03em] xl:text-[56px]">{s.name}</span>
                <span className="text-[15px] leading-[1.6] text-neutral-300 xl:text-[17px]">{s.body}</span>
              </div>
            ))}
          </div>

          {/* the path's progress: four marks, one per lantern */}
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
