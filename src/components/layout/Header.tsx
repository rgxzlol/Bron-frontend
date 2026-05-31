import Image from "next/image"
import icons from "@/utils/images"
import Link from 'next/link'

const Header = () => {
    return (
        <div className="flex justify-between my-[45px]">
            <div className="flex items-center bg-[#f4f4f8] rounded-[38px] px-5 py-[6px]">
                <label className="flex items-center">
                    <Image
                        className="mr-4"
                        src={icons.search}
                        alt="search"
                    />
                    <input className="w-[600px] h-[25px] mr-1 p-2" placeholder="Поиск..." type="text" />
                </label>

                <button className="p-[9px] bg-white rounded-full">
                    <Image
                        className=""
                        src={icons.filter}
                        alt="filter"
                    />
                </button>
            </div>
            <div className="flex gap-[10px]">
                <button className="flex items-center gap-[18px] bg-white rounded-[27px] p-[7px]">
                    <Image
                        src={icons.ruLang}
                        alt="ruLang"
                    />
                    <p className="pr-[27px] text-[22px] font-semibold">RU</p>
                </button>
                <button className="p-[16px] bg-white">
                    <Image
                        src={icons.notification}
                        alt="notification"
                    />
                </button>
                <Link href='/profile' className="p-[16px] bg-white">
                    <Image
                        src={icons.profileIcon}
                        alt="Profile"
                    />
                </Link>
            </div>

        </div>
    )
}

export default Header