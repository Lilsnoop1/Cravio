import Link from "next/link";
import type { CardProps } from "../Data/database";

function resolveHref(linkUrl?: string | null): string | null {
  const raw = linkUrl?.trim();
  if (!raw) return null;
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("/") ||
    raw.startsWith("mailto:") ||
    raw.startsWith("#")
  ) {
    return raw;
  }
  return `https://${raw}`;
}

function isInternalHref(href: string): boolean {
  return href.startsWith("/") || href.startsWith("#");
}

const Card = ({ image, title, linkUrl }: CardProps) => {
  const href = resolveHref(linkUrl);
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={title || "Banner"}
      draggable={false}
      className={`h-full w-full object-cover rounded-lg md:rounded-3xl pointer-events-none${href ? " cursor-pointer" : ""}`}
    />
  );

  const linkClass = "relative z-[1] block h-full w-full cursor-pointer";
  const label = title ? `Open ${title}` : "Open banner link";

  return (
    <div className="flex-[0_0_92%] md:flex-[0_0_100%] h-full px-[1.25px] min-w-0 md:px-2">
      {href && isInternalHref(href) ? (
        <Link href={href} className={linkClass} aria-label={label}>
          {img}
        </Link>
      ) : href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label={label}
        >
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  );
};

export default Card;
