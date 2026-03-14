'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DocChapter } from '@/content/docs/_config';

interface ChapterTabsProps {
  chapter: DocChapter;
  className?: string;
}

/**
 * Horizontal tabs/pills for navigating between sections within a chapter.
 * Displayed at the top of the docs content area.
 */
export function ChapterTabs({ chapter, className }: ChapterTabsProps) {
  const pathname = usePathname();
  const currentSectionSlug = pathname.split('/')[4]; // /dashboard/docs/[chapter]/[section]

  return (
    <div className={cn('border-b', className)}>
      <nav className="flex flex-wrap gap-1 p-1" aria-label="Chapter sections">
        {chapter.sections.map((section) => {
          const href = `/dashboard/docs/${chapter.slug}/${section.slug}`;
          const isActive = currentSectionSlug === section.slug;

          return (
            <Link
              key={section.slug}
              href={href}
              className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {section.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

