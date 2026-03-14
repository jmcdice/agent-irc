import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Example Component Test', () => {
  it('should render Hello, World text', () => {
    render(<h1>Hello, World</h1>);

    expect(screen.getByText('Hello, World')).toBeInTheDocument();
  });
});

