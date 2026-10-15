import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css';
import { landingMarkup } from './landingMarkup';
import { initLandingEngine } from './landingEngine';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerRef.current) return;
    const cleanup = initLandingEngine(containerRef.current, navigate);
    return () => {
      cleanup();
    };
  }, [navigate]);

  return (
    <div
      ref={containerRef}
      className="landing-root relative w-full overflow-x-hidden bg-black text-[#E9EEF5]"
    >
      <canvas id="scene" />
      <div dangerouslySetInnerHTML={{ __html: landingMarkup }} />
    </div>
  );
}
