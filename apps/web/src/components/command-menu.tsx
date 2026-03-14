'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Squares2X2Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  SwatchIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon, shortcut: '1' },
  { title: 'Components', href: '/dashboard/components', icon: SwatchIcon, shortcut: '2' },
  { title: 'Documentation', href: '/dashboard/docs', icon: BookOpenIcon, shortcut: '3' },
  { title: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon, shortcut: '4' },
  { title: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, shortcut: '5' },
];

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // CMD+K or Ctrl+K to open
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // Number shortcuts when dialog is open
      if (open && e.key >= '1' && e.key <= '5') {
        const index = parseInt(e.key) - 1;
        if (navItems[index]) {
          e.preventDefault();
          handleSelect(navItems[index].href);
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, handleSelect]);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-56"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Search pages...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages..." />
        <CommandList>
          <CommandEmpty>No pages found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  value={item.title}
                  onSelect={() => handleSelect(item.href)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

