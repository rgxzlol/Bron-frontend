import { assets } from "@/lib/assets"
import { ShopsType } from "@/types/shops.types"


export const ShopsPlace: ShopsType[] = [
    {
        id: 1,
        title: "data.shops.bronFitness.title",
        lat: 41.3111,
        lng: 69.2797,
        type: "data.shops.bronFitness.type",
        img: assets.map.photo1,
        desc: "data.shops.bronFitness.desc",
        rating: 0.0,
        reviews: 0,
        hours: "09:00 - 20:00",
        freeSeats: 12,
        price: 80000,
        address: "data.shops.bronFitness.address",
        district: "data.shops.bronFitness.district",
        phone: "+998 99 999 99 99",
        category: "data.shops.bronFitness.category",
        distance: '1.2 км',
        time: 60
    },
    {
        id: 2,
        title: "data.shops.beanHouse.title",
        lat: 41.315,
        lng: 69.27,
        type: "data.shops.beanHouse.type",
        img: assets.map.photo2,
        desc: "data.shops.beanHouse.desc",
        rating: 4.8,
        reviews: 124,
        hours: "08:00 - 23:00",
        freeSeats: 18,
        price: 45000,
        address: "data.shops.beanHouse.address",
        district: "data.shops.beanHouse.district",
        phone: "+998 90 123 45 67",
        category: "data.shops.beanHouse.category",
        distance: '1.2 км',
        time: 60
    },
    {
        id: 3,
        title: "data.shops.cityHospital.title",
        lat: 41.3085,
        lng: 69.252,
        type: "data.shops.cityHospital.type",
        img: assets.map.photo1,
        desc: "data.shops.cityHospital.desc",
        rating: 4.6,
        reviews: 312,
        hours: "08:00 - 22:00",
        freeSeats: 6,
        price: 120000,
        address: "data.shops.cityHospital.address",
        district: "data.shops.cityHospital.district",
        phone: "+998 71 200 20 20",
        category: "data.shops.cityHospital.category",
        distance: "2.4 км",
        time: 30,
        services: [
            {
                id: "therapist",
                title: "data.shops.cityHospital.services.therapist.title",
                description: "data.shops.cityHospital.services.therapist.description",
                priceFrom: 120000,
                durationMin: 30,
                icon: assets.categories.health
            },
            {
                id: "cardio",
                title: "data.shops.cityHospital.services.cardio.title",
                description: "data.shops.cityHospital.services.cardio.description",
                priceFrom: 180000,
                durationMin: 30,
                icon: assets.categories.health
            },
            {
                id: "dentist",
                title: "data.shops.cityHospital.services.dentist.title",
                description: "data.shops.cityHospital.services.dentist.description",
                priceFrom: 150000,
                durationMin: 30,
                icon: assets.categories.health
            },
            {
                id: "pediatrics",
                title: "data.shops.cityHospital.services.pediatrics.title",
                description: "data.shops.cityHospital.services.pediatrics.description",
                priceFrom: 140000,
                durationMin: 30,
                icon: assets.categories.health
            }
        ]
    },
    {
        id: 4,
        title: "data.shops.beautyBron.title",
        lat: 41.3100,
        lng: 69.2800,
        type: "data.shops.beautyBron.type",
        img: assets.map.photo2,
        desc: "data.shops.beautyBron.desc",
        rating: 4.9,
        reviews: 88,
        hours: "10:00 - 21:00",
        freeSeats: 4,
        price: 150000,
        address: "data.shops.beautyBron.address",
        district: "data.shops.beautyBron.district",
        phone: "+998 90 999 88 77",
        category: "data.shops.beautyBron.category",
        distance: '0.8 км',
        time: 45
    }
]