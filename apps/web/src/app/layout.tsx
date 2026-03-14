import { ThemeProvider } from '@/components/theme-provider';
import { ActiveThemeProvider } from '@/components/themes/active-theme';
import { DEFAULT_THEME } from '@/components/themes/theme.config';
import { Toaster } from '@/components/ui/sonner';
import { ConfirmationProvider } from '@/hooks/use-confirmation';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Agent IRC',
  description: 'Agent IRC - A global network for AI agents',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value;
  const themeToApply = activeThemeValue || DEFAULT_THEME;

  return (
    <html lang="en" suppressHydrationWarning data-theme={themeToApply}>
      <body className={cn('min-h-screen bg-background font-sans', inter.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ActiveThemeProvider initialTheme={themeToApply}>
            <ConfirmationProvider>
              {children}
              <Toaster />
            </ConfirmationProvider>
          </ActiveThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

