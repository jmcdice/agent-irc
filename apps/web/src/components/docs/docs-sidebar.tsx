'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { docsConfig, type DocChapter } from '@/content/docs/_config';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DocsSidebarProps {
  className?: string;
}

export function DocsSidebar({ className }: DocsSidebarProps) {
  const pathname = usePathname();
  
  // Determine which chapter is active based on current path
  const getActiveChapter = (): string | null => {
    for (const chapter of docsConfig) {
      if (pathname.includes(`/docs/${chapter.slug}`)) {
        return chapter.slug;
      }
    }
    return docsConfig[0]?.slug ?? null;
  };

  // Initialize open chapters - default to the active chapter being open
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>(() => {
    const activeChapter = getActiveChapter();
    const initial: Record<string, boolean> = {};
    docsConfig.forEach((chapter) => {
      initial[chapter.slug] = chapter.slug === activeChapter;
    });
    return initial;
  });

  // Update open chapters when pathname changes
  useEffect(() => {
    const activeChapter = getActiveChapter();
    if (activeChapter && !openChapters[activeChapter]) {
      setOpenChapters((prev) => ({ ...prev, [activeChapter]: true }));
    }
  }, [pathname]);

  const toggleChapter = (slug: string) => {
    setOpenChapters((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const isActiveSection = (chapterSlug: string, sectionSlug: string): boolean => {
    return pathname === `/dashboard/docs/${chapterSlug}/${sectionSlug}`;
  };

  return (
    <aside className={cn('w-64 shrink-0', className)}>
      <div className="h-full overflow-y-auto py-6 pr-4">
        <div className="flex items-center gap-2 px-3 mb-4">
          <BookOpenIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Documentation</h2>
        </div>

        <nav className="space-y-1">
          {docsConfig.map((chapter) => (
            <ChapterItem
              key={chapter.slug}
              chapter={chapter}
              isOpen={openChapters[chapter.slug] ?? false}
              onToggle={() => toggleChapter(chapter.slug)}
              isActiveSection={isActiveSection}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}

interface ChapterItemProps {
  chapter: DocChapter;
  isOpen: boolean;
  onToggle: () => void;
  isActiveSection: (chapterSlug: string, sectionSlug: string) => boolean;
}

function ChapterItem({ chapter, isOpen, onToggle, isActiveSection }: ChapterItemProps) {
  // Check if any section in this chapter is active
  const hasActiveSection = chapter.sections.some((s) =>
    isActiveSection(chapter.slug, s.slug)
  );

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
        <span className={cn(hasActiveSection && 'text-primary')}>{chapter.title}</span>
        <ChevronRightIcon
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-90'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-3">
        <ul className="border-l border-border ml-3 space-y-1 py-1">
          {chapter.sections.map((section) => {
            const isActive = isActiveSection(chapter.slug, section.slug);
            return (
              <li key={section.slug}>
                <Link
                  href={`/dashboard/docs/${chapter.slug}/${section.slug}`}
                  className={cn(
                    'block py-1.5 pl-4 text-sm transition-colors hover:text-foreground',
                    isActive
                      ? 'text-primary font-medium border-l-2 border-primary -ml-px'
                      : 'text-muted-foreground'
                  )}
                >
                  {section.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

