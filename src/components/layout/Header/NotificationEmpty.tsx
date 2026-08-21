import Image from 'next/image'
import { assets } from '@/lib/assets'

export const NotificationEmpty = () => {
    return (
        <div className="flex flex-col items-center mt-8">
            <Image
                src={assets.notification.emptyNotification}
                alt="empty"
                className="mb-[31px]"
            />
            <h1 className="font-semibold text-[20px] text-black mb-2">
                Нет уведомлений!
            </h1>
            <p className="font-semibold text-[16px] text-center text-black/60 mb-[50px]">
                Уведомления о бронях, платежах, акциях и других событиях
            </p>
        </div>
    )
}