import React from 'react';

/**
 * AuraBackground
 * Provides the persistent rotating Blue Aura planet/sphere across EVERY page:
 * Landing, Timetable, Login, and Admin Portal.
 * Scales dynamically to full-window width and height on all devices.
 */
export default function AuraBackground() {
  return (
    <>
      {/* Root SVG Noise Filter for the shining iridescent text */}
      <svg className="fixed top-0 left-0 w-0 h-0 pointer-events-none -z-50" aria-hidden="true">
        <defs>
          <filter id="c3-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0"
            />
            <feComposite in2="SourceGraphic" operator="in" result="noise" />
            <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
          </filter>
        </defs>
      </svg>

      {/* Persistent Full-Window Blue Aura Container */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#0c0c0c]">
        {/* Ambient Radiant Fallback Gradient */}
        <div
          className="absolute inset-0 w-full h-full opacity-60"
          style={{
            background:
              'radial-gradient(circle at 75% 35%, rgba(0, 210, 255, 0.22) 0%, rgba(11, 37, 81, 0.45) 45%, rgba(9, 16, 32, 0.85) 75%, #0c0c0c 100%)',
          }}
        />

        {/* Global High-Resolution Blue Aura Planetary Motion Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none opacity-85 select-none transition-opacity duration-1000"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
        />

        {/* Subtle Radial Vignette to maintain readable text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c]/85 via-transparent to-[#0c0c0c]/40" />

        {/* Subtle 1px Screen Border Guide Lines (1px from edge on left and right across all pages) */}
        <div className="pointer-events-none fixed inset-y-0 left-[1px] w-[1px] bg-white/[0.12] z-50" />
        <div className="pointer-events-none fixed inset-y-0 right-[1px] w-[1px] bg-white/[0.12] z-50" />
      </div>
    </>
  );
}
