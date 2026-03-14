'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
  className?: string;
}

/**
 * Breadcrumbs component that automatically generates navigation breadcrumbs
 * based on the current pathname.
 * 
 * Features:
 * - Home icon link to root
 * - Intermediate segments as clickable links
 * - Last segment as non-clickable current page indicator
 * - Automatic label formatting (capitalize, replace hyphens with spaces)
 */
export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Don't render for root path
  if (pathname === '/') {
    return null;
  }

  // Split pathname into segments and filter empty strings
  const segments = pathname.split('/').filter(Boolean);

  // Format segment to readable label
  const formatLabel = (segment: string): string => {
    return segment
      .replace(/-/g, ' ')
      .replace(/^./, (char) => char.toUpperCase());
  };

  // Build href for each segment
  const buildHref = (index: number): string => {
    return '/' + segments.slice(0, index + 1).join('/');
  };

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn('flex items-center text-sm text-muted-foreground', className)}
    >
      <ol className="flex items-center gap-1.5">
        {/* Home link */}
        <li>
          <Link 
            href="/" 
            className="hover:text-foreground transition-colors"
          >
            <HomeIcon className="h-4 w-4" />
          </Link>
        </li>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const label = formatLabel(segment);
          const href = buildHref(index);

          return (
            <li key={href} className="flex items-center gap-1.5">
              <ChevronRightIcon className="h-3.5 w-3.5" />
              {isLast ? (
                <span className="font-medium text-foreground">{label}</span>
              ) : (
                <Link 
                  href={href} 
                  className="hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

