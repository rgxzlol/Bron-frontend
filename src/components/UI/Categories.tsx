import { categories } from "@/mock/categoryMock"
import Image from "next/image"
import Link from "next/link"
import s from './categories.module.css'
import icons from "@/utils/images"

const counter = (count: number) => {
    if (count === 1) {
        return "сервис"
    } else if (count > 1 && count <= 4) {
        return "сервиса"
    } else {
        return "сервисов"
    }
}

const Categories = () => {
    return (
        <div className="my-[35px]">
            <h3 className="text-[24px] font-semibold mb-[60px]">Категории</h3>
            <div className="flex gap-[50px]">
                {categories.map((category) => (
                    <Link className={`flex gap-1 flex-col items-center max-w-[130px] w-full text-center py-[15px] ${s.links}`} href="/" key={category.id}>
                        <div
                            style={{ backgroundColor: category.color }}
                            className="p-[22px] rounded-full max-w-[75px]">
                            <Image src={category.icon} alt={category.title} />
                        </div>
                        <span className="min-h-[64px] font-semibold">
                            {category.title}
                        </span>
                        <span className="text-[14px] opacity-75">
                            {category.count} {counter(category.count)}
                        </span>
                    </Link>
                ))}
                <Link className={`flex gap-1 flex-col items-center max-w-[130px] w-full text-center py-[15px] ${s.links}`} href='/'>
                    <div className='p-[22px] rounded-full max-w-[75px] bg-[#ffebd3]'>
                        <Image src={icons.сategory6} alt="" />
                    </div>
                    <span className="min-h-[64px] font-semibold">Больше</span>
                    <span className="text-[14px] opacity-75" >Посмотреть все</span>
                </Link>
            </div>
        </div>
    )
}

export default Categories