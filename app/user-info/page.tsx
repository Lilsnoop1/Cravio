"use client"
import { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import { useUserInfo } from '../context/UserInfoContext';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, ArrowLeft, CheckCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LocationSelector from '../components/LocationSelector';

const UserInfoPage = () => {
  const { selectedAddress, coordinates } = useLocation();
  const { phoneNumber, setPhoneNumber,city,setCity,building,setBuilding,street,setStreet } = useUserInfo();
  const { data: session, status } = useSession()
  const userId = session?.user?.id;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/");
    }
  }, [session, status, router]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and limit to 11 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 11);
    setPhoneNumber(numericValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, city, street, building,latitude:coordinates.lat,longitude:coordinates.lng,placesauto:selectedAddress,phoneNumber}),
      });

      if (!res.ok) throw new Error("Failed to save location");

      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.error(err);
    } finally {
      router.push('/checkout');
      setIsSubmitting(false);
    }
  };

  const isFormValid = selectedAddress && city && street && building && phoneNumber && phoneNumber.length === 11;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 w-full md:w-3/4">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-sifonn">Back to Menu</span>
            </Link>
            <div className="h-6 w-px bg-slate-300"></div>
            <h1 className="text-2xl font-bold text-primary font-brasika">Complete Your Information</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-primary">Step 1: Complete Info</span>
              </div>
              <div className="w-12 h-px bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-500">2</span>
                </div>
                <span className="text-sm font-medium text-slate-500">Step 2: Checkout</span>
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
                  
                  {/* Integrated LocationSelector */}
                  <div className="ml-11 relative">
                    <LocationSelector />
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
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">City</label>
                <select id="fruits" name="fruits" value={city} className='w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-sifonn' onChange={(e)=>setCity(e.target.value)}>
                  <option value="">--Select a city--</option>
                  <option value="Karachi">Karachi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Street</label>
                <input
                type='text'
                placeholder='Enter your Street name'
                value={street}
                onChange={(e)=>setStreet(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-sifonn`}
                required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Building</label>
                <input
                type='text'
                placeholder='Apartment/Building Name'
                value={building}
                onChange={(e)=>setBuilding(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-sifonn`}
                required
                />
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
                  Contact Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    id="phone"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="Enter your phone number (e.g., 03001234567)"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-sifonn ${
                      phoneNumber.length > 0 && phoneNumber.length !== 11 
                        ? 'border-red-300 bg-red-50' 
                        : phoneNumber.length === 11 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-slate-300'
                    }`}
                    required
                    maxLength={11}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    We&rsquo;ll use this number to contact you about your delivery
                  </p>
                  <p className={`text-xs font-medium ${
                    phoneNumber.length === 11 ? 'text-green-600' : 'text-slate-400'
                  }`}>
                    {phoneNumber.length}/11 digits
                  </p>
                </div>
                {phoneNumber.length > 0 && phoneNumber.length !== 11 && (
                  <p className="text-xs text-red-500">
                    Phone number must be exactly 11 digits
                  </p>
                )}
              </div>
            </div>

            {/* Information Summary */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 font-brasika">Information Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    selectedAddress ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {selectedAddress ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    )}
                  </div>
                  <span className={`text-sm ${selectedAddress ? 'text-green-700' : 'text-red-700'}`}>
                    Delivery Address: {selectedAddress ? 'Selected':'Not Selected'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    city ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {city ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    )}
                  </div>
                  <span className={`text-sm ${city ? 'text-green-700' : 'text-red-700'}`}>
                    City: {city? 'Selected':'Not Selected'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    street ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {street ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    )}
                  </div>
                  <span className={`text-sm ${street? 'text-green-700' : 'text-red-700'}`}>
                    Street: {street ? 'Selected':'Not Selected'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    building ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {building ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    )}
                  </div>
                  <span className={`text-sm ${building? 'text-green-700' : 'text-red-700'}`}>
                    Building: {building ? 'Selected':'Not Selected'}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    phoneNumber && phoneNumber.length === 11 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {phoneNumber && phoneNumber.length === 11 ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    )}
                  </div>
                  <span className={`text-sm ${phoneNumber && phoneNumber.length === 11 ? 'text-green-700' : 'text-red-700'}`}>
                    Phone Number: {phoneNumber && phoneNumber.length === 11 ? 'Valid (11 digits)' : 'Required (11 digits)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`px-8 py-3 rounded-lg font-bold transition-all duration-300 font-sifonn ${
                  isFormValid && !isSubmitting
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserInfoPage;
