"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { MapPin } from "lucide-react"
import { getAddressBounds } from "@/lib/service-area"

export interface AddressDetails {
  formattedAddress: string
  state?: string
  city?: string
  county?: string
  zip?: string
  lat?: number
  lng?: number
}

interface LatLngBoundsLiteral {
  south: number
  west: number
  north: number
  east: number
}

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string) => void
  onSelect: (address: string, details: AddressDetails) => void
  placeholder?: string
  bounds?: LatLngBoundsLiteral
  className?: string
  // Enter / the phone keyboard's "Go" key. Pass the same handler as the page's
  // button. Without it, Enter looks up the typed address directly.
  onSubmit?: () => void
  // Overrides where the "tap your address" hint sits (e.g. the compact header).
  hintClassName?: string
}

export interface AddressAutocompleteHandle {
  // Looks up what the visitor typed (first Google prediction) and runs the same
  // select path as tapping a suggestion. Shows the hint and returns false when
  // nothing is found.
  resolveTyped: () => Promise<boolean>
}

const PLACE_FIELDS = ["formatted_address", "address_components", "geometry"]
const HINT_PICK = "Please tap your address in the list so we can find it."
const HINT_EMPTY = "Please enter your property address."

// Google never calls back when the key or network fails, so cap each lookup
// and fall through to the hint instead of hanging silently.
function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 5000): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))])
}

declare global {
  interface Window {
    google: typeof google
    initGooglePlaces: () => void
  }
}

const BLOCKED_ADDRESSES = [
  "9809 newhall rd",
]

function isBlockedAddress(formattedAddress: string): boolean {
  const lower = formattedAddress.toLowerCase()
  return BLOCKED_ADDRESSES.some(blocked => lower.includes(blocked))
}

export const AddressAutocomplete = forwardRef<AddressAutocompleteHandle, AddressAutocompleteProps>(function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing your address...",
  bounds,
  className,
  onSubmit,
  hintClassName,
}, ref) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hint, setHint] = useState("")
  const resolvingRef = useRef(false)

  // Explicit bounds prop, else NEXT_PUBLIC_ADDRESS_BOUNDS / the service-area circles.
  const searchBounds = (): google.maps.LatLngBounds | undefined => {
    const b = bounds ?? getAddressBounds()
    if (!b) return undefined
    return new google.maps.LatLngBounds({ lat: b.south, lng: b.west }, { lat: b.north, lng: b.east })
  }

  useEffect(() => {
    // Check if script already loaded
    if (window.google?.maps?.places) {
      setIsLoaded(true)
      initAutocomplete()
      return
    }

    // Load Google Places script
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsLoaded(true)
      initAutocomplete()
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [])

  const initAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) return

    const autocompleteOptions: google.maps.places.AutocompleteOptions = {
      componentRestrictions: { country: "us" },
      types: ["address"],
      fields: PLACE_FIELDS,
    }
    const box = searchBounds()
    if (box) {
      // Keeps suggestions inside the client's area instead of just nudging them.
      autocompleteOptions.bounds = box
      autocompleteOptions.strictBounds = true
    }
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, autocompleteOptions)

    autocompleteRef.current.addListener("place_changed", () => {
      handlePlaceRef.current(autocompleteRef.current?.getPlace())
    })
  }

  // One select path for both a tapped suggestion and a typed-then-submitted
  // address. Kept in a ref so the Google listener always calls the latest
  // props rather than the ones from the first render.
  const handlePlaceRef = useRef<(place?: google.maps.places.PlaceResult) => void>(() => {})
  handlePlaceRef.current = (place) => {
    if (place?.formatted_address) {
      // Block specific addresses
      if (isBlockedAddress(place.formatted_address)) {
        alert("Sorry, we are unable to provide an offer for this property at this time.")
        onChange("")
        return
      }
      // Extract address components
      let state = ""
      let city = ""
      let county = ""
      let zip = ""
      
      place.address_components?.forEach((component) => {
        if (component.types.includes("administrative_area_level_1")) {
          state = component.short_name // e.g., "MD", "VA", "DC"
        }
        if (component.types.includes("locality")) {
          city = component.long_name
        }
        if (component.types.includes("administrative_area_level_2")) {
          county = component.long_name
        }
        if (component.types.includes("postal_code")) {
          zip = component.short_name
        }
      })
      
      const loc = place.geometry?.location
      const details: AddressDetails = {
        formattedAddress: place.formatted_address,
        state,
        city,
        county,
        zip,
        lat: loc ? loc.lat() : undefined,
        lng: loc ? loc.lng() : undefined,
      }
      
      onChange(place.formatted_address)
      onSelect(place.formatted_address, details)
    }
  }

  const showHint = (msg: string) => {
    setHint(msg)
    inputRef.current?.focus()
  }

  const resolveTyped = async (): Promise<boolean> => {
    const input = (inputRef.current?.value ?? value ?? "").trim()
    if (!input) { showHint(HINT_EMPTY); return false }
    const places = window.google?.maps?.places
    if (!places) { showHint(HINT_PICK); return false }
    if (resolvingRef.current) return false
    resolvingRef.current = true
    try {
      const sessionToken = new places.AutocompleteSessionToken()
      const box = searchBounds()
      const predictions = await withTimeout(new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
        new places.AutocompleteService().getPlacePredictions(
          // locationBias is the current name for the request's `bounds`: it ranks
          // in-area matches first but still finds an out-of-area address, so the
          // area check can show its own "outside our buying area" message.
          { input, componentRestrictions: { country: "us" }, types: ["address"], sessionToken, ...(box ? { locationBias: box } : {}) },
          (results, status) => resolve(status === places.PlacesServiceStatus.OK && results ? results : [])
        )
      }), [])
      if (!predictions[0]) { showHint(HINT_PICK); return false }
      const place = await withTimeout(new Promise<google.maps.places.PlaceResult | null>((resolve) => {
        new places.PlacesService(document.createElement("div")).getDetails(
          { placeId: predictions[0].place_id, fields: PLACE_FIELDS, sessionToken },
          (result, status) => resolve(status === places.PlacesServiceStatus.OK ? result : null)
        )
      }), null)
      if (!place?.formatted_address) { showHint(HINT_PICK); return false }
      setHint("")
      handlePlaceRef.current(place)
      return true
    } catch {
      showHint(HINT_PICK)
      return false
    } finally {
      resolvingRef.current = false
    }
  }

  useImperativeHandle(ref, () => ({ resolveTyped }))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return
    // Visitor arrowed onto a suggestion: Google selects it itself.
    const suggestionHighlighted = Array.from(document.querySelectorAll<HTMLElement>(".pac-container")).some(
      (c) => c.style.display !== "none" && c.querySelector(".pac-item-selected")
    )
    if (suggestionHighlighted) return
    e.preventDefault()
    if (onSubmit) onSubmit()
    else void resolveTyped()
  }

  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className={`relative ${className || ""}`}>
      {!value && !isFocused && (
        <div className="absolute -inset-1 rounded-2xl bg-[#0891b2]/20 animate-pulse" />
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          <MapPin className="h-5 w-5 text-[#0891b2]" />
        </div>
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => { setHint(""); onChange(e.target.value) }}
          onKeyDownCapture={handleKeyDown}
          enterKeyHint="go"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="h-16 pl-10 rounded-xl border-2 border-[#0891b2]/50 bg-white text-lg text-gray-900 placeholder:text-gray-400 focus:border-[#0891b2] focus:ring-[#0891b2]/20"
        />
        {!isLoaded && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-[#0891b2]" />
          </div>
        )}
      </div>
      {hint && (
        <p role="alert" className={hintClassName ?? "mt-2 text-center text-sm font-medium"} style={{ color: "#dc2626" }}>
          {hint}
        </p>
      )}
    </div>
  )
})
