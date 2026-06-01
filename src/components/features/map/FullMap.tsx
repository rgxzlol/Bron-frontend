"use client"

import mapboxgl from "mapbox-gl"
import { useEffect, useRef, useState } from "react"
import { ShopsPlace } from "@/data/shops"
import { ShopsType } from "@/types/shops.types"
import ShopDetailPanel from "./ShopDetailPanel"
import HospitalServicesModal from "./HospitalServicesModal"
import { assets } from "@/lib/assets"

import "mapbox-gl/dist/mapbox-gl.css"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

type FullMapProps = {
  onStartBooking: (shop: ShopsType, serviceIds?: string[]) => void
}

export default function FullMap({ onStartBooking }: FullMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  const [selectedShop, setSelectedShop] = useState<ShopsType | null>(null)
  const [selectedHospital, setSelectedHospital] = useState<ShopsType | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/rgxzlol/cmpvg516h000o01r1279x7aje",
      center: [69.2797, 41.3111],
      zoom: 12,
    })

    map.setProjection("mercator")

    map.on("load", () => {
      ShopsPlace.forEach((shop) => {
        const el = document.createElement("div")

        const isHospital = shop.type === "Больница"

        el.className = `
          bg-white
          px-4
          py-2
          rounded-full
          shadow-lg
          cursor-pointer
          whitespace-nowrap
          transition
          border
          border-gray-200`

        const iconSrc = isHospital ? assets.categories.health.src : ""
        el.innerHTML = `
          <div class="flex items-center gap-2">
            ${isHospital ? `<img src="${iconSrc}" width="16" height="16" alt="" />` : ""}
            <span class="font-semibold text-[14px]">${shop.title}</span>
          </div>
        `

        const marker = new mapboxgl.Marker(el)
          .setLngLat([shop.lng, shop.lat])
          .addTo(map)

        marker.getElement().addEventListener("click", () => {
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
      })
    })

    mapRef.current = map

    return () => map.remove()
  }, [])

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

  return (
    <div className="relative">
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
    </div>
  )
}
