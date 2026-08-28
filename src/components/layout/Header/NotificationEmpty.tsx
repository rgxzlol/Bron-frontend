import Image from "next/image";
import { assets } from "@/lib/assets";

export const NotificationEmpty = () => {
  return (
    <div className="flex flex-col items-center px-6 pt-8 text-center">
      <Image
        src={assets.notification.emptyNotification}
        alt=""
        className="mb-[31px] h-auto w-[220px] max-w-full"
      />
      <h1 className="mb-2 text-[22px] font-bold text-[var(--text-primary)]">
        Нет уведомлений!
      </h1>
      <p className="mb-[50px] max-w-[280px] text-[15px] font-medium text-[var(--text-secondary)]">
        Уведомления о бронях, платежах, акциях и других событиях
      </p>
    </div>
  );
};
