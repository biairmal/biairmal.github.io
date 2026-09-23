import HeroCanvas from "@/components/HeroCanvas";

const Hero = ({ years }: { years: number }) => (
  <section className="relative overflow-hidden font-sans xl:h-[920px]">
    {/* Fixed moon-and-samurai background for the whole home page (see HeroCanvas). */}
    <HeroCanvas className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-lvh w-full" />
    {/* Where the moon and samurai are laid out; also reserves their space on mobile. */}
    <div
      data-hero-frame
      className="relative mx-auto mt-11 aspect-[390/470] w-full max-w-[560px] xl:absolute xl:top-[10px] xl:left-[calc(50%-120px)] xl:mt-0 xl:aspect-[1000/900] xl:h-[min(900px,calc(100lvh-20px))] xl:w-auto xl:max-w-none"
    />

    <div className="relative mx-auto h-full w-full max-w-7xl px-6 pb-16 md:px-16 xl:pb-0">
      <div className="relative z-10 flex max-w-[620px] flex-col gap-5 xl:gap-8 xl:pt-[232px]">
        <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-600 xl:text-xs dark:text-neutral-400">
          <span className="size-1.5 bg-accent motion-safe:animate-[hero-pulse_2.4s_infinite]" />
          Available for freelance work
        </p>
        <h1 className="text-[40px] font-medium leading-[1.06] tracking-[-0.045em] xl:text-[70px] xl:leading-[1.04]">
          Every line of code,<br className="hidden xl:inline" /> a deliberate cut.
        </h1>
        <p className="text-[15px] leading-[1.6] text-neutral-600 xl:max-w-[480px] xl:text-[17px] xl:leading-[1.65] dark:text-neutral-400">
          I&apos;m Bandana, a software engineer who owns the whole path — from the first plan to a stable production
          release.<span className="hidden xl:inline"> Clear scope, clean code, calm launches.</span>
        </p>
        <div className="flex flex-col gap-2.5 xl:flex-row xl:gap-3">
          <a
            href="#contacts"
            className="slash inline-flex h-[52px] items-center justify-center gap-3 bg-foreground px-7 text-[15px] font-medium text-background xl:h-[54px]"
          >
            <span className="slash-text">
              <span className="slash-top">Start a project</span>
              <span className="slash-bottom" aria-hidden="true">Start a project</span>
            </span>
            <span className="slash-line" aria-hidden="true" />
            <svg className="hidden xl:block" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" aria-hidden="true">
              <path d="M2 8h11M9 4l4 4-4 4" />
            </svg>
          </a>
          <a
            href="#work"
            className="inline-flex h-[52px] items-center justify-center border border-foreground/20 px-7 text-[15px] font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background xl:h-[54px]"
          >
            See recent work
          </a>
        </div>
        <div className="flex gap-5 font-mono text-[11px] tracking-[0.04em] text-neutral-500 xl:hidden dark:text-[#8b8b8b]">
          <span>{years}+ yrs shipping</span>
          <span>Jakarta</span>
          <span>UTC+7</span>
        </div>
      </div>

      <div className="absolute top-[780px] left-16 hidden gap-12 font-mono text-xs tracking-[0.04em] text-neutral-500 xl:flex dark:text-[#8b8b8b]">
        <span>{years}+ yrs shipping software</span>
        <span>Based in Jakarta</span>
        <span>UTC+7</span>
      </div>

      <div className="absolute top-[790px] left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2.5 xl:flex">
        <span aria-hidden="true" className="block h-16 w-px overflow-hidden bg-foreground/10">
          <span className="block h-6 w-px bg-foreground motion-safe:animate-[hero-drip_2s_ease-in-out_infinite]" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 dark:text-[#8b8b8b]">Scroll to draw</span>
      </div>
    </div>

    <div className="absolute top-[250px] right-12 hidden items-center gap-4 [writing-mode:vertical-rl] xl:flex">
      <span lang="ja" className="font-jp text-[15px] tracking-[0.6em] text-neutral-600 dark:text-neutral-400">一刀両断</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 dark:text-[#8b8b8b]">one stroke, decisive</span>
    </div>
  </section>
);

export default Hero;
