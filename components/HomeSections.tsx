import type { ReactNode } from "react";

// Recent work (NDA): fill these in. The first entry starts expanded.
const WORK = [
  {
    title: "[Project type — e.g. Internal payments platform]",
    meta: "[COMPANY] · [YEAR] · [Your role]",
    problem: "[What was broken, slow or missing — and why it mattered to the business or users.]",
    approach: "[What you planned and built. Name the one technical decision that made the difference.]",
    result: "[Outcome — e.g. processing time cut from hours to minutes]",
    stack: ["[TECH]", "[TECH]", "[TECH]", "[TECH]"],
  },
  {
    title: "[Project type — e.g. Customer-facing API]",
    meta: "[COMPANY] · [YEAR] · [Your role]",
    problem: "[The problem in one or two sentences.]",
    approach: "[Your approach in one or two sentences.]",
    result: "[Outcome — e.g. p95 latency down 40%]",
    stack: ["[TECH]", "[TECH]", "[TECH]"],
  },
  {
    title: "[Project type — e.g. Legacy system migration]",
    meta: "[COMPANY] · [YEAR] · [Your role]",
    problem: "[The problem in one or two sentences.]",
    approach: "[Your approach in one or two sentences.]",
    result: "[Outcome — e.g. zero-downtime cutover]",
    stack: ["[TECH]", "[TECH]", "[TECH]"],
  },
  {
    title: "[Project type — e.g. Internal admin dashboard]",
    meta: "[COMPANY] · [YEAR] · [Your role]",
    problem: "[The problem in one or two sentences.]",
    approach: "[Your approach in one or two sentences.]",
    result: "[Outcome — e.g. support tickets halved]",
    stack: ["[TECH]", "[TECH]", "[TECH]"],
  },
];

const STEPS = [
  { name: "Plan", body: "Requirements, architecture and risks mapped before any code. You get a written scope and a realistic timeline." },
  { name: "Build", body: "Small, reviewed, tested increments. Working software every week instead of a big reveal at the end." },
  { name: "Ship", body: "Automated pipelines, staged rollouts and a rollback plan. Release day feels like any other day." },
  { name: "Sustain", body: "Monitoring, alerts and follow-up iterations, so it keeps working long after launch." },
];

const TOOLKIT = [
  { group: "Backend", items: [".NET Core", "Spring Boot (Java)", "Golang", "Node.js"] },
  { group: "Frontend", items: ["React", "Next.js", "Blazor", "Tailwind CSS"] },
  { group: "Database", items: ["PostgreSQL", "SQL Server", "Oracle", "Cosmos DB", "Redis"] },
  { group: "DevOps & cloud", items: ["Docker", "CI/CD pipelines", "Azure", "AWS"] },
];

const container = "mx-auto w-full max-w-7xl px-6 md:px-16";
const muted = "text-neutral-600 dark:text-neutral-400";
const faint = "text-neutral-500 dark:text-[#8b8b8b]";
const h2 = "text-[32px] font-medium leading-[1.1] tracking-[-0.04em] xl:text-[52px] xl:leading-[1.08]";

const SectionLabel = ({ kanji, children }: { kanji: string; children: ReactNode }) => (
  <p className={`flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.08em] xl:gap-3 xl:text-xs ${faint}`}>
    <span lang="ja" className="font-jp text-[15px] tracking-normal text-foreground xl:text-base">
      {kanji}
    </span>
    {children}
  </p>
);

export const About = ({ years }: { years: number }) => {
  const facts = [
    ["Based in", "Jakarta, Indonesia · UTC+7"],
    ["Experience", `${years}+ years, since 2021`],
    ["Focus", "Backend, full-stack when needed"],
    ["Education", "B.Sc. Computer Science, Universitas Padjadjaran"],
  ];
  return (
    <section id="about" className={`${container} flex scroll-mt-20 flex-col gap-8 pt-24 pb-12 xl:gap-16 xl:pt-[140px] xl:pb-20`}>
      <div className="flex flex-col gap-4 xl:gap-5">
        <SectionLabel kanji="人">About</SectionLabel>
        <h2 className={h2}>
          Backend by trade,<br className="hidden xl:inline" /> full-stack when it counts.
        </h2>
      </div>
      <div className="flex flex-col gap-8 xl:flex-row xl:justify-between xl:gap-20">
        <div className={`flex max-w-[660px] flex-col gap-4 text-[15px] leading-[1.6] xl:gap-5 xl:text-[17px] xl:leading-[1.65] ${muted}`}>
          <p className="text-neutral-800 dark:text-neutral-300">
            I&apos;m Bandana Irmal Abdillah, a software engineer based in Jakarta, Indonesia, with {years}+ years of
            experience building digital products. I focus on backend development, and I&apos;m comfortable on the frontend
            when a project needs it.
          </p>
          <p>
            Today I work at a software house, collaborating with different clients across multiple projects and
            technologies. I also take on the occasional freelance project — new problems keep the skills sharp.
          </p>
        </div>
        <dl className="flex flex-col border-b border-foreground/10 xl:w-[460px] xl:shrink-0">
          {facts.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1.5 border-t border-foreground/10 py-3.5 xl:flex-row xl:items-baseline xl:justify-between xl:gap-6 xl:py-[18px]">
              <dt className={`font-mono text-[11px] uppercase tracking-[0.06em] xl:text-xs ${faint}`}>{k}</dt>
              <dd className="text-[15px] xl:text-right xl:text-base">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export const Approach = () => (
  <section id="approach" className={`${container} flex scroll-mt-20 flex-col gap-10 pt-24 pb-12 xl:gap-[72px] xl:pt-[120px] xl:pb-20`}>
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-[60px]">
      <div className="flex flex-col gap-4 xl:gap-5">
        <SectionLabel kanji="道">Approach</SectionLabel>
        <h2 className={`${h2} xl:max-w-[720px]`}>One clean path from plan to production.</h2>
      </div>
      <p className={`text-[15px] leading-[1.6] xl:w-[400px] xl:shrink-0 xl:text-base xl:leading-[1.65] ${muted}`}>
        No mystery sprints. Every project moves through the same four stages, so you always know where it stands and
        what ships next.
      </p>
    </div>
    <div className="relative">
      {/* the path: a vertical line on mobile, a horizontal one fading at both ends on desktop */}
      <div
        aria-hidden="true"
        className="absolute top-1.5 bottom-1.5 left-1 w-px bg-foreground/20 xl:top-[5px] xl:right-0 xl:bottom-auto xl:left-0 xl:h-px xl:w-auto xl:bg-transparent xl:bg-linear-to-r xl:from-transparent xl:via-foreground/20 xl:to-transparent"
      />
      <ol className="flex flex-col gap-8 pl-7 xl:grid xl:grid-cols-4 xl:gap-12 xl:pl-0">
        {STEPS.map((s, i) => (
          <li key={s.name} className="relative flex flex-col gap-2 xl:gap-[18px]">
            <span aria-hidden="true" className="absolute top-1 -left-7 size-[9px] rotate-45 border border-foreground bg-background xl:static xl:m-px" />
            <span className={`font-mono text-[11px] xl:pt-3 xl:text-xs ${faint}`}>0{i + 1}</span>
            <span className="text-xl font-medium tracking-[-0.02em] xl:text-2xl">{s.name}</span>
            <span className={`text-sm leading-[1.6] xl:text-[15px] xl:leading-[1.65] ${muted}`}>{s.body}</span>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

const Nda = ({ className = "" }: { className?: string }) => (
  <span className={`border border-foreground/15 font-mono text-[10px] tracking-[0.08em] xl:px-2.5 xl:py-[5px] xl:text-[11px] ${muted} ${className}`}>NDA</span>
);

// A native <details> accordion: `name` makes opening one row close the others.
export const Work = () => (
  <section id="work" className={`${container} flex scroll-mt-20 flex-col gap-8 pt-24 pb-12 xl:gap-14 xl:pt-[140px] xl:pb-20`}>
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-[60px]">
      <div className="flex flex-col gap-4 xl:gap-5">
        <SectionLabel kanji="戦">Recent work</SectionLabel>
        <h2 className={h2}>Shipped at [COMPANY].</h2>
      </div>
      <p className={`text-[15px] leading-[1.6] xl:w-[420px] xl:shrink-0 xl:leading-[1.65] ${muted}`}>
        Most of this work is under NDA, so there are no screenshots — just the problem, how I approached it, and what
        changed.
      </p>
    </div>
    <div className="border-b border-foreground/10">
      {WORK.map((w, i) => (
        <details key={i} name="work" open={i === 0} className="group border-t border-foreground/10 transition-colors hover:bg-foreground/[0.025]">
          <summary className="flex min-h-[88px] cursor-pointer list-none items-start gap-3.5 py-5 xl:min-h-[108px] xl:items-center xl:gap-8 xl:py-7 [&::-webkit-details-marker]:hidden">
            <span className={`w-[22px] shrink-0 pt-1 font-mono text-xs group-open:text-accent xl:w-10 xl:pt-0 xl:text-[13px] ${faint}`}>0{i + 1}</span>
            <span className="flex grow flex-col gap-2">
              <span className="text-lg leading-[1.3] font-medium tracking-[-0.02em] xl:text-[26px] xl:tracking-[-0.025em]">{w.title}</span>
              <span className={`flex items-center gap-2 text-xs xl:text-sm ${faint}`}>
                <Nda className="px-1.5 py-0.5 xl:hidden" />
                {w.meta}
              </span>
            </span>
            <span className={`hidden font-mono text-xs xl:block ${faint}`}>{w.stack.slice(0, 3).join(" · ")}</span>
            <Nda className="hidden xl:inline" />
            <span aria-hidden="true" className="-mt-2 flex size-11 shrink-0 items-center justify-center xl:mt-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4 transition-transform duration-300 group-open:rotate-45 xl:size-[18px]">
                <path d="M9 2v14M2 9h14" />
              </svg>
            </span>
          </summary>
          <div className="flex flex-col gap-5 pb-7 pl-9 xl:gap-8 xl:pr-[76px] xl:pb-11 xl:pl-[72px]">
            <div className="flex flex-col gap-5 xl:grid xl:grid-cols-3 xl:gap-12">
              {(
                [
                  ["The problem", w.problem],
                  ["The approach", w.approach],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1.5 xl:gap-2.5">
                  <span className={`font-mono text-[10px] uppercase tracking-[0.1em] xl:text-[11px] ${faint}`}>{k}</span>
                  <span className="text-sm leading-[1.6] text-neutral-700 xl:text-[15px] xl:leading-[1.65] dark:text-neutral-300">{v}</span>
                </div>
              ))}
              <div className="flex flex-col gap-1.5 xl:gap-2.5">
                <span className={`font-mono text-[10px] uppercase tracking-[0.1em] xl:text-[11px] ${faint}`}>The result</span>
                <span className="text-[17px] leading-[1.4] font-medium tracking-[-0.015em] xl:text-xl">{w.result}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 xl:gap-2">
              {w.stack.map((t, j) => (
                <span key={j} className="bg-foreground/5 px-2 py-[5px] font-mono text-[11px] text-neutral-700 xl:px-3 xl:py-[7px] xl:text-xs dark:text-neutral-300">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </details>
      ))}
    </div>
  </section>
);

export const Toolkit = () => (
  <section id="toolkit" className={`${container} flex scroll-mt-20 flex-col gap-8 pt-24 pb-12 xl:gap-14 xl:pt-[140px] xl:pb-20`}>
    <div className="flex flex-col gap-4 xl:gap-5">
      <SectionLabel kanji="武">Toolkit</SectionLabel>
      <h2 className={h2}>Tools I trust in production.</h2>
    </div>
    <div className="grid grid-cols-2 gap-x-6 gap-y-8 xl:grid-cols-4 xl:gap-12">
      {TOOLKIT.map((g) => (
        <div key={g.group} className="flex flex-col gap-3 xl:gap-4">
          <h3 className={`font-mono text-[11px] font-normal uppercase tracking-[0.06em] xl:text-xs ${faint}`}>{g.group}</h3>
          <ul className="flex flex-col gap-2 text-base xl:gap-2.5 xl:text-lg xl:tracking-[-0.01em]">
            {g.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

// id="contacts" matches the Header and Footer links. At least a screen tall: the contact
// scene (small moon, second samurai) plays behind it.
export const Contact = () => (
  <section id="contacts" className={`${container} flex min-h-[900px] scroll-mt-20 flex-col gap-7 pt-28 pb-16 xl:min-h-[960px] xl:gap-12 xl:pt-[180px]`}>
    <SectionLabel kanji="連">Contact</SectionLabel>
    <h2 className="text-[44px] leading-[1.02] font-medium tracking-[-0.05em] xl:text-[104px] xl:leading-none xl:tracking-[-0.055em]">
      Have something<br className="hidden xl:inline" /> that needs to ship?
    </h2>
    <p className={`text-[15px] leading-[1.6] xl:max-w-[520px] xl:text-[17px] xl:leading-[1.65] ${muted}`}>
      Tell me what you&apos;re building — or just say hello. I&apos;m open to freelance projects and always happy to talk
      shop.
    </p>
    <a
      href="mailto:bandana.irmal@gmail.com"
      className="slash inline-flex items-center gap-2.5 self-start border-b border-foreground/25 pb-1.5 text-[22px] font-medium tracking-[-0.02em] xl:gap-4 xl:text-4xl xl:tracking-[-0.03em]"
    >
      <span className="slash-text">
        <span className="slash-top">bandanairmal@gmail.com</span>
        <span className="slash-bottom" aria-hidden="true">bandanairmal@gmail.com</span>
      </span>
      <span className="slash-line" aria-hidden="true" />
      <svg viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-[18px] xl:size-[26px]" aria-hidden="true">
        <path d="M7 19L19 7M9 7h10v10" />
      </svg>
    </a>
    <div className={`flex gap-6 text-[15px] xl:gap-8 ${muted}`}>
      <a href="https://github.com/biairmal" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground">
        GitHub
      </a>
      <a href="https://www.linkedin.com/in/bandanairmal/" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground">
        LinkedIn
      </a>
    </div>
  </section>
);
