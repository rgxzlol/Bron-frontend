"use client"

import mapboxgl from "mapbox-gl"
import { useEffect, useRef, useState } from "react"
import { ShopsPlace } from "@/data/shops"
import { ShopsType } from "@/types/shops.types"
import { businessMatchesMapFilter } from "@/lib/business/coordinates"
import { businessToShop } from "@/lib/business/toShop"
import { useBusinessStore } from "@/store/business.store"
import type { SavedBusiness } from "@/store/business.store"
import ShopDetailPanel from "./ShopDetailPanel"
import HospitalServicesModal from "./HospitalServicesModal"
import UserBusinessPanel from "./UserBusinessPanel"
import { assets } from "@/lib/assets"
import "mapbox-gl/dist/mapbox-gl.css"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

type FullMapProps = {
  onStartBooking: (shop: ShopsType, serviceIds?: string[]) => void
}

const filters = ["Все", "Кофейня", "Спортзал", "Больница", "Ресторан"]

export default function FullMap({ onStartBooking }: FullMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)

  const [selectedShop, setSelectedShop] = useState<ShopsType | null>(null)
  const [selectedHospital, setSelectedHospital] =
    useState<ShopsType | null>(null)
  const [selectedUserBusiness, setSelectedUserBusiness] =
    useState<SavedBusiness | null>(null)

  const [activeFilter, setActiveFilter] = useState("Все")
  const businesses = useBusinessStore((s) => s.businesses)

  useEffect(() => {
    if (!mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/rgxzlol/cmpvg516h000o01r1279x7aje",
      center: [69.2797, 41.3111],
      zoom: 12,
    })

    map.setProjection("mercator")

    mapRef.current = map

    map.on("load", () => {
      if (!navigator.geolocation) return

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lng = position.coords.longitude
          const lat = position.coords.latitude

          const el = document.createElement("div")

          el.className = `
            w-5 h-5 rounded-full bg-[#0a6af7]
            border-4 border-white shadow-lg
          `

          userMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map)

          map.flyTo({
            center: [lng, lat],
            zoom: 14,
            speed: 1.2,
          })
        },
        (error) => {
          console.error(error)
        },
        {
          enableHighAccuracy: true,
        }
      )
    })

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      userMarkerRef.current?.remove()
      map.remove()
    }
  }, [])

  function goToMyLocation() {
    const map = mapRef.current

    if (!map || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lng = position.coords.longitude
        const lat = position.coords.latitude

        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([lng, lat])
        } else {
          const el = document.createElement("div")

          el.className = `
            w-5 h-5 rounded-full bg-[#0a6af7]
            border-4 border-white shadow-lg
          `

          userMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map)
        }

        map.flyTo({
          center: [lng, lat],
          zoom: 15,
          speed: 1.2,
        })
      },
      (err) => console.error(err),
      {
        enableHighAccuracy: true,
      }
    )
  }

  useEffect(() => {
    const map = mapRef.current

    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    const filteredShops =
      activeFilter === "Все"
        ? ShopsPlace
        : ShopsPlace.filter((shop) => {
            if (
              activeFilter === "Спортзал" &&
              shop.title.toLowerCase().includes("bronfitness")
            ) {
              return true
            }

            return shop.type === activeFilter
          })

    const filteredUserBusinesses = businesses.filter((business) =>
      businessMatchesMapFilter(business.category, activeFilter),
    )

    filteredShops.forEach((shop) => {
      const el = document.createElement("div")

      const isHospital = shop.type === "Больница"

      el.className = `
        bg-white px-4 py-2 rounded-full shadow-lg
        cursor-pointer whitespace-nowrap transition
        border border-gray-200
      `

      const iconSrc = isHospital ? assets.categories.health.src : ""

      el.innerHTML = `
        <div class="flex items-center gap-2">
          ${
            isHospital
              ? `<img src="${iconSrc}" width="16" height="16" />`
              : ""
          }
          <span class="font-semibold text-[14px]">
            ${shop.title}
          </span>
        </div>
      `

      const marker = new mapboxgl.Marker(el)
        .setLngLat([shop.lng, shop.lat])
        .addTo(map)

      marker.getElement().addEventListener("click", () => {
        setSelectedUserBusiness(null)

        if (shop.type === "Больница") {
          setSelectedShop(null)
          setSelectedHospital(shop)
        } else {
          setSelectedHospital(null)
          setSelectedShop(shop)
        }

        map.flyTo({
          center: [shop.lng, shop.lat],
          zoom: 15,
          speed: 1.2,
        })
      })

      markersRef.current.push(marker)
    })

    filteredUserBusinesses.forEach((business) => {
      const el = document.createElement("div")

      el.className = `
        bg-[#ede8ff] px-4 py-2 rounded-full shadow-lg
        cursor-pointer whitespace-nowrap transition
        border-2 border-[#6b4ee6]
      `

      el.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="font-semibold text-[14px] text-[#6b4ee6]">
            ${business.name || "Мой бизнес"}
          </span>
        </div>
      `

      const marker = new mapboxgl.Marker(el)
        .setLngLat([business.lng, business.lat])
        .addTo(map)

      marker.getElement().addEventListener("click", () => {
        setSelectedShop(null)
        setSelectedHospital(null)
        setSelectedUserBusiness(business)

        map.flyTo({
          center: [business.lng, business.lat],
          zoom: 15,
          speed: 1.2,
        })
      })

      markersRef.current.push(marker)
    })
  }, [activeFilter, businesses])

  function handleHospitalContinue(serviceIds: string[]) {
    if (!selectedHospital) return

    setSelectedHospital(null)

    onStartBooking(selectedHospital, serviceIds)
  }

  function handleShopBook() {
    if (!selectedShop) return

    setSelectedShop(null)

    onStartBooking(selectedShop)
  }

  function handleUserBusinessBook() {
    if (!selectedUserBusiness) return

    const shop = businessToShop(selectedUserBusiness)
    setSelectedUserBusiness(null)
    onStartBooking(shop)
  }

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10 flex gap-2 overflow-x-auto max-w-[90%]">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`
              px-4 py-2 rounded-full whitespace-nowrap border transition font-semibold
              ${
                activeFilter === filter
                  ? "bg-[#0A6AF7] text-white border-black"
                  : "bg-white text-black border-[#0a6af7]"
              }
            `}
          >
            {filter}
          </button>
        ))}
      </div>

      <button
        onClick={goToMyLocation}
        className="absolute bottom-4 right-4 z-10 bg-white px-4 py-3 rounded-full shadow-lg border border-[#0a6af7] font-semibold"
      >
        📍
      </button>

      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "80dvh",
          borderRadius: "26px",
        }}
      />

      {selectedHospital && (
        <HospitalServicesModal
          hospital={selectedHospital}
          onClose={() => setSelectedHospital(null)}
          onContinue={handleHospitalContinue}
        />
      )}

      {selectedShop && (
        <ShopDetailPanel
          shop={selectedShop}
          onClose={() => setSelectedShop(null)}
          onBook={handleShopBook}
        />
      )}

      {selectedUserBusiness && (
        <UserBusinessPanel
          business={selectedUserBusiness}
          onClose={() => setSelectedUserBusiness(null)}
          onBook={handleUserBusinessBook}
        />
      )}
    </div>
  )
}