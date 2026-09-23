import Link from "next/link";
import { useSyncExternalStore } from "react";

// Pieces shared by the Header and Footer.

export const NAV = [
  { href: "/", label: "Home", kanji: "一" },
  { href: "/#contacts", label: "Contacts", kanji: "二" },
  { href: "/blogs", label: "Blogs", kanji: "三" },
];

// 侍 | biairmal▌ (the terminal cursor blinks)
export const Logo = () => (
  <Link href="/" aria-label="biairmal, home" className="flex items-center gap-2.5 text-foreground md:gap-3.5">
    <span lang="ja" aria-hidden="true" className="font-jp text-xl leading-none font-semibold md:text-2xl">
      侍
    </span>
    <span aria-hidden="true" className="h-3.5 w-px bg-foreground/20 md:h-[18px]" />
    <span className="flex items-center font-mono text-base tracking-[-0.02em] md:text-lg">
      biairmal
      <span aria-hidden="true" className="terminal-cursor ml-1 inline-block h-[1.1em] w-[0.62ch] bg-zinc-700 dark:bg-zinc-200" />
    </span>
  </Link>
);

// Shoji hover (styles in globals.css): two lattice panels slide in from the sides and close in
// the middle; the two clipped copies turn the label dark exactly where each panel covers it.
export const ShojiLink = ({ href, children, onClick }: { href: string; children: string; onClick?: () => void }) => (
  <Link href={href} onClick={onClick} className="shoji text-sm text-neutral-600 dark:text-neutral-400">
    <span>{children}</span>
    <span className="shoji-l" aria-hidden="true">
      {children}
    </span>
    <span className="shoji-r" aria-hidden="true">
      {children}
    </span>
  </Link>
);

// Live Jakarta time, HH:MM:SS; empty on the server and before the first tick.
const jakarta = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const everySecond = (tick: () => void) => {
  const id = window.setInterval(tick, 1000);
  return () => window.clearInterval(id);
};
export const useJakartaTime = () =>
  useSyncExternalStore(
    everySecond,
    () => jakarta.format(Date.now()),
    () => ""
  );
