import Image from "next/image";
import type { ImageProps } from "next/image";

export type NotificationCardProps = {
  icon: ImageProps["src"];
  title: string;
  description: string;
  time: string;
  testId?: string;
};

export function NotificationCard({
  icon,
  title,
  description,
  time,
  testId,
}: NotificationCardProps) {
  return (
    <li
      className="group flex cursor-pointer items-center justify-between gap-3 rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-3 shadow-[0_2px_10px_rgba(17,24,39,0.03)] transition-all duration-200 hover:bg-[var(--bg-hover)] active:scale-[0.99]"
      data-testid={testId}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-[var(--bg-active-soft)] transition-transform duration-200 group-hover:scale-105">
          <Image src={icon} alt="" className="h-5 w-5 object-contain" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="truncate text-[14px] font-bold text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--accent-fg)]">
            {title}
          </h3>
          <p className="truncate text-[12px] font-medium text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
      <span className="shrink-0 text-[13px] font-medium text-[var(--text-muted)]">{time}</span>
    </li>
  );
}
