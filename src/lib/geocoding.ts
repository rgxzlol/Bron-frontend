export class GeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeocodingError";
  }
}

export type GeocodedLocation = {
  lat: number;
  lng: number;
  placeName: string;
};

export type AddressSuggestion = GeocodedLocation & {
  id: string;
  subtitle: string;
};

type PhotonProperties = {
  osm_type?: string;
  osm_id?: number;
  osm_key?: string;
  osm_value?: string;
  type?: string;
  name?: string;
  street?: string;
  housenumber?: string;
  locality?: string;
  district?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  countrycode?: string;
};

type PhotonFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: PhotonProperties;
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

const PHOTON_API = "https://photon.komoot.io/api/";
const DEFAULT_LAT = "41.3111";
const DEFAULT_LON = "69.2797";
const SUGGESTION_LIMIT = 10;

const TYPE_PRIORITY: Record<string, number> = {
  house: 0,
  street: 1,
  other: 2,
  locality: 3,
  district: 4,
  city: 5,
  county: 6,
  state: 7,
  country: 8,
};

export type GeocodeLanguage = "ru" | "uz" | "en";

type KindLabels = {
  street: string;
  organization: string;
  shop: string;
  leisure: string;
  building: string;
  historic: string;
  transport: string;
  district: string;
};

const AMENITY_LABELS: Record<GeocodeLanguage, Record<string, string>> = {
  ru: {
    school: "школа",
    university: "университет",
    college: "колледж",
    kindergarten: "детский сад",
    hospital: "больница",
    clinic: "клиника",
    pharmacy: "аптека",
    restaurant: "ресторан",
    cafe: "кафе",
    fast_food: "фастфуд",
    bank: "банк",
    gym: "спортзал",
    fitness_centre: "фитнес-центр",
    sports_centre: "спорткомплекс",
    marketplace: "рынок",
    library: "библиотека",
    place_of_worship: "религиозное место",
    office: "офис",
    public_building: "общественное здание",
  },
  en: {
    school: "school",
    university: "university",
    college: "college",
    kindergarten: "kindergarten",
    hospital: "hospital",
    clinic: "clinic",
    pharmacy: "pharmacy",
    restaurant: "restaurant",
    cafe: "cafe",
    fast_food: "fast food",
    bank: "bank",
    gym: "gym",
    fitness_centre: "fitness centre",
    sports_centre: "sports centre",
    marketplace: "marketplace",
    library: "library",
    place_of_worship: "place of worship",
    office: "office",
    public_building: "public building",
  },
  uz: {
    school: "maktab",
    university: "universitet",
    college: "kollej",
    kindergarten: "bolalar bog‘chasi",
    hospital: "kasalxona",
    clinic: "klinika",
    pharmacy: "dorixona",
    restaurant: "restoran",
    cafe: "kafe",
    fast_food: "fast food",
    bank: "bank",
    gym: "sportzal",
    fitness_centre: "fitnes markazi",
    sports_centre: "sport majmuasi",
    marketplace: "bozor",
    library: "kutubxona",
    place_of_worship: "ibodat joyi",
    office: "ofis",
    public_building: "jamiyat binosi",
  },
};

const KIND_LABELS: Record<GeocodeLanguage, KindLabels> = {
  ru: {
    street: "улица",
    organization: "организация",
    shop: "магазин",
    leisure: "досуг",
    building: "здание",
    historic: "достопримечательность",
    transport: "транспорт",
    district: "район",
  },
  en: {
    street: "street",
    organization: "organization",
    shop: "shop",
    leisure: "leisure",
    building: "building",
    historic: "landmark",
    transport: "transport",
    district: "district",
  },
  uz: {
    street: "ko‘cha",
    organization: "tashkilot",
    shop: "do‘kon",
    leisure: "dam olish",
    building: "bino",
    historic: "diqqatga sazovor joy",
    transport: "transport",
    district: "tuman",
  },
};

function roundCoord(value: number) {
  return Math.round(value * 100000) / 100000;
}

function buildLocationSubtitle(
  props: PhotonProperties,
  language: GeocodeLanguage,
): string {
  const kind = getFeatureKind(props, language);
  const location = [props.locality, props.district, props.city, props.state]
    .map((part) => part?.trim())
    .filter(Boolean)
    .filter((part, index, items) => items.indexOf(part) === index)
    .join(", ");

  if (kind && location) return `${kind} · ${location}`;
  return kind || location || props.country?.trim() || "";
}

function getFeatureKind(
  props: PhotonProperties,
  language: GeocodeLanguage,
): string {
  const labels = KIND_LABELS[language];
  const amenities = AMENITY_LABELS[language];

  if (props.type === "street" || props.osm_key === "highway") {
    return labels.street;
  }

  if (props.osm_key === "amenity" && props.osm_value) {
    return amenities[props.osm_value] ?? labels.organization;
  }

  if (props.osm_key === "shop") return labels.shop;
  if (props.osm_key === "leisure") return labels.leisure;
  if (props.osm_key === "building") return labels.building;
  if (props.osm_key === "historic") return labels.historic;
  if (props.osm_key === "railway") return labels.transport;
  if (props.type === "city" || props.type === "district") return labels.district;

  return "";
}

function formatPhotonPlaceName(props: PhotonProperties): string | null {
  const name = props.name?.trim();
  const street = props.street?.trim();
  const housenumber = props.housenumber?.trim();
  const city =
    props.city?.trim() ||
    props.district?.trim() ||
    props.locality?.trim() ||
    props.county?.trim();

  if (props.type === "street" && name) {
    return city ? `${name}, ${city}` : name;
  }

  if (name && street) {
    const address = housenumber ? `${street}, ${housenumber}` : street;
    return city ? `${name}, ${address}, ${city}` : `${name}, ${address}`;
  }

  if (street && housenumber) {
    return city ? `${street}, ${housenumber}, ${city}` : `${street}, ${housenumber}`;
  }

  if (street) {
    return city ? `${street}, ${city}` : street;
  }

  if (name) {
    return city ? `${name}, ${city}` : name;
  }

  return city ?? props.country?.trim() ?? null;
}

function getFeaturePriority(feature: PhotonFeature): number {
  const type = feature.properties?.type ?? "other";
  return TYPE_PRIORITY[type] ?? 9;
}

function getFeatureId(feature: PhotonFeature): string | null {
  const osmType = feature.properties?.osm_type;
  const osmId = feature.properties?.osm_id;

  if (osmType && osmId != null) return `${osmType}-${osmId}`;

  const coords = feature.geometry?.coordinates;
  if (coords && coords.length >= 2) {
    return `coord-${coords[0]}-${coords[1]}`;
  }

  return null;
}

const UZ_BOUNDS = {
  minLat: 37,
  maxLat: 46,
  minLng: 55,
  maxLng: 74,
};

function isInUzbekistan(lat: number, lng: number) {
  return (
    lat >= UZ_BOUNDS.minLat &&
    lat <= UZ_BOUNDS.maxLat &&
    lng >= UZ_BOUNDS.minLng &&
    lng <= UZ_BOUNDS.maxLng
  );
}

function isUzbekistanFeature(props: PhotonProperties, lat: number, lng: number) {
  const code = props.countrycode?.toUpperCase();
  if (code === "UZ") return true;
  return isInUzbekistan(lat, lng);
}

function parsePhotonFeature(
  feature: PhotonFeature,
  language: GeocodeLanguage = "ru",
): AddressSuggestion | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;

  const props = feature.properties;
  if (!props) return null;

  const [lng, lat] = coords;
  if (!isUzbekistanFeature(props, lat, lng)) return null;

  const placeName = formatPhotonPlaceName(props);
  if (!placeName) return null;

  const id = getFeatureId(feature);
  if (!id) return null;

  return {
    id,
    lat: roundCoord(lat),
    lng: roundCoord(lng),
    placeName,
    subtitle: buildLocationSubtitle(props, language),
  };
}

function buildPhotonUrl(query: string, options?: { layer?: string; limit?: string }) {
  const params = new URLSearchParams({
    q: query.trim(),
    lat: DEFAULT_LAT,
    lon: DEFAULT_LON,
    limit: options?.limit ?? String(SUGGESTION_LIMIT),
  });

  if (options?.layer) {
    params.set("layer", options.layer);
  }

  return `${PHOTON_API}?${params}`;
}

async function fetchPhotonFeatures(url: string): Promise<PhotonFeature[]> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new GeocodingError("errors.geocodingConnection");
  }

  if (!response.ok) {
    throw new GeocodingError("errors.geocodingLookup");
  }

  const data = (await response.json()) as PhotonResponse;
  return data.features ?? [];
}

function mergePhotonFeatures(...groups: PhotonFeature[][]): PhotonFeature[] {
  const seen = new Set<string>();
  const merged: PhotonFeature[] = [];

  for (const group of groups) {
    for (const feature of group) {
      const id = getFeatureId(feature);
      if (!id || seen.has(id)) continue;

      seen.add(id);
      merged.push(feature);
    }
  }

  return merged.sort((left, right) => {
    return getFeaturePriority(left) - getFeaturePriority(right);
  });
}

export async function searchAddressSuggestions(
  query: string,
  language: GeocodeLanguage = "ru",
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const [houseFeatures, streetFeatures] = await Promise.all([
    fetchPhotonFeatures(buildPhotonUrl(trimmed, { layer: "house", limit: "6" })),
    fetchPhotonFeatures(buildPhotonUrl(trimmed, { layer: "street", limit: "4" })),
  ]);

  let features = mergePhotonFeatures(houseFeatures, streetFeatures);

  if (features.length < 3) {
    const fallbackFeatures = await fetchPhotonFeatures(
      buildPhotonUrl(trimmed, { limit: "5" }),
    );
    features = mergePhotonFeatures(features, fallbackFeatures);
  }

  return features
    .map((feature) => parsePhotonFeature(feature, language))
    .filter((item): item is AddressSuggestion => item != null)
    .slice(0, SUGGESTION_LIMIT);
}

export async function geocodeAddress(address: string): Promise<GeocodedLocation> {
  const query = address.trim();
  if (!query) {
    throw new GeocodingError("errors.geocodingAddressRequired");
  }

  const features = mergePhotonFeatures(
    await fetchPhotonFeatures(buildPhotonUrl(query, { layer: "house", limit: "3" })),
    await fetchPhotonFeatures(buildPhotonUrl(query, { layer: "street", limit: "2" })),
    await fetchPhotonFeatures(buildPhotonUrl(query, { limit: "1" })),
  );

  const parsed = parsePhotonFeature(features[0] ?? {});

  if (!parsed) {
    throw new GeocodingError("errors.geocodingNotFound");
  }

  return parsed;
}

export async function resolveDraftCoords(draft: {
  address: string;
  lat: number | null;
  lng: number | null;
}): Promise<GeocodedLocation> {
  if (draft.lat != null && draft.lng != null) {
    return {
      lat: draft.lat,
      lng: draft.lng,
      placeName: draft.address.trim(),
    };
  }

  return geocodeAddress(draft.address);
}

export function parseCoord(value: unknown): number | null {
  if (value == null || value === "") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function normalizeCoords(
  lat: unknown,
  lng: unknown,
): { lat: number; lng: number } | null {
  const parsedLat = parseCoord(lat);
  const parsedLng = parseCoord(lng);

  if (parsedLat == null || parsedLng == null) return null;
  if (parsedLat === 0 && parsedLng === 0) return null;

  return { lat: parsedLat, lng: parsedLng };
}

export function hasValidCoords(item: { lat: unknown; lng: unknown }) {
  return normalizeCoords(item.lat, item.lng) != null;
}
