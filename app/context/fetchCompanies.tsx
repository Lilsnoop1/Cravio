"use client"
import { createContext, useContext, useState,useEffect } from "react";
import { Company } from "../Data/database";

type CompanyValue = {
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  loading: boolean;
  // legacy aliases
  CompaniesFetch?: Company[];
  setCompaniesFetch?: React.Dispatch<React.SetStateAction<Company[]>>;
};

const CompanyContext = createContext<CompanyValue | null>(null);

export function CompaniesProvider({children}:{children:React.ReactNode}) {
    const [companies,setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/company"); // GET request
      const data = await res.json();
      setCompanies(data);
    } catch (err) {
      console.error("Failed to fetch companies", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCompanies();
  }, []);
  return (
    <CompanyContext.Provider value={{companies,setCompanies, loading, CompaniesFetch: companies, setCompaniesFetch: setCompanies}}>
        {children}
    </CompanyContext.Provider>
  )
}

export const useCompanies= ()=>{
  const ctx = useContext(CompanyContext);
  if(!ctx) throw new Error("useCompanies must be used inside CompaniesProvider");
  return ctx;
}
