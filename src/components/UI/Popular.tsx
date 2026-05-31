import { popular } from '@/mock/popularMock'
import icons from '@/utils/images'
import Image from 'next/image'
import Button from './Button'
import Link from 'next/link'

const reviewsCounter = (count: number) => {
    const lastTwo = count % 100
    const last = count % 10

    if (lastTwo >= 11 && lastTwo <= 14) {
        return "отзывов"
    }

    if (last === 1) {
        return "отзыв"
    }

    if (last >= 2 && last <= 4) {
        return "отзыва"
    }

    return "отзывов"
}

const timeCounter = (time: number) => {
    const hours = Math.floor(time / 60)
    const minutes = time % 60

    if (time < 60) {
        return `${time} мин.`
    }

    if (minutes === 0) {
        return `${hours} ч.`
    }

    return `${hours} ч. ${minutes} мин.`
}

const Popular = () => {
    return (
        <div>
            <h4 className='text-[24px] font-semibold mb-[20px]'>
                Попуряные
            </h4>

            <div className='flex gap-[20px] flex-wrap'>
                {popular.map((prev) => (
                    <Link href='/'
                        key={prev.title}
                        className='flex flex-col bg-white rounded-[18px] overflow-hidden max-w-[274px] w-full'
                    >
                        <Image
                            className='w-full h-[180px] object-cover'
                            src={prev.img}
                            alt={prev.title}
                        />

                        <div className='px-[16px] pb-[13px] pt-[12px] flex flex-col gap-[12px]'>
                            <div className='flex flex-col gap-[8px]'>
                                <span className='text-[20px] font-semibold'>
                                    {prev.title}
                                </span>

                                <div className='flex gap-[15px] items-center'>
                                    <div className='flex gap-[6px] items-center'>
                                        <Image
                                            src={icons.starRating}
                                            alt='Rating'
                                        />

                                        <p className='text-[15px] font-semibold'>
                                            {prev.rating}
                                        </p>

                                        <p className='text-[15px] font-semibold opacity-75'>
                                            ({prev.reviews}{" "}
                                            {reviewsCounter(prev.reviews)})
                                        </p>
                                    </div>

                                    <div className='flex gap-[6px] items-center'>
                                        <Image
                                            src={icons.timeIcon}
                                            alt='time'
                                        />

                                        <p className='text-[15px] font-semibold'>
                                            {timeCounter(prev.time)}
                                        </p>
                                    </div>
                                </div>
                                <p className='max-w-[210px] leading-none text-[15px] opacity-75'>
                                    {prev.desc}
                                </p>
                            </div>

                            <Button text='Забронировать' />
                        </div>
                    </Link>
                ))}
                <Link className='flex flex-col items-center justify-center ml-[20px]' href='/'>
                <Image src={icons.blueMore} alt="" />
                    <span className='text-[20px] text-[#0a6af7]'>Смотреть все</span>
                </Link>
            </div>
        </div>
    )
}

export default Popular