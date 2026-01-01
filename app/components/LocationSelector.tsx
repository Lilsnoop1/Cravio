"use client"
import { useState } from "react";
import {useLoadScript, GoogleMap, Marker} from "@react-google-maps/api"
import usePlacesAutocomplete, {getGeocode, getLatLng} from "use-places-autocomplete";
import {Combobox, ComboboxInput, ComboboxPopover, ComboboxList, ComboboxOption} from "@reach/combobox"
import { useLocation } from "../context/LocationContext";
import "@reach/combobox/styles.css"
import { useMemo,useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserInfo } from "../context/UserInfoContext";
import Loading from "./Loading";
import type {
  AddressDisplayProps,
  LocationSelectorProps,
  PlacesAutoCompleteProps,
} from "../Data/database";

const KARACHI_BOUNDS = {
  // Use 'north', 'south', 'east', 'west' keys at the top level
  north: 25.15,  // Northeast latitude
  south: 24.70,  // Southwest latitude
  east: 67.25,   // Northeast longitude
  west: 66.85,   // Southwest longitude
};


export default function LocationSelector({ allowChange = false }: LocationSelectorProps = {}){
  const {isLoaded} = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries:["places"],
  })

  if(!isLoaded) return <Loading/>

  return <Map allowChange={allowChange} />
}

function Map({ allowChange = false }: LocationSelectorProps = {}) {
  // Use a stable center point (Karachi)
  const center = useMemo(() => ({ lat: 24.8607, lng: 67.0011 }), []);
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [mapOpen,setMapOpen] = useState<boolean>(false);
  const {selectedAddress, setSelectedAddress} = useLocation();
  const {setCity,setBuilding,setStreet} = useUserInfo();
  const {data:session} = useSession();
  useEffect(() => {
    const fetchSavedLocation = async () => {
      const userId =
        typeof session?.user === "object" && session?.user !== null && "id" in session.user
          ? (session.user as { id?: string }).id
          : undefined;
      if (!userId) return;

      try {
        const res = await fetch(`/api/location?userId=${userId}`);
        if (!res.ok) return;

        const locationData = await res.json();
        if(!locationData.placesauto){
          return
        }

      if (locationData?.placesauto) {
        setAddress(locationData.placesauto);
        setSelectedAddress(locationData.placesauto);
      } else {
        console.warn("placesauto missing in location data");
      }

      if (locationData?.city) {
        setCity(locationData.city);
      } else {
        console.warn("city missing in location data");
      }

      if (locationData?.building) {
        setBuilding(locationData.building);
      } else {
        console.warn("building missing in location data");
      }

      if (locationData?.street) {
        setStreet(locationData.street);
      } else {
        console.warn("street missing in location data");
      }

      } catch (err) {
        console.error("Error fetching location:", err);
      }
    };

    fetchSavedLocation();
  }, [session, setSelectedAddress, setCity, setBuilding, setStreet]);
  const onMapClick = async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const latLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setSelected(latLng); // Set the marker

      try {
        // Perform Reverse Geocoding
        const results = await getGeocode({ location: latLng });
        
        // Use the formatted address from the first result
        const fullAddress = results[0]?.formatted_address || "Address not found";
        setAddress(fullAddress);
        
      } catch (error) {
        console.error("Error during reverse geocoding:", error);
        setAddress("Error fetching address");
      }
    }
  };

  // Define a stable map container style
  const mapContainerStyle = useMemo(() => ({
    width: '400px',
    position: 'absolute' as const,
    left: '0',
    zIndex: '100',
    height: '400px', // FIX: Give the map a defined height
    borderRadius: '0.75rem', // Tailwind's rounded-xl
    border: '1px solid #e2e8f0', // Tailwind's border-slate-300
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)', // Tailwind's shadow-md
  }), []);

  // Show search input only if allowChange is true OR no address is selected
  const showSearch = allowChange || !selectedAddress;

  return (
    <div className="flex flex-col gap-2 w-full ">
      
      {/* Search Input (Places Autocomplete) - Only show if allowed or no address selected */}
      {showSearch && (
        <div>
          <PlacesAutoComplete setSelected={setSelected} setMapToOpen={setMapOpen} setAddress={setAddress} />
        </div>
      )}
      <AddressDisplay address={selectedAddress || address} />
      {mapOpen?<button className="px-5 cursor-pointer py-2 hover:bg-secondary hover:text-accents w-full font-sifonn rounded-md bg-primary text-accents text-xs md:text-lg" onClick={()=>{setSelectedAddress(address ?? "");setMapOpen(false)}}>Confirm Delivery Address</button>:null}

      {/* Google Map */}
      {mapOpen?<div className="w-full">
        <GoogleMap 
          zoom={14} // Adjusted zoom level for better initial view
          center={selected || center} // Center on selected location or default
          mapContainerStyle={mapContainerStyle}
          options={{ disableDefaultUI: true, zoomControl: true }}
          onClick={onMapClick}
        >
          {selected && <Marker position={selected} />}
        </GoogleMap>
      </div>:null}
    </div>
  )
}

const PlacesAutoComplete = ({setSelected,setAddress, setMapToOpen}:PlacesAutoCompleteProps)=>{
  const {
    ready,
    value,
    setValue,
    suggestions:{status,data},
    clearSuggestions
  } = usePlacesAutocomplete({
    requestOptions:{
      locationRestriction: KARACHI_BOUNDS,
      componentRestrictions: { country: 'pk' },
    }
  });

  const handleSelect = async (valadd: string) => {
    setValue(valadd, false);
    clearSuggestions();
    // setAddress(null);
    const results = await getGeocode({ address: valadd });
    const { lat, lng } = await getLatLng(results[0]);
    setSelected({ lat, lng });
    setMapToOpen(true);
    setAddress(valadd);
  }
  return (
    <Combobox onSelect={handleSelect}>
      <ComboboxInput
        value={value}
        onChange = {(e)=>setValue(e.target.value)}
        disabled={!ready}
        placeholder="Search an Address"
        className="w-full"
      />
      <ComboboxPopover className="z-200">
        <ComboboxList>
          {status==='OK' && data.map(({place_id,description})=>
          <ComboboxOption key={place_id} value={description}/>
          )}
        </ComboboxList>
      </ComboboxPopover>
    </Combobox>
  )
}

const AddressDisplay = ({ address }: AddressDisplayProps) => {
  if (!address) return null;

  return (
    <div className="p-1 md:p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
      <p className="font-semibold text-blue-800">Selected Address:</p>
      <p className="text-blue-700">{address}</p>
    </div>
  );
};