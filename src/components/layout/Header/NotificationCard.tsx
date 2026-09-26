import Image from "next/image";
import type { ImageProps } from "next/image";

export type NotificationCardProps = {
  icon: ImageProps["src"];
  title: string;
  description: string;
  time: string;
  onClick?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  testId?: string;
};

export function NotificationCard({
  icon,
  title,
  description,
  time,
  onClick,
  onDelete,
  deleteLabel,
  testId,
}: NotificationCardProps) {
  return (
    <li className="group flex items-center gap-2 rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-3 shadow-[0_2px_10px_rgba(17,24,39,0.03)] transition-all duration-200 hover:bg-[var(--bg-hover)]" data-testid={testId}>
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-[var(--bg-active-soft)] transition-transform duration-200 group-hover:scale-105">
            <Image src={icon} alt="" className="h-5 w-5 object-contain" />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[14px] font-bold text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--accent-fg)]">
              {title}
            </span>
            <span className="truncate text-[12px] font-medium text-[var(--text-secondary)]">{description}</span>
          </span>
        </span>
        <time
          dateTime={time}
          className="w-[88px] shrink-0 whitespace-pre-line text-right text-[12px] font-medium leading-tight text-[var(--text-muted)]"
        >
          {time}
        </time>
      </button>
      {onDelete ? (
        <button
          type="button"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[#e02424]"
          aria-label={deleteLabel}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          ×
        </button>
      ) : null}
    </li>
  );
}
