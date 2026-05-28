"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ThreeHouseCanvas = dynamic(
  () => import("./ThreeHouseCanvas").then((mod) => ({ default: mod.ThreeHouseCanvas })),
  { ssr: false }
);

function MobileHouseFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .animate-float-illustration {
          animation: float 6s ease-in-out infinite;
        }
        .animate-glow-node {
          animation: pulseGlow 3s ease-in-out infinite;
        }
      `}</style>
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full max-w-[380px] mx-auto filter drop-shadow-[0_0_25px_rgba(143,205,255,0.15)] animate-float-illustration"
      >
        <defs>
          <linearGradient id="houseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background radial glow */}
        <circle cx="200" cy="200" r="180" fill="url(#bgGlow)" />

        {/* Grid lines representing system integration */}
        <g stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1">
          <line x1="50" y1="200" x2="350" y2="200" />
          <line x1="200" y1="50" x2="200" y2="350" />
          <circle cx="200" cy="200" r="100" fill="none" />
          <circle cx="200" cy="200" r="145" fill="none" />
        </g>

        {/* Isometric Ground Base */}
        <ellipse
          cx="200"
          cy="285"
          rx="110"
          ry="22"
          fill="#0f172a"
          fillOpacity="0.6"
          stroke="#ffffff"
          strokeOpacity="0.08"
          strokeWidth="1"
        />

        {/* House Walls */}
        {/* Left Wall */}
        <path
          d="M 125 235 L 200 272 L 200 185 L 125 148 Z"
          fill="url(#houseGrad)"
          stroke="#ffffff"
          strokeOpacity="0.15"
          strokeWidth="1"
        />
        {/* Right Wall */}
        <path
          d="M 200 272 L 275 235 L 275 148 L 200 185 Z"
          fill="#4f46e5"
          fillOpacity="0.35"
          stroke="#ffffff"
          strokeOpacity="0.15"
          strokeWidth="1"
        />

        {/* Roof */}
        <path
          d="M 125 148 L 200 185 L 275 148 L 200 110 Z"
          fill="url(#roofGrad)"
          stroke="#ffffff"
          strokeOpacity="0.25"
          strokeWidth="1.5"
        />

        {/* Glass Windows */}
        {/* Left Window */}
        <path
          d="M 145 185 L 172 198 L 172 165 L 145 152 Z"
          fill="#7dd3fc"
          fillOpacity="0.65"
          style={{ filter: "drop-shadow(0 0 6px rgba(125,211,252,0.6))" }}
        />
        {/* Right Window */}
        <path
          d="M 228 198 L 255 185 L 255 152 L 228 165 Z"
          fill="#8fcdff"
          fillOpacity="0.6"
          style={{ filter: "drop-shadow(0 0 6px rgba(143,205,255,0.5))" }}
        />

        {/* Glowing Door */}
        <path
          d="M 185 265 L 200 272 L 200 225 L 185 218 Z"
          fill="#6366f1"
          fillOpacity="0.75"
          style={{ filter: "drop-shadow(0 0 8px rgba(99,102,241,0.7))" }}
        />

        {/* Connecting Lines and Glowing Nodes */}
        {/* Tasks Node */}
        <g className="animate-glow-node">
          <circle cx="200" cy="85" r="6" fill="#0284c7" style={{ filter: "drop-shadow(0 0 6px #0284c7)" }} />
          <circle cx="200" cy="85" r="12" fill="none" stroke="#0284c7" strokeOpacity="0.3" strokeWidth="1" />
        </g>
        <path d="M 200 85 Q 200 95 200 110" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.5" />

        {/* Expenses Node */}
        <g className="animate-glow-node" style={{ animationDelay: "1s" }}>
          <circle cx="95" cy="185" r="5" fill="#6366f1" style={{ filter: "drop-shadow(0 0 6px #6366f1)" }} />
          <circle cx="95" cy="185" r="10" fill="none" stroke="#6366f1" strokeOpacity="0.3" strokeWidth="1" />
        </g>
        <path d="M 95 185 Q 110 185 125 185" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.5" />

        {/* Inventory Node */}
        <g className="animate-glow-node" style={{ animationDelay: "2s" }}>
          <circle cx="305" cy="185" r="5" fill="#7dd3fc" style={{ filter: "drop-shadow(0 0 6px #7dd3fc)" }} />
          <circle cx="305" cy="185" r="10" fill="none" stroke="#7dd3fc" strokeOpacity="0.3" strokeWidth="1" />
        </g>
        <path d="M 305 185 Q 290 185 275 185" fill="none" stroke="#7dd3fc" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.5" />
      </svg>
    </div>
  );
}

export function ThreeHouse() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint is 1024px
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile === null) {
    return <div className="w-full h-full" />;
  }

  if (isMobile) {
    return <MobileHouseFallback />;
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <ThreeHouseCanvas />
    </div>
  );
}
