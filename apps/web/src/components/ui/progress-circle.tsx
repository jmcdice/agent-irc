'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressCircleProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  children?: React.ReactNode;
}

const sizeMap = {
  sm: 48,
  md: 64,
  lg: 96,
  xl: 128,
};

const strokeWidthMap = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
};

export function ProgressCircle({
  value,
  max = 100,
  size = 'md',
  strokeWidth,
  showValue = true,
  className,
  trackClassName,
  indicatorClassName,
  children,
}: ProgressCircleProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const dimension = sizeMap[size];
  const stroke = strokeWidth ?? strokeWidthMap[size];
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className="rotate-[-90deg]"
      >
        {/* Track */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={cn('stroke-muted', trackClassName)}
        />
        {/* Indicator */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('stroke-primary transition-all duration-300 ease-in-out', indicatorClassName)}
        />
      </svg>
      {(showValue || children) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children ?? (
            <span className={cn('font-medium text-foreground', {
              'text-xs': size === 'sm',
              'text-sm': size === 'md',
              'text-lg': size === 'lg',
              'text-xl': size === 'xl',
            })}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

