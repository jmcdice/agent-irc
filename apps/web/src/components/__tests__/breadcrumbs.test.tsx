import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from '../breadcrumbs';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

// Import after mock
import { usePathname } from 'next/navigation';

describe('Breadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null for root path', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    const { container } = render(<Breadcrumbs />);
    expect(container.firstChild).toBeNull();
  });

  it('should render home link and single segment', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<Breadcrumbs />);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '' })).toBeInTheDocument(); // Home icon
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render multiple segments as links', () => {
    vi.mocked(usePathname).mockReturnValue('/settings/profile');
    render(<Breadcrumbs />);
    
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('should capitalize segment labels', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<Breadcrumbs />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should replace hyphens with spaces in labels', () => {
    vi.mocked(usePathname).mockReturnValue('/user-settings');
    render(<Breadcrumbs />);
    
    expect(screen.getByText('User settings')).toBeInTheDocument();
  });

  it('should have last segment as non-link text', () => {
    vi.mocked(usePathname).mockReturnValue('/settings/account');
    render(<Breadcrumbs />);
    
    const accountText = screen.getByText('Account');
    expect(accountText.tagName).not.toBe('A');
    expect(accountText.className).toContain('font-medium');
  });

  it('should render chevron separators between segments', () => {
    vi.mocked(usePathname).mockReturnValue('/settings/profile');
    render(<Breadcrumbs />);
    
    // Should have SVG icons for chevrons
    const nav = screen.getByRole('navigation');
    const svgs = nav.querySelectorAll('svg');
    // Home icon + 2 chevrons
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('should have correct href for intermediate links', () => {
    vi.mocked(usePathname).mockReturnValue('/a/b/c');
    render(<Breadcrumbs />);
    
    const aLink = screen.getByRole('link', { name: 'A' });
    expect(aLink).toHaveAttribute('href', '/a');
    
    const bLink = screen.getByRole('link', { name: 'B' });
    expect(bLink).toHaveAttribute('href', '/a/b');
  });
});

