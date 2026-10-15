import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export function SchedFlowMark({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export interface AppleButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'glass' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export default function AppleButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled = false,
  onClick,
  ...props
}: AppleButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs rounded-full gap-2',
    md: 'px-5 py-2.5 text-xs sm:text-sm rounded-full gap-2.5',
    lg: 'px-7 py-3.5 text-sm sm:text-base rounded-full gap-3',
  };

  const variantClasses = {
    primary:
      'bg-[#74C947] text-[#081a05] font-extrabold shadow-[0_10px_28px_rgba(116,201,71,0.3)] hover:brightness-110 border border-white/20',
    secondary:
      'bg-white/[0.08] text-white border border-white/14 hover:bg-white/[0.14] hover:border-white/25',
    glass:
      'glass text-white/90 border border-white/14 hover:text-white hover:border-[#74C947]/50',
    glow:
      'bg-[#74C947]/20 text-[#74C947] border border-[#74C947]/40 shadow-[0_0_20px_rgba(116,201,71,0.2)] hover:bg-[#74C947] hover:text-[#081a05]',
  };

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02, y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      disabled={disabled}
      onClick={onClick}
      className={`group apple-btn btn-wave relative inline-flex items-center justify-center font-medium tracking-tight transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:pointer-events-none select-none overflow-hidden ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="relative z-10 shrink-0">{icon}</span>}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

export function ReplyButton(props: AppleButtonProps) {
  return <AppleButton variant="glass" {...props} />;
}

export function CTAButton(props: AppleButtonProps) {
  return <AppleButton variant="primary" {...props} />;
}
