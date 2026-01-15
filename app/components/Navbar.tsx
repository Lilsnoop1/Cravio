"use client";
import { useLoginModal } from "@/app/context/LoginModalContext";
import Image from "next/image";
import {signOut, useSession } from "next-auth/react"
import AccountInfo from "./AccountInfo";
import LocationSelector from "./LocationSelector";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, Search } from "lucide-react";
import { useLocation } from "../context/LocationContext";
import { useCartContext } from "../context/CartContext";
import MobileLocationDrawer from "./MobileLocationDrawer";

const Navbar: React.FC = () => {
    const { setIsOpen, setIsEmployee } = useLoginModal();
    const { data: session } = useSession();
    const [isSeeding, setIsSeeding] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [locOpen, setLocOpen] = useState(false);
    const [mobileSearchActive, setMobileSearchActive] = useState(false);
    const { selectedAddress } = useLocation();
    const { cartItems, CartOpen, setCartOpen } = useCartContext();

    useEffect(() => {
      const handleOpen = () => setMobileSearchActive(true);
      const handleClose = () => setMobileSearchActive(false);

      window.addEventListener("mobile-search-open", handleOpen as EventListener);
      window.addEventListener("mobile-search-close", handleClose as EventListener);

      return () => {
        window.removeEventListener("mobile-search-open", handleOpen as EventListener);
        window.removeEventListener("mobile-search-close", handleClose as EventListener);
      };
    }, []);

  const shortAddress = selectedAddress
    ? selectedAddress.length > 20
      ? `${selectedAddress.slice(0, 20)}...`
      : selectedAddress
    : "Set location";

    // const seedDatabase = async () => {
    //     setIsSeeding(true);
    //     try {
    //         // Only seed companies (companydata.json already includes category + counts)
    //         const companyResponse = await fetch('/api/company?seed=true', {
    //             method: 'POST',
    //         });

    //         if (!companyResponse.ok) {
    //             throw new Error('Failed to seed companies');
    //         }

    //         const companyResult = await companyResponse.json();
    //         console.log('Companies seeded:', companyResult);

    //         alert(`Companies seeded successfully! Count: ${companyResult.count}`);

    //     } catch (error) {
    //         console.error('Seeding failed:', error);
    //         alert('Failed to seed companies. Check console for details.');
    //     } finally {
    //         setIsSeeding(false);
    //     }
    // };

    // const seedDatabase = async () => {
    //     setIsSeeding(true);
    //     try {
    //         // Seed categories first
    //         const categoryResponse = await fetch('/api/category?seed=true', {
    //             method: 'POST',
    //         });

    //         if (!categoryResponse.ok) {
    //             throw new Error('Failed to seed categories');
    //         }

    //         const categoryResult = await categoryResponse.json();
    //         console.log('Categories seeded:', categoryResult);

    //         // Then seed companies
    //         const companyResponse = await fetch('/api/company?seed=true', {
    //             method: 'POST',
    //         });

    //         if (!companyResponse.ok) {
    //             throw new Error('Failed to seed companies');
    //         }

    //         const companyResult = await companyResponse.json();
    //         console.log('Companies seeded:', companyResult);

    //         // Finally seed products
    //         const productResponse = await fetch('/api/products?seed=true', {
    //             method: 'POST',
    //         });

    //         if (!productResponse.ok) {
    //             throw new Error('Failed to seed products');
    //         }

    //         const productResult = await productResponse.json();
    //         console.log('Products seeded:', productResult);

    //         alert(`Database seeded successfully!\nCategories: ${categoryResult.count}\nCompanies: ${companyResult.count}\nProducts: ${productResult.count}`);

    //     } catch (error) {
    //         console.error('Seeding failed:', error);
    //         alert('Failed to seed database. Check console for details.');
    //     } finally {
    //         setIsSeeding(false);
    //     }
    // };
  return (
    <>
      {/* Main Navbar */}
      <div className="md:static fixed top-0 left-0 right-0 z-[10000] bg-white border-b border-slate-200 md:border-none md:relative">
        <div className="flex flex-row justify-between py-3 px-5 items-center gap-5 w-full">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-full hover:bg-slate-100 relative"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <Menu 
              className={`w-6 h-6 text-slate-800 transition-all duration-300 ${
                menuOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
              }`}
            />
            <X 
              className={`w-6 h-6 text-slate-800 absolute top-2 left-2 transition-all duration-300 ${
                menuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
              }`}
            />
          </button>
          {/* Hide logo on mobile per request; keep link space for desktop */}
          <Link href={"/"} className="hidden md:block">
            <div className="flex flex-row md:gap-5 gap-2 w-fit flex-none ">
              <img src="/images/Cravio_Logo.png" className="w-15 sm:w-20 h-auto rounded-sm md:rounded-lg lg:rounded-xl"/>
              <p className="self-center font-brasika text-primary hidden sm:text-sm md:block md:text-lg lg:text-2xl">Cravio</p>
            </div>
          </Link>
          {/* <button onClick={seedDatabase} className="bg-primary text-accents px-4 py-2 rounded-md">Seed Database</button> */}
        </div>
        
        {/* Location Selector for Desktop */}
        <div className="hidden md:flex md:relative w-100 flex-row bg-accents py-1 px-1 md:py-2 md:px-2 gap-5 items-center md:px-5 justify-center items-center rounded-lg">
            <div className="relative w-5 h-5 md:w-9 md:h-7">
                <Image
                src="/images/location-pin (1).png"
                alt="Cravio Location"
                fill
                />
            </div>
            <LocationSelector/>
        </div>
        {/* Mobile deliver to compact button */}
        <div className="md:hidden flex-1 flex justify-center">
          <button
            onClick={() => setLocOpen(true)}
            className="flex items-center gap-2 px-3 py-2"
          >
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[11px] text-slate-500">Deliver to</span>
              <span className="text-[0.75rem] font-semibold text-slate-800">{shortAddress}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-700" />
          </button>
        </div>
        <button
          className="md:hidden p-2 rounded-full hover:bg-slate-100 relative"
          aria-label="Search"
          onClick={() => {
            const next = !mobileSearchActive;
            setMobileSearchActive(next);
            const event = new CustomEvent(next ? "mobile-search-open" : "mobile-search-close");
            window.dispatchEvent(event);
          }}
        >
          <span className="relative w-6 h-6 inline-flex items-center justify-center">
            <Search
              className={`absolute w-6 h-6 text-slate-800 transition-all duration-300 ${
                mobileSearchActive ? "opacity-0 -rotate-45 scale-75" : "opacity-100 rotate-0 scale-100"
              }`}
            />
            <X
              className={`absolute w-6 h-6 text-slate-800 transition-all duration-300 ${
                mobileSearchActive ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-45 scale-75"
              }`}
            />
          </span>
        </button>
        {session?<AccountInfo session={session} onSignOut={signOut}/>:
      <div className="flex flex-row gap-2 justify-end w-fit">
            <button className="hidden md:inline-flex px-10 cursor-pointer md:px-30 py-2 hover:bg-secondary hover:text-accents w-full font-sifonn rounded-md bg-primary text-accents text-xs md:text-lg"
            onClick={()=>{setIsOpen(true);setIsEmployee(false)}}
            >Login/Sign Up</button>
        </div>}
        {cartItems.length > 0 && (
          <button
            onClick={() => setCartOpen(!CartOpen)}
            className="hidden md:block relative p-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Toggle cart"
          >
            <div className="relative w-12 h-12">
                <Image
                    src="/images/plastic-bag.png"
                    alt="cart"
                    fill
                />
            </div>
            <div className="rounded-full w-5 h-5 bg-primary absolute -top-1 -right-1 text-accents text-xs flex items-center justify-center font-bold">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </button>
        )}
        {/* Employee Links */}
        {session && session.user.role === 'EMPLOYEE' && (
          <div className="hidden md:flex flex-row gap-4 ml-4">
            <Link href="/admin/orders" className="text-accents bg-primary p-4 hover:text-amber-300 font-sifonn text-sm">
              Manage Orders
            </Link>
          </div>
        )}

        {/* <div className="block md:hidden">
            <Bars3Icon className="h-5 w-5" onClick={()=>{console.log("hello");
            }}/>
        </div> */}

        </div>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-[9998] md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-5/6 max-w-sm bg-white shadow-2xl rounded-r-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xl font-bold text-slate-900">Menu</p>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-slate-700" />
              </button>
            </div>
            <div className="space-y-3">
              {session && (
                <>
                  <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-slate-800 font-medium">
                    <span>My Account</span>
                  </Link>
                  <Link href="/user-info" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-slate-800 font-medium">
                    <span>Addresses</span>
                  </Link>
                  <Link href="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-slate-800 font-medium">
                    <span>Orders</span>
                  </Link>
                </>
              )}
              <Link href="/help" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-slate-800 font-medium">
                <span>Help Center</span>
              </Link>
            </div>
            <div className="mt-auto">
              {session ? (
                <button
                  className="w-full bg-primary text-white rounded-lg py-3 font-semibold"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign out
                </button>
              ) : (
                <button
                  className="w-full bg-primary text-white rounded-lg py-3 font-semibold"
                  onClick={() => {
                    setIsOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <MobileLocationDrawer isOpen={locOpen} onClose={() => setLocOpen(false)} />
    </>
  )
}

export default Navbar