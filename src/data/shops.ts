import { assets } from "@/lib/assets"
import { ShopsType } from "@/types/shops.types"


export const ShopsPlace: ShopsType[] = [
    {
        id: 1,
        title: "BronFitness Club",
        lat: 41.3111,
        lng: 69.2797,
        type: "Спорт зал",
        img: assets.map.photo1,
        desc: "Современный фитнес клуб с тренажерным залом,групповые тренировки,SPA и зона отдыха",
        rating: 0.0,
        reviews: 0,
        hours: "09:00 - 20:00",
        freeSeats: 12,
        price: 80000,
        address: "ул. Сайрам 123, Ташкент",
        district: "Яккасарайский район",
        phone: "+998 99 999 99 99",
        category: "Тренажерный зал",
        distance: '1.2 км',
        time: 60
    },
    {
        id: 2,
        title: "Bean House Coffee",
        lat: 41.315,
        lng: 69.27,
        type: "Кофейня",
        img: assets.map.photo2,
        desc: "Уютная кофейня со specialty coffee, свежей выпечкой, завтраками и зоной для работы с ноутбуком",
        rating: 4.8,
        reviews: 124,
        hours: "08:00 - 23:00",
        freeSeats: 18,
        price: 45000,
        address: "ул. Афросиаб 45, Ташкент",
        district: "Мирабадский район",
        phone: "+998 90 123 45 67",
        category: "Кофейня",
        distance: '1.2 км',
        time: 60
    },
    {
        id: 3,
        title: "City Hospital",
        lat: 41.3085,
        lng: 69.252,
        type: "Больница",
        img: assets.map.photo1,
        desc: "Многопрофильная клиника: терапевт, стоматолог, кардиолог. Запись к врачу онлайн.",
        rating: 4.6,
        reviews: 312,
        hours: "08:00 - 22:00",
        freeSeats: 6,
        price: 120000,
        address: "ул. Шахрисабз 12, Ташкент",
        district: "Мирабадский район",
        phone: "+998 71 200 20 20",
        category: "Консультация",
        distance: "2.4 км",
        time: 30,
        services: [
            {
                id: "therapist",
                title: "Консультация терапевта",
                description: "Прием и осмотр врача-терапевта, постановка диагноза, рекомендации.",
                priceFrom: 120000,
                durationMin: 30,
                icon: assets.categories.health
            },
            {
                id: "cardio",
                title: "Консультация кардиолога",
                description: "Осмотр, рекомендации, интерпретация результатов обследований.",
                priceFrom: 180000,
                durationMin: 30,
                icon: assets.categories.health
            },
            {
                id: "dentist",
                title: "Консультация стоматолога",
                description: "Осмотр полости рта, диагностика, план лечения и рекомендации.",
                priceFrom: 150000,
                durationMin: 30,
                icon: assets.categories.health
            },
            {
                id: "pediatrics",
                title: "Консультация педиатра",
                description: "Осмотр ребенка, рекомендации и план лечения при необходимости.",
                priceFrom: 140000,
                durationMin: 30,
                icon: assets.categories.health
            }
        ]
    },
    {
        id: 4,
        title: "Beauty Bron Salon",
        lat: 41.3100,
        lng: 69.2800,
        type: "Салон красоты",
        img: assets.map.photo2,
        desc: "Премиальный салон красоты: стрижки, укладки, маникюр и уход за кожей.",
        rating: 4.9,
        reviews: 88,
        hours: "10:00 - 21:00",
        freeSeats: 4,
        price: 150000,
        address: "ул. Тараса Шевченко 21, Ташкент",
        district: "Мирабадский район",
        phone: "+998 90 999 88 77",
        category: "Услуги красоты",
        distance: '0.8 км',
        time: 45
    }
]