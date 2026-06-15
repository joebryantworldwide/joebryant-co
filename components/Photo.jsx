"use client";

const WIDTHS = [750, 1000, 1500, 2500];

// Build a sized URL for either image host:
// Squarespace CDN uses ?format=<w>w, Sanity CDN uses ?w=<w>&auto=format.
export function sizedUrl(src, w) {
  if (src.includes("cdn.sanity.io")) {
    return `${src}${src.includes("?") ? "&" : "?"}w=${w}&auto=format&q=80`;
  }
  return `${src}?format=${w}w`;
}

export default function Photo({
  src,
  alt,
  drift = true,
  priority = false,
  sizes = "100vw",
  className = "",
  position,
  imgStyle,
  caption,
  lightbox = true,
}) {
  const srcSet = WIDTHS.map((w) => `${sizedUrl(src, w)} ${w}w`).join(", ");
  const style = {
    ...(position ? { objectPosition: position } : null),
    ...imgStyle,
  };

  const open = lightbox
    ? () => {
        window.dispatchEvent(
          new CustomEvent("jb:lightbox", {
            detail: { src, alt, caption: caption || alt },
          })
        );
      }
    : undefined;

  return (
    <div
      className={`photo ${lightbox ? "clickable" : ""} ${className}`.trim()}
      onClick={open}
      role={lightbox ? "button" : undefined}
      tabIndex={lightbox ? 0 : undefined}
      onKeyDown={lightbox ? (e) => e.key === "Enter" && open() : undefined}
      aria-label={lightbox ? `View ${alt}` : undefined}
    >
      <img
        src={sizedUrl(src, 1500)}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        draggable={false}
        className={drift ? "drift" : undefined}
        style={Object.keys(style).length ? style : undefined}
      />
    </div>
  );
}
