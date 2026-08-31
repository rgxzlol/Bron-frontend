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
import { MAP_FILTER_PILL_KEYS, translateLabel } from "@/lib/i18n/labels"
import { useTranslation } from "@/lib/i18n/useTranslation"
import "mapbox-gl/dist/mapbox-gl.css"

const mapboxToken = getMapboxToken()
if (mapboxToken) {
  mapboxgl.accessToken = mapboxToken
}

type FullMapProps = {
  onStartBooking: (shop: ShopsType, serviceIds?: string[]) => void
}

const filters = ["Ресторан", "Спортзал", "Кофейня", "Больница"]
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

function getShopMinPrice(shop: ShopsType) {
  if (shop.services?.length) {
    return Math.min(...shop.services.map((service) => service.priceFrom))
  }

  return shop.price
}

function getBusinessMinPrice(business: SavedBusiness) {
  const activeServices = business.services.filter((service) => service.active)
  if (activeServices.length > 0) {
    return Math.min(...activeServices.map((service) => service.price))
  }
  return 50000
}

function getUserLocationForDistanceFilter(
  userLocation: { lat: number; lng: number } | null,
): { lat: number; lng: number } {
  return (
    userLocation ?? {
      lat: INITIAL_MAP_CENTER[1],
      lng: INITIAL_MAP_CENTER[0],
    }
  )
}

type MapViewportMode = "idle" | "user" | "fit-markers"

function centerMapOnUser(map: mapboxgl.Map, lat: number, lng: number) {
  map.flyTo({
    center: [lng, lat],
    zoom: 14,
    speed: 1.2,
  })
}

function fitMapToCoordinates(
  map: mapboxgl.Map,
  coordinates: [number, number][],
) {
  if (coordinates.length === 0) {
    map.flyTo({
      center: INITIAL_MAP_CENTER,
      zoom: INITIAL_MAP_ZOOM,
      speed: 1.2,
    })
    return
  }

  if (coordinates.length === 1) {
    map.flyTo({
      center: coordinates[0],
      zoom: 14,
      speed: 1.2,
    })
    return
  }

  const bounds = coordinates.reduce(
    (nextBounds, coordinate) => nextBounds.extend(coordinate),
    new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
  )

  map.fitBounds(bounds, {
    padding: 72,
    maxZoom: 15,
    duration: 1200,
  })
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
  const mapViewportModeRef = useRef<MapViewportMode>("idle")

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
  const filtersAppliedCount = useMapFilterStore((s) => s.filtersAppliedCount)
  const applyCategoryFromNavigation = useMapFilterStore(
    (s) => s.applyCategoryFromNavigation,
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const category = params.get("category")
    const filter = params.get("filter")

    if (category) {
      applyCategoryFromNavigation(category)
      mapViewportModeRef.current = "fit-markers"
    }

    if (filter) {
      setActiveFilter(filter)
      mapViewportModeRef.current = "fit-markers"
    }

    if (category || filter) {
      const url = new URL(window.location.href)
      url.searchParams.delete("category")
      url.searchParams.delete("filter")
      window.history.replaceState({}, "", url.pathname + url.search)
    }
  }, [applyCategoryFromNavigation])

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
    el.setAttribute("data-testid", "map-user-location-marker")
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

    return {
      ...shop,
      distance: `${getDistanceKm(userLocation.lat, userLocation.lng, shop.lat, shop.lng)} км`,
    }
  }

  function matchesShopFilters(
    shop: ShopsType,
    categoryFilter = appliedCategory,
    maxPriceFilter = appliedMaxPrice,
    locationFilter = appliedLocation,
  ): boolean {
    if (!hasValidCoords(shop)) return false

    const matchesPill =
      activeFilter === "Все"
        ? true
        : activeFilter === "Спортзал"
          ? shop.title.toLowerCase().includes("bronfitness") ||
            shop.type === "Спортзал" ||
            shop.type === "Спорт зал"
          : shop.type === activeFilter

    if (!matchesPill) return false

    if (
      categoryFilter &&
      !shopMatchesBusinessCategory(shop.type, shop.category, categoryFilter)
    ) {
      return false
    }

    if (maxPriceFilter != null && getShopMinPrice(shop) > maxPriceFilter) {
      return false
    }

    const userLocation = getUserLocationForDistanceFilter(userLocationRef.current)
    if (
      locationFilter &&
      !matchesDistanceFilter(
        userLocation.lat,
        userLocation.lng,
        shop.lat,
        shop.lng,
        locationFilter,
      )
    ) {
      return false
    }

    return true
  }

  function openShopOrServiceSelection(shop: ShopsType, map: mapboxgl.Map) {
    openShop(shop, map)
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

    const {
      appliedCategory: currentAppliedCategory,
      appliedMaxPrice: currentAppliedMaxPrice,
      appliedLocation: currentAppliedLocation,
    } = useMapFilterStore.getState()

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

      return matchesShopFilters(
        shop,
        currentAppliedCategory,
        currentAppliedMaxPrice,
        currentAppliedLocation,
      )
    })

    const filteredUserBusinesses = businesses.filter((business) => {
      if (!hasValidCoords(business)) return false
      if (!businessHasActiveServices(business)) return false
      if (!businessMatchesMapFilter(business.category || "Другое", activeFilter)) {
        return false
      }
      if (
        currentAppliedCategory &&
        !businessMatchesBusinessCategory(business.category || "Другое", currentAppliedCategory)
      ) {
        return false
      }

      if (
        currentAppliedMaxPrice != null &&
        getBusinessMinPrice(business) > currentAppliedMaxPrice
      ) {
        return false
      }

      const userLocation = getUserLocationForDistanceFilter(userLocationRef.current)
      if (
        currentAppliedLocation &&
        !matchesDistanceFilter(
          userLocation.lat,
          userLocation.lng,
          business.lat,
          business.lng,
          currentAppliedLocation,
        )
      ) {
        return false
      }

      return true
    })

    const markerCoordinates: [number, number][] = []

    filteredShops.forEach((shop) => {
      const coords = normalizeCoords(shop.lat, shop.lng)
      if (!coords) return

      markerCoordinates.push([coords.lng, coords.lat])

      const isHospital = shop.type === "Больница"
      const el = createShopMarkerElement(shop.title, isHospital)
      el.setAttribute("data-testid", `map-shop-marker-${shop.id}`)
      el.setAttribute("role", "button")
      el.setAttribute("tabindex", "0")
      el.setAttribute("aria-label", shop.title)

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map)

      const openMarkerShop = () => openShopOrServiceSelection(shop, map)

      marker.getElement().addEventListener("click", (event) => {
        event.preventDefault()
        event.stopPropagation()
        openMarkerShop()
      })
      marker.getElement().addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        openMarkerShop()
      })

      markersRef.current.push(marker)
    })

    filteredUserBusinesses.forEach((business) => {
      const coords = normalizeCoords(business.lat, business.lng)
      if (!coords) return

      markerCoordinates.push([coords.lng, coords.lat])

      const el = createUserBusinessMarkerElement(business.name || "Мой бизнес")

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map)

      marker.getElement().addEventListener("click", () => {
        const shop = businessToShop(business, userLocationRef.current)
        openShopOrServiceSelection(shop, map)
      })

      markersRef.current.push(marker)
    })

    const viewportMode = mapViewportModeRef.current
    if (viewportMode === "user" && userLocationRef.current) {
      const { lat, lng } = userLocationRef.current
      centerMapOnUser(map, lat, lng)
      mapViewportModeRef.current = "idle"
    } else if (viewportMode === "fit-markers") {
      fitMapToCoordinates(map, markerCoordinates)
      mapViewportModeRef.current = "idle"
    }
  }, [
    activeFilter,
    businesses,
    appliedCategory,
    appliedMaxPrice,
    appliedLocation,
    apiShops,
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
              mapViewportModeRef.current = "fit-markers"
              syncMarkersRef.current()
              return
            }

            mapViewportModeRef.current = "user"
            syncMarkersRef.current()
          })
        },
        (error) => {
          console.error(error)
          locationFilterReadyRef.current = Boolean(
            useMapFilterStore.getState().appliedLocation,
          )
          whenMapReady(map, () => {
            syncMarkersRef.current()
          })
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
    const sync = () => {
      if (useMapFilterStore.getState().appliedLocation) {
        locationFilterReadyRef.current = true
        mapViewportModeRef.current = "fit-markers"
      }
      syncMarkersRef.current()
    }

    return onStoreHydrated(useMapFilterStore, sync)
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

  function handleFilterSelect(filter: string) {
    mapViewportModeRef.current = "fit-markers"
    setActiveFilter((prev) => (prev === filter ? "Все" : filter))
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
        locationFilterReadyRef.current = Boolean(
          useMapFilterStore.getState().appliedLocation,
        )
        alert("Не удалось определить ваше местоположение. Разрешите доступ к геолокации.")
        syncMarkersRef.current()
      },
      {
        enableHighAccuracy: true,
      },
    )
  }

  function handleCategoriesApply() {
    const location = useMapFilterStore.getState().appliedLocation
    mapViewportModeRef.current = "fit-markers"

    if (location) {
      locationFilterReadyRef.current = true
      syncMarkersRef.current()

      requestUserLocation(() => {
        syncMarkersRef.current()
      }, true)
      return
    }

    locationFilterReadyRef.current = false
    syncMarkersRef.current()
  }

  useEffect(() => {
    if (filtersAppliedCount === 0) return
    handleCategoriesApply()
  }, [filtersAppliedCount])

  function goToMyLocation() {
    const map = mapRef.current
    if (!map || !navigator.geolocation) return

    requestUserLocation(() => {
      const userLocation = userLocationRef.current
      if (!userLocation) return

      mapViewportModeRef.current = "user"
      syncMarkersRef.current()
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

    setSelectedShop(null)
    setServiceSelectionShop(null)
    onStartBooking(
      shop,
      services.length === 1 ? [services[0].id] : undefined,
    )
  }

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10 flex max-w-[calc(100%-32px)] gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:max-w-[70%]">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            data-testid={`map-filter-${filter}`}
            onClick={() => handleFilterSelect(filter)}
            className={`
              px-4 py-2 rounded-full whitespace-nowrap border text-[14px] transition font-semibold
              ${
                activeFilter === filter
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-[var(--bg-surface)] text-[var(--primary)] border-[var(--primary)]"
              }
            `}
          >
            {translateLabel(t, filter, MAP_FILTER_PILL_KEYS)}
          </button>
        ))}
      </div>

      <div className="absolute top-[72px] right-4 z-10 flex flex-col gap-3 lg:hidden">
        <button
          type="button"
          onClick={handleOpenCategories}
          aria-label={t("map.categories")}
          data-testid="map-categories-open"
          className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h9M18.5 7H20M4 17h1.5M11 17h9" />
            <circle cx="15.5" cy="7" r="2.3" />
            <circle cx="7.5" cy="17" r="2.3" />
          </svg>
        </button>
        <button
          type="button"
          onClick={goToMyLocation}
          aria-label="Моё местоположение"
          className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 3 10.7 13.3M21 3l-6.6 18-3.7-7.7L3 9.6 21 3z" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={handleOpenCategories}
        data-testid="map-categories-open-desktop"
        className="absolute top-4 right-4 z-10 hidden lg:flex items-center gap-2 rounded-full border border-[var(--primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] px-4 py-2 font-semibold shadow-lg"
      >
        <Image src={assets.header.filter} alt="" width={18} height={18} />
        {t("map.categories")}
      </button>

      <button
        onClick={goToMyLocation}
        className="absolute bottom-4 right-4 z-10 hidden lg:block bg-[var(--bg-surface)] text-[var(--text-primary)] px-4 py-3 rounded-full shadow-lg border border-[var(--primary)] font-semibold"
      >
        📍
      </button>

      <div
        ref={mapContainer}
        data-testid="interactive-map"
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
              Карта недоступна
            </p>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Укажите реальный токен Mapbox в файле{" "}
              <code className="rounded bg-[var(--bg-surface)] px-1 py-0.5">.env.local</code>:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-[12px] bg-[var(--bg-surface)] p-3 text-left text-[13px] text-[var(--text-primary)]">
              NEXT_PUBLIC_MAPBOX_TOKEN=pk.ваш_токен
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
