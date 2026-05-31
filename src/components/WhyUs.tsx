import icons from "@/utils/images"
import Button from "./UI/Button"
import Image from "next/image"

const WhyUs = () => {
    return (
        <div className="my-[36px] mb-[100px]">
            <h4 className="text-[24px] font-semibold mb-[16px]">Как это работает?</h4>
            <div className="flex gap-[22px]">
                <div className="flex items-center gap-[13px] py-[15px] px-[15px] bg-white">
                    <p className="text-center text-[32px] bg-[#f9f9fd] py-[18px] px-[32px] rounded-full max-w-[80px] text-[#0a6af7] font-semibold">1</p>
                    <div className="flex flex-col gap-[7px]">
                        <p className="font-semibold max-w-[90px]">Выбераете сервис</p>
                        <p className="text-[14px] font-semibold max-w-[144px] opacity-75">Выбераете сервис который вам нужен</p>
                    </div>
                </div>
                <div className="flex items-center gap-[13px] py-[15px] px-[15px] bg-white">
                    <p className="text-center text-[32px] bg-[#f9f9fd] py-[18px] px-[32px] rounded-full max-w-[80px] text-[#0a6af7] font-semibold">2</p>
                    <div className="flex flex-col gap-[7px]">
                        <p className="font-semibold max-w-[90px]">Потбираете время</p>
                        <p className="text-[14px] font-semibold max-w-[144px] opacity-75">Выбераете время и дату</p>
                    </div>
                </div>
                <div className="flex items-center gap-[13px] py-[15px] px-[15px] bg-white">
                    <p className="text-center text-[32px] bg-[#f9f9fd] py-[18px] px-[32px] rounded-full max-w-[80px] text-[#0a6af7] font-semibold">3</p>
                    <div className="flex flex-col gap-[7px]">
                        <p className="font-semibold max-w-[90px]">Потбираете время</p>
                        <p className="text-[14px] font-semibold max-w-[144px] opacity-75">Оплачиваете выбраный сервис</p>
                    </div>
                </div>
                <div className="flex items-center gap-[13px] py-[15px] px-[15px] bg-white">
                    <p className="text-center text-[32px] bg-[#f9f9fd] py-[18px] px-[32px] rounded-full max-w-[80px] text-[#0a6af7] font-semibold">4</p>
                    <div className="flex flex-col gap-[7px]">
                        <p className="font-semibold max-w-[90px]">Получите услугу</p>
                        <p className="text-[14px] font-semibold max-w-[144px] opacity-75">Получайте услугу от профисионалов</p>
                    </div>
                </div>

            </div>
            <div className="flex relative mt-[70px]">
                <div>
                    <div className="flex flex-col gap-[9px] mb-[70px]">
                        <p className="text-[32px] font-semibold max-w-[400px]">Для крупных бизнесов и преопринемателей</p>
                        <p className="font-semibold max-w-[210px] opacity-75">Заходи в Bron и развивай свой бизнес</p>
                    </div>
                    <Button text="Начать" />
                </div>
                <Image className="absolute right-0 top-[-150px] " src={icons.HomePng} alt="home" />
            </div>
        </div>
    )
}

export default WhyUs