"use client";
import Image from "next/image";

import React, { useEffect, useRef } from "react";
import type { Garment } from "@/types/Garment";
import { PlayIcon } from "./Icons";

interface ThumbnailProps {
  garment: Garment;
  isActive: boolean;
  onSelect: (garment: Garment) => void;
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  garment,
  isActive,
  onSelect,
}) => {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isActive) {
      ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [isActive]);

  return (
    <button
      ref={ref}
      onClick={() => onSelect(garment)}
      className={`group relative w-[80px] h-[100px] flex-shrink-0 rounded-xl overflow-hidden transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-800 focus:ring-white ${isActive
        ? "ring-2 ring-[#D4A373] scale-100 shadow-xl z-10"
        : "opacity-90 grayscale hover:grayscale-0 hover:opacity-100"
        }`}
      aria-label={`Ver ${garment.title}`}
      aria-current={isActive ? "true" : "false"}
    >
      {garment.imagen_principal ? (
        <Image
          src={garment.imagen_principal}
          alt={garment.title}
          fill
          unoptimized
          sizes="100px"
          className="object-cover"
        />
      ) : garment.videoUrl ? (
        <video
          src={garment.videoUrl}
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-stone-700"></div>
      )}
      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <PlayIcon className="w-6 h-6 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110" />
      </div>
    </button>
  );
};

interface ThumbnailStripProps {
  garments: Garment[];
  currentGarment: Garment | null;
  onSelectGarment: (garment: Garment) => void;
}

const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({
  garments,
  currentGarment,
  onSelectGarment,
}) => {
  return (
    <div className="bg-transparent px-4 pt-2 pb-2">
      <div
        className="flex items-center gap-2 overflow-x-auto pb-4 pt-0 custom-scrollbar"
        role="toolbar"
        aria-label="Navegación de productos"
      >
        {garments.map((garment) => (
          <Thumbnail
            key={garment.id}
            garment={garment}
            isActive={!!currentGarment && garment.id === currentGarment.id}
            onSelect={onSelectGarment}
          />
        ))}
      </div>
    </div>
  );
};

export default ThumbnailStrip;
