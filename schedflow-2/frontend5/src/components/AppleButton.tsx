import React from 'react';
import { ChevronRight } from 'lucide-react';

// Apple logo removed per user request: using native SchedFlowMark icon

export function SchedFlowMark({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" className={className} aria-hidden="true">
      <path d="M 0 128 C 70.692 128 128 185.308 128 256 L 64 256 C 64 220.654 35.346 192 0 192 Z M 256 192 C 220.654 192 192 220.654 192 256 L 128 256 C 128 185.308 185.308 128 256 128 Z M 128 0 C 128 70.692 70.692 128 0 128 L 0 64 C 35.346 64 64 35.346 64 0 Z M 192 0 C 192 35.346 220.654 64 256 64 L 256 128 C 185.308 128 128 70.692 128 0 Z" />
    </svg>
  );
}

export interface AppleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  full?: boolean;
  variant?: 'white' | 'glass' | 'cyan' | 'reply' | 'cta' | 'black';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export default function AppleButton({
  label = 'Download Aura',
  full = false,
  variant = 'white',
  icon,
  className = '',
  children,
  ...props
}: AppleButtonProps) {
  let styleClasses =
    'bg-white text-black font-semibold shadow-[0_4px_24px_rgba(255,255,255,0.25)]';

  if (variant === 'glass') {
    styleClasses =
      'bg-white/[0.08] backdrop-blur-xl text-white font-medium border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]';
  } else if (variant === 'black') {
    styleClasses =
      'bg-[#0a0908] text-white font-semibold border border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.6)]';
  } else if (variant === 'cyan') {
    styleClasses =
      'bg-gradient-to-r from-[#00d2ff] to-[#3D81E3] text-black font-semibold shadow-[0_0_28px_rgba(0,210,255,0.4)]';
  } else if (variant === 'reply') {
    styleClasses =
      'bg-white/[0.08] backdrop-blur-xl text-white font-medium border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.35)]';
  } else if (variant === 'cta') {
    styleClasses =
      'bg-white text-black font-semibold shadow-[0_4px_24px_rgba(255,255,255,0.25)]';
  }

  return (
    <button
      type="button"
      className={`group apple-btn btn-wave inline-flex items-center justify-center gap-2.5 rounded-full text-sm px-6 py-3 cursor-pointer select-none ${styleClasses} ${
        full ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {icon !== undefined ? icon : <SchedFlowMark className="w-4 h-4 shrink-0 text-current" />}
      <span className="whitespace-nowrap tracking-tight">{children || label}</span>
      <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-[2px] shrink-0" />
    </button>
  );
}

export function ReplyButton(props: AppleButtonProps) {
  return <AppleButton variant="reply" {...props} />;
}

export function CTAButton(props: AppleButtonProps) {
  return <AppleButton variant="cta" {...props} />;
}
