import type { ReactNode } from 'react';

export function SectionHeading({ index, eyebrow, title, aside }: { index: string; eyebrow: string; title: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex flex-col gap-3">
        <span data-reveal className="label-caps">
          {index} — {eyebrow}
        </span>
        <h2 data-reveal className="text-[clamp(34px,4vw,48px)] leading-[1.08] font-extrabold tracking-[-0.01em] uppercase">
          {title}
        </h2>
      </div>
      {aside}
    </div>
  );
}
