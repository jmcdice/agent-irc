'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { UserMenu } from '@/components/layout/user-menu';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';
import { ThemeSelector } from '@/components/themes/theme-selector';
import { Separator } from '@/components/ui/separator';
import { CommandMenu } from '@/components/command-menu';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/api/me`, {
          credentials: 'include',
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else if (res.status === 401) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // Network error - likely API not reachable, redirect to login
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    // Always redirect to login after logout attempt
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Sticky header */}
        <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 bg-background backdrop-blur-sm px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <CommandMenu />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <ThemeSelector />
            <ThemeModeToggle />
            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </header>
        {/* Gradient fade below header */}
        <div className="sticky top-14 z-40 h-6 bg-gradient-to-b from-background via-background/50 to-transparent pointer-events-none" />
        <main className="flex-1 overflow-auto -mt-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

