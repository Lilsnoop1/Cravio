"use client"
import { X } from "lucide-react";
import Link from "next/link";
import React from "react";

const SearchFormReset = () => {

  const reset = () => {
    const form = document.querySelector(".search-form") as HTMLFormElement;
    if (form) form.reset();
  };

  return (
    <button type="reset" onClick={reset}>
      <Link href='/' className="search-btn">
        <X/>
      </Link>
    </button>
  );
};

export default SearchFormReset;
