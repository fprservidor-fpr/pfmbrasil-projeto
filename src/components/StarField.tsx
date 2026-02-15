"use client";
import { useEffect, useState } from "react";

export function StarField() {
  const [stars, setStars] = useState<{ top: number; left: number; duration: number; size: number; opacity: number; delay: number }[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const newStars = Array.from({ length: 50 }).map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 5 + Math.random() * 10,
      size: Math.random() * 1.2 + 0.3,
      opacity: 0.1 + Math.random() * 0.4,
      delay: Math.random() * 5,
    }));
    setStars(newStars);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full animate-twinkle"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
