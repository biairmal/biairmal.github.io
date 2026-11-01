import type { Metadata } from "next";
import SlashText from "@/components/SlashText";
import Film from "@/components/experimental/v7/Film";
import { About, Approach, Contact, Toolkit, Work } from "@/components/HomeSections";

export const metadata: Metadata = {
  title: "biairmal · experimental v7",
  description: "Facing the Moon: a scroll-driven 3D version of biairmal.github.io.",
  robots: { index: false },
};

const careerStartDate = new Date(2022, 9, 1);
const getYears = () => {
  const t = new Date();
  let y = t.getFullYear() - careerStartDate.getFullYear();
  if (t.getMonth() < careerStartDate.getMonth() || (t.getMonth() === careerStartDate.getMonth() && t.getDate() < careerStartDate.getDate())) y--;
  return y;
};

// Storyboard v7. Each [data-shot] element tells the camera which shot to hold when it is in view
// (data-at="0": when its top reaches the top of the screen; otherwise when it is centred).
export default function ExperimentalV7() {
  const years = getYears();
  return (
    <div id="film" className="relative font-sans text-foreground">
      <Film rootId="film" />

      {/* 01 · the moment before: close on him, hand on the hilt */}
      <section data-shot="c01" data-at="0" className="relative flex min-h-svh items-start pt-28 md:items-center md:pt-0">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-16">
          <div className="flex max-w-[560px] flex-col gap-5 xl:gap-8">
            <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-400 xl:text-xs">
              <span className="size-1.5 bg-accent motion-safe:animate-[hero-pulse_2.4s_infinite]" />
              Available for freelance work
            </p>
            <h1 className="text-[38px] font-medium leading-[1.06] tracking-[-0.045em] xl:text-[66px] xl:leading-[1.04]">
              Every line of code,<br className="hidden xl:inline" /> a deliberate cut.
            </h1>
            <p className="text-[15px] leading-[1.6] text-neutral-400 xl:max-w-[460px] xl:text-[17px] xl:leading-[1.65]">
              I&apos;m Bandana, a software engineer who owns the whole path — from the first plan to a stable production release.
            </p>
            <div className="hidden gap-3 md:flex">
              <a href="#contacts" className="slash inline-flex h-[52px] items-center justify-center gap-3 bg-foreground px-7 text-[15px] font-medium text-background">
                <SlashText>Start a project</SlashText>
              </a>
              <a href="#work" className="inline-flex h-[52px] items-center justify-center border border-foreground/20 px-7 text-[15px] font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background">
                See recent work
              </a>
            </div>
          </div>
        </div>
        <span className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8b8b8b]">Scroll to draw</span>
      </section>

      {/* 02 · the circle and the cut */}
      <div className="h-[60svh]" aria-hidden="true" />
      <div data-shot="c02" className="flex min-h-svh items-end pb-10 md:items-center md:pb-0">
        <About years={years} />
      </div>

      {/* 03 · the lantern path to the house, pinned while the camera walks it */}
      <div className="relative h-[260svh]">
        <div data-shot="c03a" data-at="0" className="absolute top-0 h-px w-full" />
        <div className="sticky top-0 flex min-h-svh items-center">
          <Approach />
        </div>
        <div data-shot="c03b" data-at="1" className="absolute bottom-0 h-px w-full" />
      </div>

      {/* 04 · work: the targets in the yard · 05 · toolkit: the weapons */}
      <div data-shot="c04">
        <Work />
      </div>
      <div data-shot="c05">
        <Toolkit />
      </div>

      {/* 06 · back down the path, behind him: the blood moon */}
      <div className="h-[80svh]" aria-hidden="true" />
      <div data-shot="c06">
        <Contact />
      </div>
    </div>
  );
}
