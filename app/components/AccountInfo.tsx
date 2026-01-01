 
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Package, LogOut, Phone, User } from 'lucide-react';
import { useLocation } from '@/app/context/LocationContext';
import { useUserInfo } from '@/app/context/UserInfoContext';
import { useRouter } from 'next/navigation';
import type { AccountInfoProps } from '@/app/Data/database';

export default function AccountInfo({ session, onSignOut }: AccountInfoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { selectedAddress } = useLocation();
  const { phoneNumber, setPhoneNumber } = useUserInfo();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/user");
      const data = await res.json();

      if (data?.phoneNumber) {
        setPhoneNumber(data.phoneNumber);
      }
    };

    fetchUser();
  }, [setPhoneNumber]);

  return (
    <div className="relative hidden md:flex" ref={dropdownRef}>
      <div className="flex flex-row gap-2 justify-end w-fit">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-row bg-[#c0c0c0] text-black font-brasika py-2 px-1 md:px-5 gap-1 md:gap-5 rounded-xl items-center hover:opacity-90 transition-opacity"
        >
          <img
            src={session?.user?.image || ""}
            alt="avatar"
            className="w-10 h-10 rounded-full"
          />
          <p className="text-xs md:text-lg">{session?.user?.name}</p>
          <ChevronDown
            className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-1000 right-0 mt-2 w-64 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-500">Signed in as</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.email}
            </p>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <MapPin className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Your Location</p>
                <p className="text-xs text-gray-500 truncate">{selectedAddress || "No location selected"}</p>
              </div>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Phone Number</p>
                <p className="text-xs text-gray-500">{phoneNumber || "Not Set"}</p>
              </div>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/orders');
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <Package className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Your Orders</p>
                <p className="text-xs text-gray-500">View order history</p>
              </div>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/account');
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Account Information</p>
                <p className="text-xs text-gray-500">View and edit your details</p>
              </div>
            </button>
          </div>

          <div className="border-t border-gray-100">
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
            >
              <LogOut className="w-5 h-5" />
              <p className="text-sm font-medium">Sign Out</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
