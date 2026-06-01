import { mainNavItems } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import s from "./sidebar.module.css";

export default function Sidebar() {
  return (
    <aside
      className={`${s.sidebar} flex w-[320px] shrink-0 flex-col pt-[37px] pl-[30px]`}
    >
      <Link href="/" className={`${s.title} self-start text-[60px] font-semibold`}>
        {siteConfig.name}
      </Link>

      <ul className={`${s.menu} mt-[25px]`}>
        {mainNavItems.map((item) => (
          <li className={s.title} key={item.href}>
            <Link href={item.href} className={s.link}>
              <span
                className={s.icon}
                style={{
                  width: item.icon.width,
                  height: item.icon.height,
                  WebkitMaskImage: `url(${item.icon.src})`,
                  maskImage: `url(${item.icon.src})`,
                }}
                aria-hidden
              />
              <span className="text-xl">{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
