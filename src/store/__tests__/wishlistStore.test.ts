import { act } from '@testing-library/react';
import { useWishlistStore, getWishlistCount } from '../wishlistStore';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('wishlistStore', () => {
  beforeEach(() => {
    act(() => {
      useWishlistStore.setState({ ids: [] });
    });
  });

  // -----------------------------------------------------------------------
  // toggle
  // -----------------------------------------------------------------------
  describe('toggle', () => {
    it('adds an item to the wishlist', () => {
      act(() => {
        useWishlistStore.getState().toggle('prod-1');
      });

      const { ids } = useWishlistStore.getState();
      expect(ids).toContain('prod-1');
      expect(ids).toHaveLength(1);
    });

    it('adds multiple different items to the wishlist', () => {
      act(() => {
        useWishlistStore.getState().toggle('prod-1');
        useWishlistStore.getState().toggle('prod-2');
        useWishlistStore.getState().toggle('prod-3');
      });

      const { ids } = useWishlistStore.getState();
      expect(ids).toEqual(['prod-1', 'prod-2', 'prod-3']);
    });

    it('removes an item from the wishlist when toggled again', () => {
      act(() => {
        useWishlistStore.getState().toggle('prod-1');
        useWishlistStore.getState().toggle('prod-2');
      });

      act(() => {
        useWishlistStore.getState().toggle('prod-1');
      });

      const { ids } = useWishlistStore.getState();
      expect(ids).not.toContain('prod-1');
      expect(ids).toContain('prod-2');
      expect(ids).toHaveLength(1);
    });

    it('removes the correct item from the middle of the wishlist', () => {
      act(() => {
        useWishlistStore.getState().toggle('a');
        useWishlistStore.getState().toggle('b');
        useWishlistStore.getState().toggle('c');
      });

      act(() => {
        useWishlistStore.getState().toggle('b');
      });

      const { ids } = useWishlistStore.getState();
      expect(ids).toEqual(['a', 'c']);
    });
  });

  // -----------------------------------------------------------------------
  // isWished
  // -----------------------------------------------------------------------
  describe('isWished', () => {
    it('returns false for a product not in the wishlist', () => {
      expect(useWishlistStore.getState().isWished('prod-1')).toBe(false);
    });

    it('returns true for a product in the wishlist', () => {
      act(() => {
        useWishlistStore.getState().toggle('prod-1');
      });

      expect(useWishlistStore.getState().isWished('prod-1')).toBe(true);
    });

    it('returns false after a product is removed from the wishlist', () => {
      act(() => {
        useWishlistStore.getState().toggle('prod-1');
      });
      act(() => {
        useWishlistStore.getState().toggle('prod-1');
      });

      expect(useWishlistStore.getState().isWished('prod-1')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // clear
  // -----------------------------------------------------------------------
  describe('clear', () => {
    it('empties the wishlist', () => {
      act(() => {
        useWishlistStore.getState().toggle('a');
        useWishlistStore.getState().toggle('b');
        useWishlistStore.getState().toggle('c');
      });

      expect(useWishlistStore.getState().ids).toHaveLength(3);

      act(() => {
        useWishlistStore.getState().clear();
      });

      expect(useWishlistStore.getState().ids).toHaveLength(0);
      expect(useWishlistStore.getState().ids).toEqual([]);
    });

    it('clear does nothing on an already empty wishlist', () => {
      act(() => {
        useWishlistStore.getState().clear();
      });

      expect(useWishlistStore.getState().ids).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // getWishlistCount (standalone helper)
  // -----------------------------------------------------------------------
  describe('getWishlistCount', () => {
    it('returns the correct count', () => {
      expect(getWishlistCount(['a', 'b', 'c'])).toBe(3);
    });

    it('returns 0 for an empty array', () => {
      expect(getWishlistCount([])).toBe(0);
    });
  });
});
