'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Squares2X2Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  SwatchIcon,
  BookOpenIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { docsConfig } from '@/content/docs/_config';
import { cn } from '@/lib/utils';

// Main nav items (excluding Documentation which is now expandable)
const navItems = [
  { title: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon },
  { title: 'Components', href: '/dashboard/components', icon: SwatchIcon },
  { title: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon },
  { title: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export function AppSidebar() {
  const pathname = usePathname();
  const isInDocs = pathname.startsWith('/dashboard/docs');
  const [docsOpen, setDocsOpen] = useState(isInDocs);

  // Get the current chapter slug from the pathname
  const currentChapterSlug = isInDocs ? pathname.split('/')[3] : null;

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            A
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm">App Shell</span>
            <span className="text-xs text-muted-foreground">Starter Template</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Expandable Documentation Section */}
              <Collapsible open={docsOpen} onOpenChange={setDocsOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isInDocs}
                      tooltip="Documentation"
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpenIcon className="h-4 w-4" />
                        <span>Documentation</span>
                      </span>
                      <ChevronDownIcon
                        className={cn(
                          'h-4 w-4 transition-transform duration-200',
                          docsOpen && 'rotate-180'
                        )}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
                <CollapsibleContent className="ml-4 border-l pl-2 mt-1">
                  {docsConfig.map((chapter) => {
                    const firstSection = chapter.sections[0];
                    const chapterHref = `/dashboard/docs/${chapter.slug}/${firstSection.slug}`;
                    const isChapterActive = currentChapterSlug === chapter.slug;

                    return (
                      <SidebarMenuItem key={chapter.slug}>
                        <SidebarMenuButton
                          asChild
                          isActive={isChapterActive}
                          size="sm"
                          tooltip={chapter.title}
                        >
                          <Link href={chapterHref}>
                            <span className="truncate">{chapter.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

