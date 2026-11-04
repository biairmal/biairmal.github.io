import type { Metadata } from "next";
import SlashText from "@/components/SlashText";
import Film from "@/components/v2/Film";
import ApproachSlides from "@/components/v2/ApproachSlides";
import { About, Contact, Toolkit, Work } from "@/components/HomeSections";

export const metadata: Metadata = {
  title: "biairmal · v2",
  description: "One Instant: a scroll-driven 3D version of biairmal.github.io, where time stops as you scroll.",
  robots: { index: false },
};

const careerStartDate = new Date(2022, 9, 1);
const getYears = () => {
  const t = new Date();
  let y = t.getFullYear() - careerStartDate.getFullYear();
  if (t.getMonth() < careerStartDate.getMonth() || (t.getMonth() === careerStartDate.getMonth() && t.getDate() < careerStartDate.getDate())) y--;
  return y;
};

// Storyboard v8, "One Instant" (design/storyboard-v8). Each [data-shot] element tells the camera which shot to hold
// when it is in view (data-at="0": when its top reaches the top of the screen; otherwise when it is centred).
export default function V2() {
  const years = getYears();
  return (
    <div id="film" className="relative font-sans text-foreground">
      <Film rootId="film" />

      {/* S01 · the moment before: behind him, the blood moon behind his hat */}
      <section data-shot="s01" data-at="0" className="relative flex min-h-svh items-start pt-28 md:items-center md:pt-0">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-16">
          <div className="flex max-w-[560px] flex-col gap-5 xl:gap-8">
            <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-600 xl:text-xs dark:text-neutral-400">
              <span className="size-1.5 bg-accent motion-safe:animate-[hero-pulse_2.4s_infinite]" />
              Available for freelance work
            </p>
            <h1 className="text-[38px] font-medium leading-[1.06] tracking-[-0.045em] xl:text-[66px] xl:leading-[1.04]">
              Every line of code,<br className="hidden xl:inline" /> a deliberate cut.
            </h1>
            <p className="text-[15px] leading-[1.6] text-neutral-600 xl:max-w-[460px] xl:text-[17px] xl:leading-[1.65] dark:text-neutral-400">
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
        <span className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8b8b8b]">Scroll to stop time</span>
      </section>

      {/* S02 · time slows: the circle starts, clockwise round his left · S03 · bullet time, round to his front */}
      <div data-shot="s02" className="h-[110svh]" aria-hidden="true" />
      <div data-shot="s03a" className="h-[70svh]" aria-hidden="true" />

      {/* About: his front, low, the garden behind him */}
      <div data-shot="s03b" className="flex min-h-svh items-end pb-10 md:items-center md:pb-0">
        <About years={years} />
      </div>

      {/* S04 · the kata: round his right side onto the stepping stones, one ghost per stage */}
      <ApproachSlides />

      {/* S05 · work: whip pan to the cut targets · S06 · toolkit: the rack on the veranda */}
      <div data-shot="s05">
        <Work />
      </div>
      <div data-shot="s06">
        <Toolkit />
      </div>

      {/* S07 · time resumes: back across the garden to the moon · S08 · contact */}
      <div data-shot="s07" className="h-[80svh]" aria-hidden="true" />
      <div data-shot="s08">
        <Contact />
      </div>
    </div>
  );
}
