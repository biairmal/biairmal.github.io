import type { Metadata } from "next";
import SlashText from "@/components/SlashText";
import Experience from "@/components/experimental/Experience";
import { About, Approach, Contact, Toolkit, Work } from "@/components/HomeSections";

export const metadata: Metadata = {
  title: "biairmal · experimental",
  description: "The digital samurai, in three dimensions. A scroll-driven 3D version of biairmal.github.io.",
  robots: { index: false },
};

const careerStartDate = new Date(2022, 9, 1);
const getYears = () => {
  const t = new Date();
  let y = t.getFullYear() - careerStartDate.getFullYear();
  if (t.getMonth() < careerStartDate.getMonth() || (t.getMonth() === careerStartDate.getMonth() && t.getDate() < careerStartDate.getDate())) y--;
  return y;
};

// Each [data-shot] element tells the 3D camera which storyboard shot to hold when it is in view.
// data-at="0" holds the shot when the element's top reaches the top of the screen; without it,
// when the element is centred. Empty spacers give the film room to play between sections.
export default function Experimental() {
  const years = getYears();
  return (
    <div id="film" className="dark relative font-sans text-foreground" style={{ ["--foreground" as string]: "#ededed", ["--background" as string]: "#0a0a0a" }}>
      <Experience rootId="film" />

      {/* 01 · stance */}
      <section data-shot="s01" data-at="0" className="relative flex min-h-svh items-center">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-16">
          <div className="flex max-w-[620px] flex-col gap-5 xl:gap-8">
            <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-400 xl:text-xs">
              <span className="size-1.5 bg-accent motion-safe:animate-[hero-pulse_2.4s_infinite]" />
              Available for freelance work
            </p>
            <h1 className="text-[40px] font-medium leading-[1.06] tracking-[-0.045em] xl:text-[70px] xl:leading-[1.04]">
              Every line of code,<br className="hidden xl:inline" /> a deliberate cut.
            </h1>
            <p className="text-[15px] leading-[1.6] text-neutral-400 xl:max-w-[480px] xl:text-[17px] xl:leading-[1.65]">
              I&apos;m Bandana, a software engineer who owns the whole path — from the first plan to a stable production release.
            </p>
            <div className="flex flex-col gap-2.5 xl:flex-row xl:gap-3">
              <a href="#contacts" className="slash inline-flex h-[52px] items-center justify-center gap-3 bg-foreground px-7 text-[15px] font-medium text-background xl:h-[54px]">
                <SlashText>Start a project</SlashText>
              </a>
              <a href="#work" className="inline-flex h-[52px] items-center justify-center border border-foreground/20 px-7 text-[15px] font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background xl:h-[54px]">
                See recent work
              </a>
            </div>
          </div>
        </div>
        <span className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8b8b8b]">Scroll to draw</span>
      </section>

      {/* 02 · the cut, scrubbed by scroll · 03 · the rise as the moon wanes */}
      <div data-shot="s02a" data-at="0" aria-hidden="true" className="h-[80svh]" />
      <div data-shot="s02b" data-at="0" aria-hidden="true" className="h-[90svh]" />
      <div data-shot="s03" data-at="0" aria-hidden="true" className="h-[70svh]" />

      {/* 04 · about */}
      <div data-shot="s04">
        <About years={years} />
      </div>

      {/* 05 · approach: pinned while the camera walks the path */}
      <div className="relative h-[260svh]">
        <div data-shot="s05a" data-at="0" className="absolute top-0 h-px w-full" />
        <div className="sticky top-0 flex min-h-svh items-center">
          <Approach />
        </div>
        <div data-shot="s05b" data-at="1" className="absolute bottom-0 h-px w-full" />
      </div>

      {/* 06 · work · 07 · toolkit */}
      <div data-shot="s06">
        <Work />
      </div>
      <div data-shot="s07">
        <Toolkit />
      </div>

      {/* 08 · eclipse: totality, then the blood moon */}
      <div data-shot="s08a" data-at="0" aria-hidden="true" className="h-[90svh]" />
      <div data-shot="s08b" data-at="0" aria-hidden="true" className="h-[70svh]" />

      {/* 09 · contact */}
      <div data-shot="s09">
        <Contact />
      </div>
    </div>
  );
}
