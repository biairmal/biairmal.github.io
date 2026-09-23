"use client";

import { Logo, NAV, ShojiLink, useJakartaTime } from "@/components/chrome";

const label = "font-mono text-[11px] uppercase tracking-[0.1em] text-neutral-500 dark:text-[#8b8b8b]";
const underline = "self-start border-b border-transparent pb-[3px] transition-colors hover:border-foreground/50";

const Footer = () => {
  const time = useJakartaTime();

  return (
    <footer className="border-t border-foreground/10 bg-background/55 font-sans backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-8 md:gap-10 md:px-16 md:py-10">
        <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <Logo />
          <nav aria-label="Footer" className="-ml-3 flex flex-wrap gap-1 md:ml-0 md:gap-2">
            {NAV.map((n) => (
              <ShojiLink key={n.href} href={n.href}>
                {n.label}
              </ShojiLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-5 md:grid md:grid-cols-3 md:gap-12">
          <div className="flex flex-col gap-2.5">
            <span className={label}>Contact</span>
            <a href="mailto:bandana.irmal@gmail.com" className={`${underline} text-[15px]`}>
              bandanairmal@gmail.com
            </a>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className={label}>Local time</span>
            <span className="font-mono text-[15px] tabular-nums">
              {time || "--:--:--"} <span className="text-neutral-500 dark:text-[#8b8b8b]">Jakarta · UTC+7</span>
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className={label}>Elsewhere</span>
            <span className="flex gap-5 text-[15px]">
              <a href="https://github.com/biairmal" className={underline}>
                GitHub
              </a>
              <a href="https://www.linkedin.com/in/bandanairmal/" className={underline}>
                LinkedIn
              </a>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 font-mono text-[11px] text-neutral-500 md:flex-row md:items-center md:justify-between md:text-xs dark:text-[#8b8b8b]">
          <span className="md:order-2 flex items-center gap-2 md:gap-2.5">
            <span lang="ja" className="font-jp text-[13px] text-neutral-600 md:text-sm dark:text-neutral-400">
              侍
            </span>
            Planned, built and shipped by hand
          </span>
          <span className="md:order-1">© {new Date().getFullYear()} Bandana Irmal Abdillah</span>
          <a href="#" className={`md:order-3 inline-flex min-h-11 items-center md:min-h-0 ${underline}`}>
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
