"use client";

import { useState } from "react";
import Image from "next/image";

type LogoMarkProps = {
  className?: string;
  fallbackClassName?: string;
};

export default function LogoMark({
  className = "h-12 w-36",
  fallbackClassName = "text-base font-semibold text-nordix-ink"
}: LogoMarkProps) {
  const [showFallback, setShowFallback] = useState(false);

  if (showFallback) {
    return (
      <span className={fallbackClassName}>
        Feel Nordix
      </span>
    );
  }

  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <Image
        src="/logo-feel-nordix.png"
        alt="Feel Nordix"
        fill
        priority
        className="object-contain object-left"
        onError={() => setShowFallback(true)}
      />
    </span>
  );
}
