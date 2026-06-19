"use client"

import mapboxgl from "mapbox-gl"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ShopsPlace } from "@/data/shops"
import { ShopsType } from "@/types/shops.types"
import { businessMatchesMapFilter } from "@/lib/business/coordinates"
import {
  businessMatchesBusinessCategory,
  shopMatchesBusinessCategory,
} from "@/lib/business/mapCategory"
import { businessToShop } from "@/lib/business/toShop"
import { getDistanceKm } from "@/lib/distance"
import { assets } from "@/lib/assets"
import { useBusinessStore } from "@/store/business.store"
import { useMapFilterStore } from "@/store/mapFilter.store"
import { useProfileStore } from "@/store/profile.store"
import type { SavedBusiness } from "@/store/business.store"
import type { MapLocationFilter } from "@/store/mapFilter.store"
import ShopDetailPanel from "./ShopDetailPanel"
import HospitalServicesModal from "./HospitalServicesModal"
import UserBusinessPanel from "./UserBusinessPanel"
import MapCategoriesModal from "./MapCategoriesModal"
import "mapbox-gl/dist/mapbox-gl.css"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

type FullMapProps = {
  onStartBooking: (shop: ShopsType, serviceIds?: string[]) => void
}

const filters = ["Все", "Кофейня", "Спортзал", "Больница", "Ресторан"]
const INITIAL_MAP_CENTER: [number, number] = [69.2797, 41.3111]
const INITIAL_MAP_ZOOM = 12
const LIGHT_MAP_STYLE = "mapbox://styles/rgxzlol/cmpvg516h000o01r1279x7aje"
const DARK_MAP_STYLE = "mapbox://styles/mapbox/dark-v11"

function matchesDistanceFilter(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  locationFilter: MapLocationFilter | null,
): boolean {
  if (!locationFilter) return true

  const distance = getDistanceKm(userLat, userLng, targetLat, targetLng)

  if (locationFilter === "nearby") return distance < 3
  if (locationFilter === "3-7") return distance >= 3 && distance <= 7
  if (locationFilter === "10-15") return distance >= 10 && distance <= 15

  return true
}

export default function FullMap({ onStartBooking }: FullMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null)

  const [selectedShop, setSelectedShop] = useState<ShopsType | null>(null)
  const [selectedHospital, setSelectedHospital] =
    useState<ShopsType | null>(null)
  const [selectedUserBusiness, setSelectedUserBusiness] =
    useState<SavedBusiness | null>(null)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)

  const [activeFilter, setActiveFilter] = useState("Все")
  const theme = useProfileStore((s) => s.theme)
  const businesses = useBusinessStore((s) => s.businesses)
  const appliedCategory = useMapFilterStore((s) => s.appliedCategory)
  const appliedMaxPrice = useMapFilterStore((s) => s.appliedMaxPrice)
  const appliedLocation = useMapFilterStore((s) => s.appliedLocation)

  useEffect(() => {
    if (!mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: theme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
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
          userLocationRef.current = { lat, lng }

          const el = document.createElement("div")

          el.className = `
            w-5 h-5 rounded-full bg-[#0a6af7]
            border-4 border-[var(--bg-surface)] shadow-lg
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

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const style = theme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE

    const applyStyle = () => {
      map.setStyle(style)
    }

    if (map.isStyleLoaded()) {
      applyStyle()
    } else {
      map.once("load", applyStyle)
    }
  }, [theme])

  function resetMapToInitialView() {
    const map = mapRef.current
    if (!map) return

    map.flyTo({
      center: INITIAL_MAP_CENTER,
      zoom: INITIAL_MAP_ZOOM,
      speed: 1.2,
    })
  }

  function handleFilterSelect(filter: string) {
    setActiveFilter(filter)
    resetMapToInitialView()
  }

  function handleOpenCategories() {
    setShowCategoriesModal(true)
  }

  function goToMyLocation() {
    const map = mapRef.current

    if (!map || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lng = position.coords.longitude
        const lat = position.coords.latitude
        userLocationRef.current = { lat, lng }

        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([lng, lat])
        } else {
          const el = document.createElement("div")

          el.className = `
            w-5 h-5 rounded-full bg-[#0a6af7]
            border-4 border-[var(--bg-surface)] shadow-lg
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

    const userLocation = userLocationRef.current

    const filteredShops = ShopsPlace.filter((shop) => {
      const matchesPill =
        activeFilter === "Все"
          ? true
          : activeFilter === "Спортзал"
            ? shop.title.toLowerCase().includes("bronfitness") || shop.type === "Спортзал"
            : shop.type === activeFilter

      if (!matchesPill) return false

      if (
        appliedCategory &&
        !shopMatchesBusinessCategory(shop.type, shop.category, appliedCategory)
      ) {
        return false
      }

      if (appliedMaxPrice != null && shop.price > appliedMaxPrice) {
        return false
      }

      if (
        userLocation &&
        appliedLocation &&
        !matchesDistanceFilter(
          userLocation.lat,
          userLocation.lng,
          shop.lat,
          shop.lng,
          appliedLocation,
        )
      ) {
        return false
      }

      return true
    })

    const filteredUserBusinesses = businesses.filter((business) => {
      if (!businessMatchesMapFilter(business.category, activeFilter)) {
        return false
      }

      if (
        appliedCategory &&
        !businessMatchesBusinessCategory(business.category, appliedCategory)
      ) {
        return false
      }

      if (
        userLocation &&
        appliedLocation &&
        !matchesDistanceFilter(
          userLocation.lat,
          userLocation.lng,
          business.lat,
          business.lng,
          appliedLocation,
        )
      ) {
        return false
      }

      return true
    })

    filteredShops.forEach((shop) => {
      const el = document.createElement("div")

      const isHospital = shop.type === "Больница"

      el.className = `
        bg-[var(--bg-surface)] px-4 py-2 rounded-full shadow-lg
        cursor-pointer whitespace-nowrap transition
        border border-[var(--border-default)] text-[var(--text-primary)]
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
  }, [activeFilter, businesses, appliedCategory, appliedMaxPrice, appliedLocation, theme])

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
      <div className="absolute top-4 left-4 z-10 flex max-w-[90%] gap-2 overflow-x-auto">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => handleFilterSelect(filter)}
            className={`
              px-4 py-2 rounded-full whitespace-nowrap border transition font-semibold
              ${
                activeFilter === filter
                  ? "bg-[var(--primary)] text-white border-[var(--text-primary)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--primary)]"
              }
            `}
          >
            {filter}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleOpenCategories}
        className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-full border border-[var(--primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] px-4 py-2 font-semibold shadow-lg"
      >
        <Image src={assets.header.filter} alt="" width={18} height={18} />
        Категории
      </button>

      <button
        onClick={goToMyLocation}
        className="absolute bottom-4 right-4 z-10 bg-[var(--bg-surface)] text-[var(--text-primary)] px-4 py-3 rounded-full shadow-lg border border-[var(--primary)] font-semibold"
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

      <MapCategoriesModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        onApply={resetMapToInitialView}
      />
    </div>
  )
}
