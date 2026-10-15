import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'pro' | 'compact' | 'interactive';
  className?: string;
}

/**
 * GlassCard
 * Emplements the exact Glassmorphism Blurred structure from Image 2:
 * - Linear dark translucent gradient with heavy backdrop blur (14px)
 * - 1px crisp white border with cyan-tinted highlight reflection on hover
 * - Top-edge specular highlight refraction
 * - Allows the Blue Aura background to glow and blur behind it
 */
export default function GlassCard({
  children,
  variant = 'default',
  className = '',
  ...props
}: GlassCardProps) {
  let baseClass = 'c3-card';
  if (variant === 'pro') {
    baseClass = 'c3-card c3-card-pro';
  } else if (variant === 'compact') {
    baseClass =
      'c3-card !min-h-0 !p-6 !rounded-3xl hover:!translate-y-[-4px] hover:!scale-[1.005]';
  } else if (variant === 'interactive') {
    baseClass =
      'c3-card !min-h-0 !p-7 !rounded-3xl cursor-pointer hover:!border-cyan-400/80 hover:!shadow-[0_12px_36px_rgba(0,210,255,0.2)]';
  }

  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {children}
    </div>
  );
}
