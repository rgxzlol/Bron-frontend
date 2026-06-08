import Image from "next/image";

interface NotificationCardProps {
  icon: any;
  title: string;
  description: string;
  time: string;
}

export function NotificationCard({ icon, title, description, time }: NotificationCardProps) {
  return (
    <li className="flex justify-between bg-[#FAFAFF] px-2 py-2.5 rounded-[14px] cursor-pointer hover:bg-[#F0F0FF] active:scale-[0.99] transition-all duration-200 group">
      <div className="flex items-center gap-[9px]">
        <span className="grid place-items-center bg-[#e8effe] rounded-[11px] p-[13px] transition-transform duration-200 group-hover:scale-105">
          <Image src={icon} alt="" className="w-5 h-5 object-contain" />
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-[16px] text-black transition-colors duration-200 group-hover:text-[#0A6AF7]">
            {title}
          </h3>
          <p className="font-semibold text-[12px] text-black opacity-60">{description}</p>
        </div>
      </div>
      <div className="flex items-start">
        <span className="font-semibold text-[16px] text-black opacity-60 mt-1">{time}</span>
      </div>
    </li>
  );
}
