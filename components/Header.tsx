"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const Header = () => {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem("theme");
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (nextTheme: Theme) => {
      root.classList.toggle("dark", nextTheme === "dark");
      root.classList.toggle("light", nextTheme === "light");
      root.style.colorScheme = nextTheme;
      setTheme(nextTheme);
    };

    const resolvedTheme: Theme =
      savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : mediaQuery.matches
          ? "dark"
          : "light";

    applyTheme(resolvedTheme);

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        applyTheme(event.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    setMounted(true);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const maxScrollForEffect = 140;
    let ticking = false;

    const updateScrollProgress = () => {
      const rawProgress = Math.min(window.scrollY / maxScrollForEffect, 1);
      // Ease-out curve for smoother visual ramp-up.
      const nextProgress = 1 - (1 - rawProgress) ** 2;
      setScrollProgress(nextProgress);
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(updateScrollProgress);
    };

    updateScrollProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.classList.toggle("light", nextTheme === "light");
    document.documentElement.style.colorScheme = nextTheme;
    setTheme(nextTheme);
  };

  const navLinkClassName =
    "group relative inline-flex h-10 items-center overflow-hidden border border-transparent px-3 text-zinc-800 transition-colors duration-300 dark:text-zinc-100";

  const NavAnimatedLink = ({
    href,
    label,
    onClick,
    fullWidth = false,
  }: {
    href: string;
    label: string;
    onClick?: () => void;
    fullWidth?: boolean;
  }) => (
    <a
      href={href}
      onClick={onClick}
      className={`${navLinkClassName} ${fullWidth ? "w-full justify-start" : "justify-center"}`}
    >
      <span
        aria-hidden="true"
        className={`invisible inline-flex text-sm font-medium ${
          fullWidth ? "justify-start px-4" : "justify-center px-0.5"
        }`}
      >
        {label}
      </span>
      <span
        className={`absolute inset-0 z-10 inline-flex items-center text-sm font-medium transition-transform duration-300 ease-out group-hover:-translate-y-full ${
          fullWidth ? "justify-start px-4" : "justify-center px-0.5"
        }`}
      >
        {label}
      </span>
      <span className="absolute inset-0 translate-y-full bg-zinc-900 transition-transform duration-300 ease-out group-hover:translate-y-0 dark:bg-zinc-100" />
      <span
        className={`absolute inset-0 z-10 inline-flex translate-y-full items-center text-sm font-medium text-zinc-50 transition-transform duration-300 ease-out group-hover:translate-y-0 dark:text-zinc-900 ${
          fullWidth ? "justify-start px-4" : "justify-center px-0.5"
        }`}
      >
        {label}
      </span>
    </a>
  );

  const ThemeToggleButton = ({ fullWidth = false }: { fullWidth?: boolean }) => (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className={`cursor-pointer border border-transparent p-2 text-zinc-700 transition-colors duration-300 hover:bg-zinc-900 hover:text-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-100 dark:hover:text-zinc-900 ${
        fullWidth ? "flex w-full items-center justify-between px-3 py-2 text-left" : ""
      }`}
    >
      {fullWidth ? <span className="text-sm">Toggle dark mode</span> : null}
      <span className="relative block h-5 w-5 overflow-hidden">
        <svg
          viewBox="0 0 24 24"
          className={`absolute inset-0 h-5 w-5 transition-opacity duration-300 ease-in ${
            mounted && theme === "dark" ? "opacity-100" : "opacity-0"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Z" />
          <path d="M12 18a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Z" />
          <path d="M5.64 5.64a1 1 0 0 1 1.41 0l.7.7a1 1 0 1 1-1.41 1.41l-.7-.7a1 1 0 0 1 0-1.41Z" />
          <path d="M16.24 16.24a1 1 0 0 1 1.41 0l.7.7a1 1 0 1 1-1.41 1.41l-.7-.7a1 1 0 0 1 0-1.41Z" />
          <path d="M3 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Z" />
          <path d="M18 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1Z" />
          <path d="M5.64 18.36a1 1 0 0 1 0-1.41l.7-.7a1 1 0 1 1 1.41 1.41l-.7.7a1 1 0 0 1-1.41 0Z" />
          <path d="M16.24 7.76a1 1 0 0 1 0-1.41l.7-.7a1 1 0 0 1 1.41 1.41l-.7.7a1 1 0 0 1-1.41 0Z" />
          <circle cx="12" cy="12" r="4" />
        </svg>

        <svg
          viewBox="0 0 24 24"
          className={`absolute inset-0 h-5 w-5 transition-opacity duration-300 ease-in ${
            mounted && theme === "dark" ? "opacity-0" : "opacity-100"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3c-.16.57-.24 1.17-.24 1.79a7 7 0 0 0 7 7c.62 0 1.22-.08 1.79-.24Z" />
        </svg>
      </span>
    </button>
  );

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 isolate"
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-white/78 dark:bg-zinc-950/82"
          style={{
            opacity: scrollProgress,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.9) 76%, rgba(0,0,0,0.35) 90%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.9) 76%, rgba(0,0,0,0.35) 90%, rgba(0,0,0,0) 100%)",
            transition: "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), backdrop-filter 220ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 md:px-16 md:py-6">
        <Link
          href="/"
          className="font-mono text-lg tracking-tight text-zinc-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.2)] dark:text-zinc-50 dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]"
        >
          biairmal
          <span
            aria-hidden="true"
            className="terminal-cursor ml-1 inline-block h-[1.1em] w-[0.62ch] align-[-0.12em] bg-zinc-700 dark:bg-zinc-200"
          />
        </Link>

        <nav className="hidden items-center gap-2 text-sm md:flex md:gap-3">
          <NavAnimatedLink href="/" label="Home" />
          <NavAnimatedLink href="/#contacts" label="Contacts" />
          <NavAnimatedLink href="/blogs" label="Blogs" />
          <ThemeToggleButton />
        </nav>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M3 12h18" />
            <path d="M3 18h18" />
          </svg>
        </button>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 z-50 h-screen w-72 border-l border-zinc-200 bg-white p-6 shadow-xl transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-950 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="font-mono text-base text-zinc-900 dark:text-zinc-100">menu</span>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-2 text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          <NavAnimatedLink href="/" label="Home" onClick={() => setIsMobileMenuOpen(false)} fullWidth />
          <NavAnimatedLink
            href="/#contacts"
            label="Contacts"
            onClick={() => setIsMobileMenuOpen(false)}
            fullWidth
          />
          <NavAnimatedLink href="/blogs" label="Blogs" onClick={() => setIsMobileMenuOpen(false)} fullWidth />
          <ThemeToggleButton fullWidth />
        </nav>
      </aside>
    </header>
  );
};

export default Header;
