"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo, NAV, ShojiLink, useJakartaTime } from "@/components/chrome";

type Theme = "light" | "dark";

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
};

const toggleTheme = () => {
  const next: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next);
};

const SunIcon = ({ className }: { className: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v1M12 20v1M3 12h1M20 12h1M5.6 5.6l.7.7M17.7 17.7l.7.7M5.6 18.4l.7-.7M17.7 6.3l.7-.7" />
  </svg>
);

const MoonIcon = ({ className }: { className: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3c-.16.57-.24 1.17-.24 1.79a7 7 0 0 0 7 7c.62 0 1.22-.08 1.79-.24Z" />
  </svg>
);

// Icons swap with the .dark class, so nothing depends on React state (no hydration flash).
const ThemeToggle = ({ labelled = false }: { labelled?: boolean }) => (
  <button
    type="button"
    onClick={toggleTheme}
    aria-label="Toggle dark mode"
    className={
      labelled
        ? "flex h-11 items-center gap-2.5 border border-foreground/20 px-3.5 text-sm transition-colors hover:bg-foreground hover:text-background"
        : "flex size-11 items-center justify-center text-neutral-600 transition-colors duration-300 hover:bg-foreground hover:text-background dark:text-neutral-400"
    }
  >
    <SunIcon className="hidden size-[18px] dark:block md:size-5" />
    <MoonIcon className="size-[18px] dark:hidden md:size-5" />
    {labelled && (
      <>
        <span className="hidden dark:inline">Light mode</span>
        <span className="dark:hidden">Dark mode</span>
      </>
    )}
  </button>
);

const label = "font-mono text-[11px] uppercase tracking-[0.1em] text-neutral-500 dark:text-[#8b8b8b]";
const rise = "motion-safe:animate-[menu-rise_0.5s_cubic-bezier(0.3,0.7,0.2,1)_both]";

// Mobile menu: a shoji panel slides in from the right over the dimmed page.
const MobileMenu = ({ onClose }: { onClose: () => void }) => {
  const time = useJakartaTime();
  return (
    <div className="font-sans md:hidden">
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 bg-black/55 backdrop-blur-[2px] motion-safe:animate-[menu-dim_0.3s_ease-out_both]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="shoji-lattice fixed inset-y-0 right-0 flex w-[330px] max-w-[88vw] flex-col overflow-hidden border-l border-foreground/12 bg-background pb-7 shadow-[-24px_0_48px_rgba(0,0,0,0.5)] motion-safe:animate-[shoji-in_0.5s_cubic-bezier(0.3,0.7,0.2,1)_both]"
      >
        <span lang="ja" aria-hidden="true" className="pointer-events-none absolute right-3.5 bottom-[150px] font-jp text-[180px] leading-none text-foreground/[0.04]">
          侍
        </span>
        <div className="relative flex h-16 shrink-0 items-center justify-between pr-3 pl-7">
          <span className={label}>Menu</span>
          <button type="button" autoFocus aria-label="Close menu" onClick={onClose} className="flex size-11 items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>
        </div>
        <nav aria-label="Mobile" className="relative flex flex-col px-7 pt-6">
          {NAV.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={onClose}
              style={{ animationDelay: `${0.12 + i * 0.06}s` }}
              className={`flex items-baseline gap-4 border-t border-foreground/10 py-[18px] last:border-b ${rise}`}
            >
              <span lang="ja" aria-hidden="true" className="w-[18px] font-jp text-sm text-neutral-500 dark:text-[#8b8b8b]">
                {n.kanji}
              </span>
              <span className="text-[30px] font-medium tracking-[-0.03em]">{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className={`relative flex items-center justify-between px-7 pt-7 [animation-delay:0.3s] ${rise}`}>
          <span className={label}>Theme</span>
          <ThemeToggle labelled />
        </div>
        <div className={`relative mt-auto flex flex-col gap-[18px] px-7 [animation-delay:0.36s] ${rise}`}>
          <Link
            href="/#contacts"
            onClick={onClose}
            className="flex h-[52px] items-center justify-center border border-foreground/20 text-[15px] font-medium transition-colors active:bg-foreground active:text-background"
          >
            Let&apos;s talk
          </Link>
          <div className="flex justify-between font-mono text-[11px] text-neutral-500 dark:text-[#8b8b8b]">
            <span>bandanairmal@gmail.com</span>
            <span className="tabular-nums">Jakarta {time}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const backdrop = useRef<HTMLDivElement>(null);

  // theme: the saved choice, else the system's (followed live until the user picks one)
  useEffect(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const saved = localStorage.getItem("theme");
    applyTheme(saved === "dark" || saved === "light" ? saved : system.matches ? "dark" : "light");
    const onSystem = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) applyTheme(e.matches ? "dark" : "light");
    };
    system.addEventListener("change", onSystem);
    return () => system.removeEventListener("change", onSystem);
  }, []);

  // transparent over the hero; a blurred backdrop fades in over the first 140px of scroll
  useEffect(() => {
    const bg = backdrop.current;
    if (!bg) return;
    const sync = () => {
      const p = Math.min(window.scrollY / 140, 1);
      bg.style.opacity = String(1 - (1 - p) ** 2);
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  // open menu: Escape closes it, the page behind doesn't scroll
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 font-sans">
      <div
        ref={backdrop}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-background/80 opacity-0 backdrop-blur-lg [mask-image:linear-gradient(to_bottom,#000_60%,transparent)]"
      />
      <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between pr-3 pl-5 md:h-24 md:px-16">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-2 md:flex">
          {NAV.map((n) => (
            <ShojiLink key={n.href} href={n.href}>
              {n.label}
            </ShojiLink>
          ))}
          <ThemeToggle />
          <Link
            href="/#contacts"
            className="ml-4 inline-flex h-11 items-center border border-foreground/20 px-5 text-sm transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
          >
            Let&apos;s talk
          </Link>
        </nav>
        <div className="flex items-center md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="flex size-11 items-center justify-center text-foreground"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M3 8h16M8 14h11" />
            </svg>
          </button>
        </div>
      </div>
      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
    </header>
  );
};

export default Header;
