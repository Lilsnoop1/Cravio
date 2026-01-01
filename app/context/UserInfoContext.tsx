"use client";
import { createContext, useContext, useState } from "react";

type UserInfoValue = {
  phoneNumber: string;
  setPhoneNumber: React.Dispatch<React.SetStateAction<string>>;
  street: string | undefined;
  setStreet: React.Dispatch<React.SetStateAction<string | undefined>>;
  building: string | undefined;
  setBuilding: React.Dispatch<React.SetStateAction<string | undefined>>;
  city: string;
  setCity: React.Dispatch<React.SetStateAction<string>>;
};

const UserInfoContext = createContext<UserInfoValue | null>(null);

export function UserInfoProvider({ children }: { children: React.ReactNode }) {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [street,setStreet] = useState<string>();
  const [building,setBuilding] = useState<string>();
  const [city,setCity] = useState<string>("");

  return (
    <UserInfoContext.Provider value={{ 
      phoneNumber, 
      setPhoneNumber,street,setStreet,building,setBuilding,city,setCity
    }}>
      {children}
    </UserInfoContext.Provider>
  );
}

export const useUserInfo = () => {
  const ctx = useContext(UserInfoContext);
  if(!ctx) throw new Error("useUserInfo must be used inside UserInfoProvider");
  return ctx;
};
