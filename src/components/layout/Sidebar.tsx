import icons from "@/utils/images"
import Link from "next/link"
import s from './sidebar.module.css'

const menu = [
  { title: "Главная", icon: icons.home },
  { title: "Карта", icon: icons.map },
  { title: "Бизнес страница", icon: icons.business },
  { title: "Мои брони", icon: icons.booking },
  { title: "Поддержка", icon: icons.support },
]

const Sidebar = () => {
  return (
    <div className="flex w-[350px] shrink-0 flex-col pt-[37px]">
      <Link href='/' className={`${s.title}mb-7 text-[60px] font-semibold self-start `}>Bron</Link>

      <ul className={s.menu}>
        {menu.map((item) => (
          <li key={item.title}>
            <Link href="/" className={s.link}>
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
              <span className="text-2xl">{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Sidebar