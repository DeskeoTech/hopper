import type { StyleSpecification } from "maplibre-gl"

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron"

const DESKEO_COLORS = {
  background: "#E4DFDB",
  water: "#D4C9BE",
  park: "#E0DACD",
  road: "#FFFFFF",
  roadCasing: "#d8d6cc",
  building: "#DDD9D3",
  landuse: "#E2DDD8",
  landcover: "#E0DBCE",
  labelText: "#616161",
}

function getTextField(locale: string) {
  if (locale === "fr") {
    return ["coalesce", ["get", "name:fr"], ["get", "name"]]
  }
  return ["coalesce", ["get", "name:en"], ["get", "name"]]
}

const cache = new Map<string, StyleSpecification>()

export async function getDeskeoMapStyle(
  locale: string
): Promise<StyleSpecification> {
  const cached = cache.get(locale)
  if (cached) return cached

  const res = await fetch(STYLE_URL)
  const style: StyleSpecification = await res.json()

  const textField = getTextField(locale)

  for (const layer of style.layers) {
    const paint = (layer as Record<string, unknown>).paint as
      | Record<string, unknown>
      | undefined
    const layout = (layer as Record<string, unknown>).layout as
      | Record<string, unknown>
      | undefined

    // Background
    if (layer.id === "background" && paint) {
      paint["background-color"] = DESKEO_COLORS.background
    }

    // Water
    if (layer.id === "water" && paint) {
      paint["fill-color"] = DESKEO_COLORS.water
    }

    // Park
    if (layer.id === "park" && paint) {
      paint["fill-color"] = DESKEO_COLORS.park
    }

    // Waterway lines
    if (layer.id === "waterway" && paint) {
      paint["line-color"] = DESKEO_COLORS.water
    }

    // Roads
    if (layer.id.startsWith("highway") && layer.type === "line" && paint) {
      if (layer.id.includes("casing")) {
        paint["line-color"] = DESKEO_COLORS.roadCasing
      } else if (layer.id.includes("inner") || layer.id === "highway_path") {
        paint["line-color"] = DESKEO_COLORS.road
      }
    }

    // Road area / pier
    if (layer.id.startsWith("road_") && paint) {
      if (layer.type === "fill") paint["fill-color"] = DESKEO_COLORS.background
      if (layer.type === "line") paint["line-color"] = DESKEO_COLORS.background
    }

    // Tunnel roads
    if (layer.id.startsWith("tunnel_") && layer.type === "line" && paint) {
      if (layer.id.includes("casing")) {
        paint["line-color"] = DESKEO_COLORS.roadCasing
      } else {
        paint["line-color"] = DESKEO_COLORS.road
      }
    }

    // Landuse
    if (layer.id === "landuse_residential" && paint) {
      paint["fill-color"] = DESKEO_COLORS.landuse
    }

    // Landcover
    if (layer.id === "landcover_wood" && paint) {
      paint["fill-color"] = DESKEO_COLORS.landcover
    }

    // Buildings
    if (layer.id === "building" && paint) {
      paint["fill-color"] = DESKEO_COLORS.building
    }

    // Boundaries
    if (layer.id.startsWith("boundary") && paint) {
      paint["line-color"] = DESKEO_COLORS.roadCasing
    }

    // Labels — update text-field for locale and text color
    if (layer.type === "symbol" && layout) {
      const tf = layout["text-field"]
      if (
        tf &&
        Array.isArray(tf) &&
        JSON.stringify(tf).includes("name") &&
        !layer.id.includes("shield")
      ) {
        layout["text-field"] = textField
      }
      if (paint?.["text-color"]) {
        paint["text-color"] = DESKEO_COLORS.labelText
      }
    }
  }

  cache.set(locale, style)
  return style
}
