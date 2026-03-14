import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../theme-provider';

// Mock matchMedia for next-themes
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

describe('ThemeProvider', () => {
  it('should render children', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system">
        <div>Child content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should pass props to NextThemesProvider', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div>Content</div>
      </ThemeProvider>
    );
    // The component renders successfully with props
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should render multiple children', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system">
        <div>First child</div>
        <div>Second child</div>
      </ThemeProvider>
    );
    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
  });

  it('should render nested elements', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system">
        <div>
          <span>Nested content</span>
        </div>
      </ThemeProvider>
    );
    expect(screen.getByText('Nested content')).toBeInTheDocument();
  });
});

