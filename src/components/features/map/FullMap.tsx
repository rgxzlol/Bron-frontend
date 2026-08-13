"use client"

import mapboxgl from "mapbox-gl"
import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ShopsPlace } from "@/data/shops"
import { ShopsType } from "@/types/shops.types"
import { hasValidCoords, normalizeCoords } from "@/lib/geocoding"
import {
  businessMatchesBusinessCategory,
  shopMatchesBusinessCategory,
} from "@/lib/business/mapCategory"
import { businessMatchesMapFilter } from "@/lib/business/coordinates"
import { businessToShop } from "@/lib/business/toShop"
import { mergeBusinessFromApi } from "@/lib/business/photos"
import { fetchPublicBusinessesFromApi } from "@/lib/api/businessSync"
import { getDistanceKm } from "@/lib/distance"
import { assets } from "@/lib/assets"
import { useBusinessStore } from "@/store/business.store"
import { useMapFilterStore } from "@/store/mapFilter.store"
import { useProfileStore } from "@/store/profile.store"
import { useAuthStore } from "@/store/auth.store"
import type { MapLocationFilter } from "@/store/mapFilter.store"
import type { SavedBusiness } from "@/store/business.store"
import ShopDetailPanel from "./ShopDetailPanel"
import HospitalServicesModal from "./HospitalServicesModal"
import MapCategoriesModal from "./MapCategoriesModal"
import { onStoreHydrated } from "@/lib/store/persist"
import { getMapboxToken, isMapboxConfigured } from "@/lib/mapbox"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { MAP_FILTER_KEYS, translateLabel } from "@/lib/i18n/labels"
import "mapbox-gl/dist/mapbox-gl.css"

const mapboxToken = getMapboxToken()
if (mapboxToken) {
  mapboxgl.accessToken = mapboxToken
}

type FullMapProps = {
  onStartBooking: (shop: ShopsType, serviceIds?: string[]) => void
}

const filters = ["Все", "Кофейня", "Спортзал", "Больница", "Ресторан"]
const INITIAL_MAP_CENTER: [number, number] = [69.2797, 41.3111]
const INITIAL_MAP_ZOOM = 12
const LIGHT_MAP_STYLE = "mapbox://styles/mapbox/streets-v12"
const DARK_MAP_STYLE = "mapbox://styles/mapbox/dark-v11"

function createShopMarkerElement(title: string, isHospital: boolean) {
  const el = document.createElement("div")
  el.style.cssText = [
    "display:flex",
    "align-items:center",
    "gap:8px",
    "padding:8px 16px",
    "border-radius:9999px",
    "background:#ffffff",
    "border:1px solid #e0e0e8",
    "box-shadow:0 4px 14px rgba(0,0,0,0.12)",
    "cursor:pointer",
    "white-space:nowrap",
    "color:#111111",
    "font-weight:600",
    "font-size:14px",
    "line-height:1.2",
  ].join(";")

  if (isHospital) {
    const icon = document.createElement("img")
    icon.src = assets.categories.health.src
    icon.width = 16
    icon.height = 16
    icon.alt = ""
    el.appendChild(icon)
  }

  const label = document.createElement("span")
  label.textContent = title
  el.appendChild(label)

  return el
}

function createUserBusinessMarkerElement(title: string) {
  const el = document.createElement("div")
  el.style.cssText = [
    "padding:8px 16px",
    "border-radius:9999px",
    "background:#ede8ff",
    "border:2px solid #6b4ee6",
    "box-shadow:0 4px 14px rgba(107,78,230,0.25)",
    "cursor:pointer",
    "white-space:nowrap",
    "color:#6b4ee6",
    "font-weight:600",
    "font-size:14px",
    "line-height:1.2",
  ].join(";")
  el.textContent = title
  return el
}

function getShopServices(shop: ShopsType) {
  return shop.services ?? []
}

function shouldOpenServiceSelection(shop: ShopsType) {
  return getShopServices(shop).length > 1
}

function businessHasActiveServices(business: SavedBusiness) {
  return business.services.some((service) => service.active)
}

function shopHasActiveServices(shop: ShopsType) {
  return (shop.services?.length ?? 0) > 0
}

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
  const { t } = useTranslation()
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const locationFilterReadyRef = useRef(false)

  const [selectedShop, setSelectedShop] = useState<ShopsType | null>(null)
  const [serviceSelectionShop, setServiceSelectionShop] =
    useState<ShopsType | null>(null)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)

  const [activeFilter, setActiveFilter] = useState("Все")
  const [apiShops, setApiShops] = useState<ShopsType[]>([])
  const theme = useProfileStore((s) => s.theme)
  const token = useAuthStore((s) => s.token)
  const businesses = useBusinessStore((s) => s.businesses)
  const mapFocusBusinessId = useBusinessStore((s) => s.mapFocusBusinessId)
  const clearMapFocus = useBusinessStore((s) => s.clearMapFocus)
  const businessMapKey = businesses
    .map((business) => {
      const photoCount =
        (business.profilePhoto ? 1 : 0) +
        business.gallery.filter(Boolean).length
      const activeServices = business.services.filter((service) => service.active).length
      return `${business.id}:${business.lat}:${business.lng}:${photoCount}:${activeServices}`
    })
    .join("|")
  const appliedCategory = useMapFilterStore((s) => s.appliedCategory)
  const appliedMaxPrice = useMapFilterStore((s) => s.appliedMaxPrice)
  const appliedLocation = useMapFilterStore((s) => s.appliedLocation)

  useEffect(() => {
    const localById = new Map(businesses.map((business) => [business.id, business]))

    void fetchPublicBusinessesFromApi()
      .then((items) => {
        setApiShops(
          items.map((business) => {
            const local = localById.get(business.id)
            const source = local
              ? mergeBusinessFromApi(business, local)
              : business
            return businessToShop(source)
          }),
        )
      })
      .catch((error) => console.error(error))
  }, [businessMapKey, businesses, token])

  function createUserMarkerElement() {
    const el = document.createElement("div")
    el.style.cssText = [
      "width:20px",
      "height:20px",
      "border-radius:9999px",
      "background:#0a6af7",
      "border:4px solid #ffffff",
      "box-shadow:0 2px 8px rgba(0,0,0,0.25)",
    ].join(";")
    return el
  }

  function placeUserMarker(
    map: mapboxgl.Map,
    lng: number,
    lat: number,
  ) {
    userMarkerRef.current?.remove()

    userMarkerRef.current = new mapboxgl.Marker(createUserMarkerElement())
      .setLngLat([lng, lat])
      .addTo(map)
  }

  function whenMapReady(map: mapboxgl.Map, callback: () => void) {
    if (map.isStyleLoaded()) {
      callback()
      return
    }

    map.once("style.load", callback)
  }

  function enrichShopWithDistance(shop: ShopsType): ShopsType {
    const userLocation = userLocationRef.current
    if (!userLocation) return shop

    const km = getDistanceKm(
      userLocation.lat,
      userLocation.lng,
      shop.lat,
      shop.lng,
    )

    return {
      ...shop,
      distance: t("map.distanceKm", { km }),
    }
  }

  function matchesShopFilters(shop: ShopsType): boolean {
    if (!hasValidCoords(shop)) return false

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

    const userLocation = userLocationRef.current
    if (
      locationFilterReadyRef.current &&
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
  }

  function openShopOrServiceSelection(shop: ShopsType, map: mapboxgl.Map) {
    const coords = normalizeCoords(shop.lat, shop.lng)
    if (!coords) return

    if (shouldOpenServiceSelection(shop)) {
      setSelectedShop(null)
      setServiceSelectionShop(enrichShopWithDistance(shop))
    } else {
      openShop(shop, map)
      return
    }

    map.flyTo({
      center: [coords.lng, coords.lat],
      zoom: 15,
      speed: 1.2,
    })
  }

  function openShop(shop: ShopsType, map: mapboxgl.Map) {
    const coords = normalizeCoords(shop.lat, shop.lng)
    if (!coords) return

    setServiceSelectionShop(null)
    setSelectedShop(enrichShopWithDistance(shop))

    map.flyTo({
      center: [coords.lng, coords.lat],
      zoom: 15,
      speed: 1.2,
    })
  }

  const syncMarkers = useCallback(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    const userBusinessIds = new Set(businesses.map((business) => business.id))

    const filteredShops = [...ShopsPlace, ...apiShops].filter((shop) => {
      if (
        shop.apiBusinessId != null &&
        userBusinessIds.has(String(shop.apiBusinessId))
      ) {
        return false
      }

      if (shop.apiBusinessId != null && !shopHasActiveServices(shop)) {
        return false
      }

      return matchesShopFilters(shop)
    })

    const filteredUserBusinesses = businesses.filter((business) => {
      if (!hasValidCoords(business)) return false
      if (!businessHasActiveServices(business)) return false
      if (!businessMatchesMapFilter(business.category || "Другое", activeFilter)) {
        return false
      }
      return true
    })

    filteredShops.forEach((shop) => {
      const coords = normalizeCoords(shop.lat, shop.lng)
      if (!coords) return

      const isHospital = shop.type === "Больница"
      const el = createShopMarkerElement(shop.title, isHospital)

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map)

      marker.getElement().addEventListener("click", () => {
        openShopOrServiceSelection(shop, map)
      })

      markersRef.current.push(marker)
    })

    filteredUserBusinesses.forEach((business) => {
      const coords = normalizeCoords(business.lat, business.lng)
      if (!coords) return

      const el = createUserBusinessMarkerElement(
        business.name || t("map.myBusinessFallback"),
      )

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map)

      marker.getElement().addEventListener("click", () => {
        const shop = businessToShop(business, userLocationRef.current)
        openShopOrServiceSelection(shop, map)
      })

      markersRef.current.push(marker)
    })
  }, [
    activeFilter,
    businesses,
    appliedCategory,
    appliedMaxPrice,
    appliedLocation,
    apiShops,
    t,
  ])

  const syncMarkersRef = useRef(syncMarkers)
  syncMarkersRef.current = syncMarkers

  useEffect(() => {
    if (!mapContainer.current || !isMapboxConfigured()) return

    let cancelled = false
    const persistedLocation = useMapFilterStore.getState().appliedLocation
    locationFilterReadyRef.current = !persistedLocation

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: theme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
      center: INITIAL_MAP_CENTER,
      zoom: INITIAL_MAP_ZOOM,
      projection: "mercator",
    })

    mapRef.current = map

    const handleMapReady = () => {
      if (cancelled || mapRef.current !== map) return
      syncMarkersRef.current()
    }

    map.once("load", handleMapReady)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled || mapRef.current !== map) return

          const lng = position.coords.longitude
          const lat = position.coords.latitude
          userLocationRef.current = { lat, lng }

          whenMapReady(map, () => {
            placeUserMarker(map, lng, lat)

            if (persistedLocation) {
              locationFilterReadyRef.current = true
              syncMarkersRef.current()
            }

            map.flyTo({
              center: [lng, lat],
              zoom: 14,
              speed: 1.2,
            })
          })
        },
        (error) => {
          console.error(error)
          locationFilterReadyRef.current = false
        },
        {
          enableHighAccuracy: true,
        },
      )
    }

    return () => {
      cancelled = true
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const sync = () => syncMarkersRef.current()

    return onStoreHydrated(useBusinessStore, sync)
  }, [])

  useEffect(() => {
    if (!mapFocusBusinessId) return

    const business = businesses.find((item) => item.id === mapFocusBusinessId)
    const coords = business ? normalizeCoords(business.lat, business.lng) : null
    const map = mapRef.current

    if (!business || !coords || !map) return

    whenMapReady(map, () => {
      syncMarkersRef.current()
      map.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 15,
        speed: 1.2,
      })
      clearMapFocus()
    })
  }, [mapFocusBusinessId, businesses, clearMapFocus])

  const initialThemeRef = useRef(theme)

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (theme === initialThemeRef.current) return

    initialThemeRef.current = theme

    const style = theme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE

    map.setStyle(style)
    map.once("style.load", () => {
      syncMarkersRef.current()
    })
  }, [theme])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    whenMapReady(map, () => syncMarkersRef.current())
  }, [syncMarkers])

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

  function requestUserLocation(onSuccess?: () => void, applyLocationFilter = false) {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lng = position.coords.longitude
        const lat = position.coords.latitude
        userLocationRef.current = { lat, lng }

        if (applyLocationFilter) {
          locationFilterReadyRef.current = true
        }

        const map = mapRef.current
        if (!map) return

        whenMapReady(map, () => {
          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([lng, lat])
          } else {
            placeUserMarker(map, lng, lat)
          }
          syncMarkersRef.current()
          onSuccess?.()
        })
      },
      (error) => {
        console.error(error)
        locationFilterReadyRef.current = false
        alert(t("map.geolocationDenied"))
      },
      {
        enableHighAccuracy: true,
      },
    )
  }

  function handleCategoriesApply() {
    const location = useMapFilterStore.getState().appliedLocation
    if (location) {
      requestUserLocation(() => {
        const map = mapRef.current
        const userLocation = userLocationRef.current
        if (map && userLocation) {
          map.flyTo({
            center: [userLocation.lng, userLocation.lat],
            zoom: 14,
            speed: 1.2,
          })
        }
      }, true)
      return
    }

    locationFilterReadyRef.current = false
    syncMarkersRef.current()
    resetMapToInitialView()
  }

  function goToMyLocation() {
    const map = mapRef.current
    if (!map || !navigator.geolocation) return

    requestUserLocation(() => {
      const userLocation = userLocationRef.current
      if (!userLocation) return

      map.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
        speed: 1.2,
      })
    })
  }

  function handleServiceSelectionContinue(serviceIds: string[]) {
    if (!serviceSelectionShop) return

    const shop = serviceSelectionShop
    setServiceSelectionShop(null)

    onStartBooking(shop, serviceIds)
  }

  function handleShopBook() {
    if (!selectedShop) return

    const shop = selectedShop
    const services = shop.services ?? []

    if (services.length > 1) {
      setSelectedShop(null)
      setServiceSelectionShop(shop)
      return
    }

    setSelectedShop(null)
    onStartBooking(
      shop,
      services.length === 1 ? [services[0].id] : undefined,
    )
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
            {translateLabel(t, filter, MAP_FILTER_KEYS)}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleOpenCategories}
        className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-full border border-[var(--primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] px-4 py-2 font-semibold shadow-lg"
      >
        <Image src={assets.header.filter} alt="" width={18} height={18} />
        {t("map.categories")}
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

      {!isMapboxConfigured() && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-[26px] bg-[var(--bg-surface-muted)] px-6 text-center"
          style={{ height: "80dvh" }}
        >
          <div className="max-w-md">
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">
              {t("map.mapUnavailable")}
            </p>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              {t("map.mapboxTokenHint", { file: ".env.local" })}
            </p>
            <pre className="mt-3 overflow-x-auto rounded-[12px] bg-[var(--bg-surface)] p-3 text-left text-[13px] text-[var(--text-primary)]">
              {t("map.mapboxTokenExample")}
            </pre>
          </div>
        </div>
      )}

      {serviceSelectionShop && (
        <HospitalServicesModal
          shop={serviceSelectionShop}
          onClose={() => setServiceSelectionShop(null)}
          onContinue={handleServiceSelectionContinue}
        />
      )}

      {selectedShop && (
        <ShopDetailPanel
          shop={selectedShop}
          onClose={() => setSelectedShop(null)}
          onBook={handleShopBook}
        />
      )}

      <MapCategoriesModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        onApply={handleCategoriesApply}
      />
    </div>
  )
}
