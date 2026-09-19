"use client";

import { useRef, useState } from "react";
import { resolveFileUrl } from "@/lib/api";

interface ImageCarouselImage {
  id: string;
  imageUrl: string;
}

interface ImageCarouselProps {
  images: ImageCarouselImage[];
  altText: string;
  fallbackSeed: string;
}

const FALLBACK_ID = "__fallback__";

export function ImageCarousel({ images, altText, fallbackSeed }: ImageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState<{ id: string; x: number; y: number } | null>(null);

  const displayImages: ImageCarouselImage[] =
    images.length > 0
      ? images
      : [{ id: FALLBACK_ID, imageUrl: `https://picsum.photos/seed/${fallbackSeed}/640/640` }];

  const resolveSrc = (img: ImageCarouselImage) =>
    img.id === FALLBACK_ID ? img.imageUrl : resolveFileUrl(img.imageUrl);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const handleDoubleClick = (
    e: React.MouseEvent<HTMLDivElement>,
    imgId: string
  ) => {
    if (zoom?.id === imgId) {
      setZoom(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ id: imgId, x, y });
  };

  return (
    <div className="ig-media">
      <div className="ig-carousel-track">
        <div className="image-row" ref={scrollRef} onScroll={handleScroll}>
          {displayImages.map((img) => {
            const isZoomed = zoom?.id === img.id;
            return (
              <div key={img.id} className="image-tile">
                <div
                  className={`image-tile-button${isZoomed ? " zoomed" : ""}`}
                  onDoubleClick={(e) => handleDoubleClick(e, img.id)}
                >
                  <img
                    src={resolveSrc(img)}
                    alt={altText}
                    style={
                      isZoomed
                        ? { transform: "scale(2.2)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                        : undefined
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {displayImages.length > 1 && (
        <div className="ig-carousel-dots">
          {displayImages.map((_, i) => (
            <span key={i} className={`ig-carousel-dot${i === activeIndex ? " active" : ""}`} />
          ))}
        </div>
      )}
    </div>
  );
}
