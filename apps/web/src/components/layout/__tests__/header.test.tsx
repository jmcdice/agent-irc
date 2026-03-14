import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../header';

// Mock all dependencies
vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: ({ className }: { className?: string }) => (
    <button data-testid="sidebar-trigger" className={className}>
      Sidebar Trigger
    </button>
  ),
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: ({ orientation, className }: { orientation?: string; className?: string }) => (
    <div data-testid="separator" data-orientation={orientation} className={className} />
  ),
}));

vi.mock('@/components/themes/theme-selector', () => ({
  ThemeSelector: () => <div data-testid="theme-selector">Theme Selector</div>,
}));

vi.mock('@/components/themes/theme-mode-toggle', () => ({
  ThemeModeToggle: () => <button data-testid="theme-mode-toggle">Toggle Theme</button>,
}));

vi.mock('@/components/breadcrumbs', () => ({
  Breadcrumbs: () => <nav data-testid="breadcrumbs">Breadcrumbs</nav>,
}));

describe('Header', () => {
  it('should render header element', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should render sidebar trigger', () => {
    render(<Header />);
    expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument();
  });

  it('should render separator', () => {
    render(<Header />);
    const separator = screen.getByTestId('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
  });

  it('should render breadcrumbs', () => {
    render(<Header />);
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
  });

  it('should render theme selector', () => {
    render(<Header />);
    expect(screen.getByTestId('theme-selector')).toBeInTheDocument();
  });

  it('should render theme mode toggle', () => {
    render(<Header />);
    expect(screen.getByTestId('theme-mode-toggle')).toBeInTheDocument();
  });

  it('should have correct layout classes', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header.className).toContain('flex');
    expect(header.className).toContain('h-16');
    expect(header.className).toContain('items-center');
  });
});

