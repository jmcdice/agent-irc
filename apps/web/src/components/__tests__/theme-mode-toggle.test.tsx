import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';

// Mock next-themes
const mockSetTheme = vi.fn();
let mockResolvedTheme = 'light';

vi.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    resolvedTheme: mockResolvedTheme,
  }),
}));

describe('ThemeModeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    mockResolvedTheme = 'light';
  });

  it('should render the toggle button', () => {
    render(<ThemeModeToggle />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should have accessible label', () => {
    render(<ThemeModeToggle />);

    expect(screen.getByText('Toggle theme')).toBeInTheDocument();
  });

  it('should toggle from light to dark', () => {
    mockResolvedTheme = 'light';
    render(<ThemeModeToggle />);

    fireEvent.click(screen.getByRole('button'));

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should toggle from dark to light', () => {
    mockResolvedTheme = 'dark';
    render(<ThemeModeToggle />);

    fireEvent.click(screen.getByRole('button'));

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should render sun and moon icons', () => {
    render(<ThemeModeToggle />);

    const button = screen.getByRole('button');
    // Both icons should be present (one visible, one hidden via CSS)
    expect(button.querySelectorAll('svg').length).toBe(2);
  });
});

