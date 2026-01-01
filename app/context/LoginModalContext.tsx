"use client";
import { createContext, useContext, useState } from "react";

type LoginModalValue = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isEmployee: boolean;
  setIsEmployee: React.Dispatch<React.SetStateAction<boolean>>;
};

const LoginModalContext = createContext<LoginModalValue | null>(null);

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);

  return (
    <LoginModalContext.Provider value={{ isOpen, setIsOpen, isEmployee, setIsEmployee }}>
      {children}
    </LoginModalContext.Provider>
  );
}

export const useLoginModal = () => {
  const ctx = useContext(LoginModalContext);
  if (!ctx) throw new Error("useLoginModal must be used inside LoginModalProvider");
  return ctx;
};