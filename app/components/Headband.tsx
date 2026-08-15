"use client"
import Image from "next/image";
import { useLoginModal } from "../context/LoginModalContext";
import {signOut, useSession } from "next-auth/react"



const Headband: React.FC = () => {
    const { data: session } = useSession();
  const {isOpen, setIsOpen, isEmployee, setIsEmployee} = useLoginModal();
  return session?(<div className="hidden bg-primary md:flex flex-row gap-5 py-2 px-10 justify-center items-center">
    <Image src="/images/snack.png" alt="" width={48} height={48} className="hidden md:block h-auto w-12 object-contain"/>
    <h1 className="text-accents font-brasika text-xs md:text-lg">Welcome Back {session.user?.name}</h1>
  </div>):(<div className="hidden bg-primary md:flex flex-row gap-5 py-2 px-10 justify-center items-center">
    <Image src="/images/snack.png" alt="" width={48} height={48} className="hidden md:block h-auto w-12 object-contain"/>
    <h1 className="text-accents font-brasika text-xs md:text-md lg:text-lg">Snack Smart, Shop Fast - Your Cravings Delivered!</h1>
  </div>)
}

export default Headband