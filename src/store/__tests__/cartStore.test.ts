import { act } from '@testing-library/react';
import type { Product, CartItem } from '@/lib/types';
import { useCartStore, getCartTotal, getCartItemCount } from '../cartStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    code: 'P001',
    name: 'Pikachu',
    series: 'Base Set',
    type: 'Electric',
    displayType: 'Holo',
    group: 'pokemon',
    price: 10000,
    buyPrice: 5000,
    stock: 10,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('cartStore', () => {
  // Reset the store before each test so state doesn't leak between tests.
  beforeEach(() => {
    act(() => {
      useCartStore.setState({ items: [], savedAt: Date.now() });
    });
  });

  // -----------------------------------------------------------------------
  // addItem
  // -----------------------------------------------------------------------
  describe('addItem', () => {
    it('adds a product to an empty cart', () => {
      const product = createProduct();

      act(() => {
        useCartStore.getState().addItem(product, 2);
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].product.id).toBe('prod-1');
      expect(items[0].quantity).toBe(2);
    });

    it('increments quantity for an existing product in the cart', () => {
      const product = createProduct();

      act(() => {
        useCartStore.getState().addItem(product, 1);
      });
      act(() => {
        useCartStore.getState().addItem(product, 3);
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(4); // 1 + 3
    });

    it('respects stock limit when adding an existing product', () => {
      const product = createProduct({ stock: 3 });

      act(() => {
        useCartStore.getState().addItem(product, 2);
      });
      act(() => {
        useCartStore.getState().addItem(product, 5);
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(3); // capped at stock
    });

    it('respects stock limit when adding a new product', () => {
      const product = createProduct({ stock: 2 });

      act(() => {
        useCartStore.getState().addItem(product, 10);
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2); // capped at stock
    });

    it('does not add a product if quantity resolves to zero', () => {
      const product = createProduct({ stock: 0 });

      act(() => {
        useCartStore.getState().addItem(product, 1);
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });

    it('does not add a product when requested quantity is zero', () => {
      const product = createProduct();

      act(() => {
        useCartStore.getState().addItem(product, 0);
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // removeItem
  // -----------------------------------------------------------------------
  describe('removeItem', () => {
    it('removes a product from the cart', () => {
      const product1 = createProduct({ id: 'prod-1' });
      const product2 = createProduct({ id: 'prod-2', name: 'Charizard' });

      act(() => {
        useCartStore.getState().addItem(product1, 1);
        useCartStore.getState().addItem(product2, 2);
      });

      act(() => {
        useCartStore.getState().removeItem('prod-1');
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].product.id).toBe('prod-2');
    });

    it('does nothing when removing a product not in the cart', () => {
      const product = createProduct();

      act(() => {
        useCartStore.getState().addItem(product, 1);
      });

      act(() => {
        useCartStore.getState().removeItem('non-existent');
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // updateQuantity
  // -----------------------------------------------------------------------
  describe('updateQuantity', () => {
    it('updates quantity correctly', () => {
      const product = createProduct();

      act(() => {
        useCartStore.getState().addItem(product, 1);
      });

      act(() => {
        useCartStore.getState().updateQuantity('prod-1', 5);
      });

      const { items } = useCartStore.getState();
      expect(items[0].quantity).toBe(5);
    });

    it('removes item when quantity is updated to zero', () => {
      const product = createProduct();

      act(() => {
        useCartStore.getState().addItem(product, 2);
      });

      act(() => {
        useCartStore.getState().updateQuantity('prod-1', 0);
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });

    it('removes item when quantity is updated to a negative value', () => {
      const product = createProduct();

      act(() => {
        useCartStore.getState().addItem(product, 2);
      });

      act(() => {
        useCartStore.getState().updateQuantity('prod-1', -1);
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });

    it('respects stock limit when updating quantity', () => {
      const product = createProduct({ stock: 4 });

      act(() => {
        useCartStore.getState().addItem(product, 1);
      });

      act(() => {
        useCartStore.getState().updateQuantity('prod-1', 100);
      });

      const { items } = useCartStore.getState();
      expect(items[0].quantity).toBe(4); // capped at stock
    });
  });

  // -----------------------------------------------------------------------
  // clearCart
  // -----------------------------------------------------------------------
  describe('clearCart', () => {
    it('empties the cart', () => {
      const product1 = createProduct({ id: 'prod-1' });
      const product2 = createProduct({ id: 'prod-2' });

      act(() => {
        useCartStore.getState().addItem(product1, 2);
        useCartStore.getState().addItem(product2, 3);
      });

      act(() => {
        useCartStore.getState().clearCart();
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // getCartTotal (standalone helper)
  // -----------------------------------------------------------------------
  describe('getCartTotal', () => {
    it('calculates correct total for a single item', () => {
      const items: CartItem[] = [
        { product: createProduct({ price: 10000 }), quantity: 3 },
      ];
      expect(getCartTotal(items)).toBe(30000);
    });

    it('calculates correct total for multiple items', () => {
      const items: CartItem[] = [
        { product: createProduct({ id: 'a', price: 5000 }), quantity: 2 },
        { product: createProduct({ id: 'b', price: 15000 }), quantity: 1 },
      ];
      expect(getCartTotal(items)).toBe(25000); // 5000*2 + 15000*1
    });

    it('skips items with null price', () => {
      const items: CartItem[] = [
        { product: createProduct({ price: 10000 }), quantity: 2 },
        { product: createProduct({ id: 'b', price: null }), quantity: 5 },
      ];
      expect(getCartTotal(items)).toBe(20000);
    });

    it('returns 0 for empty cart', () => {
      expect(getCartTotal([])).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // getCartItemCount (standalone helper)
  // -----------------------------------------------------------------------
  describe('getCartItemCount', () => {
    it('returns correct count of total items', () => {
      const items: CartItem[] = [
        { product: createProduct({ id: 'a' }), quantity: 2 },
        { product: createProduct({ id: 'b' }), quantity: 3 },
      ];
      expect(getCartItemCount(items)).toBe(5);
    });

    it('returns 0 for empty cart', () => {
      expect(getCartItemCount([])).toBe(0);
    });
  });
});
