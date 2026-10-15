import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'pro' | 'compact' | 'glow';
  hoverEffect?: boolean;
}

export default function GlassCard({
  children,
  className = '',
  variant = 'default',
  hoverEffect = false,
  ...props
}: GlassCardProps) {
  const baseClasses =
    'relative rounded-3xl backdrop-blur-3xl transition-all duration-300 overflow-hidden text-[#E9EEF5]';

  const variantClasses = {
    default:
      'bg-[rgba(16,20,32,0.65)] border border-[#E9EEF5]/12 shadow-[0_14px_40px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
    pro:
      'bg-gradient-to-b from-[rgba(20,25,40,0.85)] to-[rgba(12,15,25,0.75)] border border-[#E9EEF5]/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
    compact:
      'bg-[rgba(16,20,32,0.5)] border border-[#E9EEF5]/10 shadow-[0_8px_24px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
    glow:
      'bg-[rgba(16,20,32,0.75)] border border-[#74C947]/30 shadow-[0_12px_36px_rgba(116,201,71,0.15)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
  };

  const hoverClasses = hoverEffect
    ? 'hover:-translate-y-1 hover:border-[#74C947]/40 hover:shadow-[0_20px_48px_rgba(0,0,0,0.6)]'
    : '';

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
      {...props}
    >
      {/* Top subtle specular reflection line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}
