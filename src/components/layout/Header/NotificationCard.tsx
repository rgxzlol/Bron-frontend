import Image from "next/image";

interface NotificationCardProps {
  icon: any;
  title: string;
  description: string;
  time: string;
}

export function NotificationCard({ icon, title, description, time }: NotificationCardProps) {
  return (
    <li className="flex justify-between bg-[var(--bg-surface-muted)] px-2 py-2.5 rounded-[14px] cursor-pointer hover:bg-[var(--bg-hover)] active:scale-[0.99] transition-all duration-200 group">
      <div className="flex items-center gap-[9px]">
        <span className="grid place-items-center bg-[var(--bg-active-soft)] rounded-[11px] p-[13px] transition-transform duration-200 group-hover:scale-105">
          <Image src={icon} alt="" className="w-5 h-5 object-contain" />
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-[16px] text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--primary)]">
            {title}
          </h3>
          <p className="font-semibold text-[12px] text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
      <div className="flex items-start">
        <span className="font-semibold text-[16px] text-[var(--text-secondary)] mt-1">{time}</span>
      </div>
    </li>
  );
}
