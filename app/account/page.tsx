"use client"
import { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import { useUserInfo } from '../context/UserInfoContext';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, ArrowLeft, User, Mail, Save, CheckCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LocationSelector from '../components/LocationSelector';

const AccountPage = () => {
  const { selectedAddress, coordinates, setSelectedAddress, setCoordinates } = useLocation();
  const { phoneNumber, setPhoneNumber, city, setCity, building, setBuilding, street, setStreet } = useUserInfo();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userData, setUserData] = useState<{ name: string | null; email: string | null; image: string | null } | null>(null);
  const [errors, setErrors] = useState<{
    selectedAddress?: string;
    city?: string;
    street?: string;
    building?: string;
    phoneNumber?: string;
  }>({});

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) return;

      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setUserData({
            name: data.name || session.user?.name || null,
            email: data.email || session.user?.email || null,
            image: session.user?.image || null,
          });
          if (data?.phoneNumber) {
            setPhoneNumber(data.phoneNumber);
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();
  }, [session, setPhoneNumber]);

  useEffect(() => {
    const fetchLocationData = async () => {
      if (!session?.user?.id) return;

      try {
        const res = await fetch(`/api/location?userId=${session.user.id}`);
        if (res.ok) {
          const locationData = await res.json();
          if (locationData.placesauto) {
            setSelectedAddress(locationData.placesauto);
          }
          if (locationData.city) {
            setCity(locationData.city);
          }
          if (locationData.building) {
            setBuilding(locationData.building);
          }
          if (locationData.street) {
            setStreet(locationData.street);
          }
          if (locationData.latitude && locationData.longitude) {
            setCoordinates({ lat: locationData.latitude, lng: locationData.longitude });
          }
        }
      } catch (err) {
        console.error("Error fetching location data:", err);
      }
    };

    fetchLocationData();
  }, [session?.user?.id, setSelectedAddress, setCity, setBuilding, setStreet, setCoordinates]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, '').slice(0, 11);
    setPhoneNumber(numericValue);
    // Clear error when user starts typing
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate selected address
    if (!selectedAddress || selectedAddress.trim().length === 0) {
      newErrors.selectedAddress = "Please select a delivery address";
    } else if (selectedAddress.trim().length < 10) {
      newErrors.selectedAddress = "Please enter a valid address";
    }

    // Validate city
    if (!city || city.trim().length === 0) {
      newErrors.city = "Please select a city";
    }

    // Validate street
    if (!street || street.trim().length === 0) {
      newErrors.street = "Street name is required";
    } else if (street.trim().length < 3) {
      newErrors.street = "Street name must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9\s\-.,]+$/.test(street.trim())) {
      newErrors.street = "Street name contains invalid characters";
    }

    // Validate building
    if (!building || building.trim().length === 0) {
      newErrors.building = "Building name is required";
    } else if (building.trim().length < 2) {
      newErrors.building = "Building name must be at least 2 characters";
    } else if (!/^[a-zA-Z0-9\s\-.,]+$/.test(building.trim())) {
      newErrors.building = "Building name contains invalid characters";
    }

    // Validate phone number - Pakistani format (starts with 0, exactly 11 digits)
    if (!phoneNumber || phoneNumber.length === 0) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (phoneNumber.length !== 11) {
      newErrors.phoneNumber = "Phone number must be exactly 11 digits";
    } else if (!phoneNumber.startsWith('0')) {
      newErrors.phoneNumber = "Pakistani phone number must start with 0";
    } else if (!/^0\d{10}$/.test(phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid Pakistani phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setIsSaved(false);

    try {
      const res = await fetch("/api/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session?.user?.id,
          city: city?.trim(),
          street: street?.trim(),
          building: building?.trim(),
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          placesauto: selectedAddress?.trim(),
          phoneNumber: phoneNumber?.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to save information");

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-sifonn">Back to Menu</span>
            </Link>
            <div className="h-6 w-px bg-slate-300"></div>
            <h1 className="text-2xl font-bold text-primary font-brasika">Account Information</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          
          {/* Profile Section - Read Only */}
          <div className="mb-8 pb-8 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 font-brasika">Profile Information</h2>
            </div>
            
            <div className="flex items-center gap-6">
              {userData?.image && (
                <div className="relative">
                  <img
                    src={userData.image}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-slate-200 object-cover"
                  />
                </div>
              )}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Name</p>
                    <p className="text-sm font-medium text-slate-800">{userData?.name || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <p className="text-sm font-medium text-slate-800">{userData?.email || "Not set"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Address Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 font-brasika">Delivery Address</h2>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <MapPin className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 mb-1">Select your delivery address</p>
                      <p className="text-xs text-slate-500 mb-3">
                        Choose from Karachi locations or search for a specific address
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-11 relative">
                    <LocationSelector allowChange={true} />
                  </div>
                  
                  {selectedAddress && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-medium text-green-800">Address Selected</p>
                      </div>
                      <p className="text-sm text-green-700 mt-1">{selectedAddress}</p>
                    </div>
                  )}
                  {errors.selectedAddress && (
                    <p className="text-xs text-red-500 mt-2 ml-11">{errors.selectedAddress}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">City <span className="text-red-500">*</span></label>
                <select
                  value={city || ""}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (errors.city) {
                      setErrors(prev => ({ ...prev, city: undefined }));
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-sifonn ${
                    errors.city ? 'border-red-300 bg-red-50' : ''
                  }`}
                >
                  <option value="">--Select a city--</option>
                  <option value="Karachi">Karachi</option>
                </select>
                {errors.city && (
                  <p className="text-xs text-red-500 mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Street <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Enter your Street name"
                  value={street || ""}
                  onChange={(e) => {
                    setStreet(e.target.value);
                    if (errors.street) {
                      setErrors(prev => ({ ...prev, street: undefined }));
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-sifonn ${
                    errors.street ? 'border-red-300 bg-red-50' : ''
                  }`}
                />
                {errors.street && (
                  <p className="text-xs text-red-500 mt-1">{errors.street}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Building <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Apartment/Building Name"
                  value={building || ""}
                  onChange={(e) => {
                    setBuilding(e.target.value);
                    if (errors.building) {
                      setErrors(prev => ({ ...prev, building: undefined }));
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-sifonn ${
                    errors.building ? 'border-red-300 bg-red-50' : ''
                  }`}
                />
                {errors.building && (
                  <p className="text-xs text-red-500 mt-1">{errors.building}</p>
                )}
              </div>
            </div>

            {/* Phone Number Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 font-brasika">Phone Number</h2>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    id="phone"
                    value={phoneNumber || ""}
                    onChange={handlePhoneChange}
                    placeholder="Enter your phone number (e.g., 03001234567)"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-sifonn ${
                      errors.phoneNumber
                        ? 'border-red-300 bg-red-50'
                        : phoneNumber && phoneNumber.length === 11 && phoneNumber.startsWith('0')
                        ? 'border-green-300 bg-green-50'
                        : phoneNumber && phoneNumber.length > 0
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-300'
                    }`}
                    maxLength={11}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Pakistani phone number must start with 0 and be exactly 11 digits
                  </p>
                  <p className={`text-xs font-medium ${
                    phoneNumber && phoneNumber.length === 11 && phoneNumber.startsWith('0') 
                      ? 'text-green-600' 
                      : 'text-slate-400'
                  }`}>
                    {phoneNumber?.length || 0}/11 digits
                  </p>
                </div>
                {errors.phoneNumber && (
                  <p className="text-xs text-red-500">{errors.phoneNumber}</p>
                )}
                {phoneNumber && phoneNumber.length === 11 && !phoneNumber.startsWith('0') && !errors.phoneNumber && (
                  <p className="text-xs text-red-500">
                    Pakistani phone number must start with 0
                  </p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              {isSaved && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Saved successfully!</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-lg font-bold transition-all duration-300 font-sifonn flex items-center gap-2 ${
                  !isSubmitting
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Save className="w-5 h-5" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;

