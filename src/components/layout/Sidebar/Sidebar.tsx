import { mainNavItems } from "@/config/navigation";
import { Logo } from "@/components/shared/Logo";
import { NavLink } from "@/components/shared/Navlink";

export default function Sidebar() {

  return (
    <aside
      className="sticky top-0 h-screen flex w-[350px] shrink-0 flex-col pt-[41px] mr-[93px]"
    >
      <Logo className="pl-[64px]" />

      <ul className="list-none w-full mt-[47px]">
        {mainNavItems.map((item) => {

          return (
            <li key={item.href} className="w-full">
              <NavLink
                href={item.href}
                className="group relative flex w-full items-center gap-4.5 pl-16 pt-5.5 pb-4 transition-colors duration-500 hover:bg-[#e4e8ff] 
      after:absolute after:-right-[10px] after:top-0 after:h-full after:w-[9px] after:rounded-[9px] after:bg-[#0a6af7] after:opacity-0 after:transition-all after:duration-500 hover:after:right-0 hover:after:opacity-100"
                activeClassName="!text-[#0a6af7] bg-[#e4e8ff] [&_.icon]:bg-[#0a6af7] after:right-0 after:opacity-100"
              >
                <span
                  className="icon h-6 w-6 shrink-0 bg-black transition-colors duration-500 group-hover:bg-[#0a6af7] mask-no-repeat [-webkit-mask-repeat:no-repeat] mask-containt [-webkit-mask-size:contain] mask-center [-webkit-mask-position:center]"
                  style={{
                    width: item.icon.width,
                    height: item.icon.height,
                    WebkitMaskImage: `url(${item.icon.src})`,
                    maskImage: `url(${item.icon.src})`,
                  }}
                  aria-hidden
                />
                <span className="text-[24px] font-semibold text-black/70 transition-colors duration-500 group-hover:text-[#0a6af7]">
                  {item.title}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}