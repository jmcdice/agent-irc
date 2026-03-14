import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../theme-toggle';

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: mockSetTheme,
  })),
}));

// Import after mock
import { useTheme } from 'next-themes';

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      themes: ['light', 'dark', 'system'],
      forcedTheme: undefined,
      resolvedTheme: 'light',
      systemTheme: 'light',
    });
  });

  it('should render a button', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should have accessible label for screen readers', () => {
    render(<ThemeToggle />);
    expect(screen.getByText('Toggle theme')).toBeInTheDocument();
  });

  it('should toggle from light to dark when clicked', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      themes: ['light', 'dark', 'system'],
      forcedTheme: undefined,
      resolvedTheme: 'light',
      systemTheme: 'light',
    });

    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should toggle from dark to light when clicked', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      themes: ['light', 'dark', 'system'],
      forcedTheme: undefined,
      resolvedTheme: 'dark',
      systemTheme: 'light',
    });

    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should render Sun and Moon icons', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    // Icons should be present inside the button
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('should use ghost variant button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('hover:bg-accent');
  });

  it('should use icon size button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('w-9');
  });
});

