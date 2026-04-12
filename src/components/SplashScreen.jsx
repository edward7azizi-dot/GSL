import { useEffect, useState } from "react";

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFading(true), 1800);
    const done = setTimeout(() => onDone(), 2400);
    return () => {
      clearTimeout(timer);
      clearTimeout(done);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
      style={{ opacity: fading ? 0 : 1, transition: "opacity 0.6s ease", pointerEvents: fading ? "none" : "all" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl">
          <img
            src="/images/gsl-logo.jpg"
            alt="GSL Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-center">
          <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase mt-1">GTA Super League</p>
        </div>
        <div className="mt-2 w-16 h-1 rounded-full bg-primary animate-pulse" />
      </div>
    </div>
  );
}