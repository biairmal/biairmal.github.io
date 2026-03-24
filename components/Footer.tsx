"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const Footer = () => {
  const [jakartaTime, setJakartaTime] = useState("");

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const updateTime = () => {
      setJakartaTime(formatter.format(new Date()));
    };

    updateTime();
    const intervalId = window.setInterval(updateTime, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <footer className="border-t border-zinc-200/70 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 md:px-16 md:py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="font-mono text-lg tracking-tight text-zinc-950 dark:text-zinc-50">
            biairmal
            <span
              aria-hidden="true"
              className="terminal-cursor ml-1 inline-block h-[1.1em] w-[0.62ch] align-[-0.12em] bg-zinc-700 dark:bg-zinc-200"
            />
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <a
              href="/"
              className="rounded-md px-3 py-2 text-zinc-800 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              Home
            </a>
            <a
              href="/#contacts"
              className="rounded-md px-3 py-2 text-zinc-800 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              Contacts
            </a>
            <a
              href="/blogs"
              className="rounded-md px-3 py-2 text-zinc-800 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              Blogs
            </a>
          </nav>
        </div>

        <div className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            Contacts:{" "}
            <a
              href="mailto:bandana.irmal@gmail.com"
              className="underline decoration-zinc-500 underline-offset-4 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              bandanairmal@gmail.com
            </a>
          </p>
          <p className="font-mono">Jakarta local time: {jakartaTime}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
