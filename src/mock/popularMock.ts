import icons from "@/utils/images";

export interface Popular {
    id: number
    title: string
    rating: number
    time: number
    reviews: number
    desc: string
    img: string
}

export const popular = [
    {
        id: 1,
        title: "Салон красоты",
        rating: 4.3,
        reviews: 132,
        time: 15,
        desc: 'Специализированное помещение, оборудованное для занятий физической культурой',
        img: icons.mockPhoto1
    },
    {
        id: 2,
        title: "Фитнес зал",
        rating: 4.6,
        reviews: 102,
        time: 15,
        desc: 'Специализированное помещение, оборудованное для занятий физической культурой',
        img: icons.mockPhoto2
    },
    {
        id: 3,
        title: "Клиника",
        rating: 4.3,
        reviews: 132,
        time: 15,
        desc: 'Специализированное помещение, оборудованное для занятий физической культурой',
        img: icons.mockPhoto3
    },
]