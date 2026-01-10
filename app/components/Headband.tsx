"use client"
import { useLoginModal } from "../context/LoginModalContext";
import {signOut, useSession } from "next-auth/react"



const Headband: React.FC = () => {
    const { data: session } = useSession();
  const {isOpen, setIsOpen, isEmployee, setIsEmployee} = useLoginModal();
  return session?(<div className="bg-primary flex flex-row gap-5 py-2 px-10 justify-center items-center">
    <img src="/images/snack.png" className="hidden sm:w-1/12 md:w-1/16 lg:w-1/24 md:block h-auto object-contain"/>
    <h1 className="text-accents font-brasika text-xs md:text-lg">Welcome Back {session.user?.name}</h1>
  </div>):(<div className="bg-primary flex flex-row gap-5 py-2 px-10 justify-center items-center">
    <img src="/images/snack.png" className="hidden sm:w-1/12 md:w-1/16 lg:w-1/24 md:block h-auto object-contain"/>
    <h1 className="text-accents font-brasika text-xs md:text-md lg:text-lg">Snack Smart, Shop Fast - Your Cravings Delivered!</h1>
  </div>)
}

export default Headband