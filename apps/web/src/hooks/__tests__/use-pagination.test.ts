import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../use-pagination';

describe('usePagination', () => {
  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      expect(result.current.currentPage).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.totalItems).toBe(100);
      expect(result.current.totalPages).toBe(10);
    });

    it('should accept custom initial values', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 50, initialPage: 3, initialPageSize: 5 })
      );

      expect(result.current.currentPage).toBe(3);
      expect(result.current.pageSize).toBe(5);
      expect(result.current.totalPages).toBe(10);
    });

    it('should handle zero items', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 0 }));

      expect(result.current.totalPages).toBe(1);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPreviousPage).toBe(false);
    });
  });

  describe('navigation', () => {
    it('should go to next page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => result.current.nextPage());
      expect(result.current.currentPage).toBe(2);
    });

    it('should go to previous page', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPage: 5 })
      );

      act(() => result.current.previousPage());
      expect(result.current.currentPage).toBe(4);
    });

    it('should go to first page', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPage: 5 })
      );

      act(() => result.current.firstPage());
      expect(result.current.currentPage).toBe(1);
    });

    it('should go to last page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => result.current.lastPage());
      expect(result.current.currentPage).toBe(10);
    });

    it('should set specific page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => result.current.setPage(7));
      expect(result.current.currentPage).toBe(7);
    });

    it('should clamp page to valid range', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => result.current.setPage(999));
      expect(result.current.currentPage).toBe(10);

      act(() => result.current.setPage(-5));
      expect(result.current.currentPage).toBe(1);
    });

    it('should not go below page 1', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => result.current.previousPage());
      expect(result.current.currentPage).toBe(1);
    });

    it('should not exceed total pages', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPage: 10 })
      );

      act(() => result.current.nextPage());
      expect(result.current.currentPage).toBe(10);
    });
  });

  describe('hasNextPage and hasPreviousPage', () => {
    it('should return correct values on first page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      expect(result.current.hasPreviousPage).toBe(false);
      expect(result.current.hasNextPage).toBe(true);
    });

    it('should return correct values on last page', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPage: 10 })
      );

      expect(result.current.hasPreviousPage).toBe(true);
      expect(result.current.hasNextPage).toBe(false);
    });

    it('should return correct values on middle page', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPage: 5 })
      );

      expect(result.current.hasPreviousPage).toBe(true);
      expect(result.current.hasNextPage).toBe(true);
    });
  });

  describe('indices', () => {
    it('should calculate start and end indices correctly', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 25 }));

      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(9);

      act(() => result.current.setPage(2));
      expect(result.current.startIndex).toBe(10);
      expect(result.current.endIndex).toBe(19);

      act(() => result.current.setPage(3));
      expect(result.current.startIndex).toBe(20);
      expect(result.current.endIndex).toBe(24); // Last page has fewer items
    });
  });

  describe('pageSize', () => {
    it('should reset to page 1 when page size changes', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPage: 5 })
      );

      act(() => result.current.setPageSize(20));
      expect(result.current.currentPage).toBe(1);
      expect(result.current.pageSize).toBe(20);
      expect(result.current.totalPages).toBe(5);
    });
  });
});

