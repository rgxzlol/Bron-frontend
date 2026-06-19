"use client"

import { mainNavItems } from "@/config/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./sidebar.module.css";
import { Logo } from "@/components/shared/Logo";
import { NavLink } from "@/components/shared/Navlink";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={`${s.sidebar} flex w-[320px] shrink-0 flex-col pt-[37px] pl-[30px] mr-[60px]`}
    >
      <Logo />

      <ul className={`${s.menu} mt-[25px]`}>
        {mainNavItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li className={s.title} key={item.href}>
              {/* <Link
                href={item.href}
                className={`${s.link} ${isActive ? s.active : ""}`}
              >
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
              </Link> */}

              <NavLink
                href={item.href}
                className={s.link}
                activeClassName={s.active}
              >
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
              </NavLink>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}