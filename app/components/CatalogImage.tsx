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
  unoptimized,
  ...rest
}: CatalogImageProps) {
  const incoming = resolveSrc(src?.trim() ? src.trim() : FALLBACK);
  const [current, setCurrent] = useState(incoming);
  const [skipOptimizer, setSkipOptimizer] = useState(false);

  useEffect(() => {
    setCurrent(incoming);
    setSkipOptimizer(false);
  }, [incoming]);

  const optimize = Boolean(unoptimized) ? false : canOptimize(current) && !skipOptimizer;

  return (
    <Image
      {...rest}
      key={`${current}:${optimize ? "opt" : "raw"}`}
      src={current}
      alt={alt}
      unoptimized={!optimize}
      onError={(event) => {
        if (current === FALLBACK) return;
        // Optimizer (or a cancelled first load) failed — retry the original file next.
        if (optimize) {
          setSkipOptimizer(true);
          return;
        }
        setCurrent(FALLBACK);
        onError?.(event);
      }}
    />
  );
}
