"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

const FALLBACK = "/images/dummyimage.png";
const DEAD_HOSTS = ["admin.dealcart.io", "dealcart.io"];

function hostnameOf(src: string) {
  try {
    return new URL(src).hostname;
  } catch {
    return null;
  }
}

function resolveSrc(src: string) {
  const host = hostnameOf(src);
  if (host && DEAD_HOSTS.some((dead) => host === dead || host.endsWith(`.${dead}`))) {
    return FALLBACK;
  }
  return src;
}

function canOptimize(src: string) {
  if (src.startsWith("/")) return true;
  const hostname = hostnameOf(src);
  if (!hostname) return false;
  return (
    hostname === "cdn.craviopk.com" ||
    hostname.endsWith(".craviopk.com") ||
    hostname === "lh3.googleusercontent.com"
  );
}

type CatalogImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
};

export default function CatalogImage({
  src,
  alt,
  onError,
  ...rest
}: CatalogImageProps) {
  const incoming = resolveSrc(src?.trim() ? src.trim() : FALLBACK);
  const [current, setCurrent] = useState(incoming);

  useEffect(() => {
    setCurrent(incoming);
  }, [incoming]);

  return (
    <Image
      {...rest}
      src={current}
      alt={alt}
      unoptimized={!canOptimize(current)}
      onError={(event) => {
        if (current !== FALLBACK) setCurrent(FALLBACK);
        onError?.(event);
      }}
    />
  );
}
