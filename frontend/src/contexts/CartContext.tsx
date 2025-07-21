import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '@/lib/types';

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: number; quantity: number } }
  | { type: 'LOAD_CART'; payload: CartState };

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.product.product_id === action.payload.product_id);
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.product.product_id === action.payload.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = updatedItems.reduce((sum, item) => {
          const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
          return sum + (price * item.quantity);
        }, 0);
        
        return { items: updatedItems, totalItems, totalPrice };
      } else {
        const newItem: CartItem = { product: action.payload, quantity: 1 };
        const updatedItems = [...state.items, newItem];
        
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = updatedItems.reduce((sum, item) => {
          const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
          return sum + (price * item.quantity);
        }, 0);
        
        return { items: updatedItems, totalItems, totalPrice };
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.product.product_id !== action.payload);
      
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => {
        const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
        return sum + (price * item.quantity);
      }, 0);
      
      return { items: updatedItems, totalItems, totalPrice };
    }
    
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: productId });
      }
      
      const updatedItems = state.items.map(item =>
        item.product.product_id === productId
          ? { ...item, quantity }
          : item
      );
      
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => {
        const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
        return sum + (price * item.quantity);
      }, 0);
      
      return { items: updatedItems, totalItems, totalPrice };
    }
      
    case 'LOAD_CART':
      return action.payload;
      
    default:
      return state;
  }
};

interface CartContextType {
  cart: CartState;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  getItemQuantity: (productId: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart.items) {
          parsedCart.items.forEach((item: CartItem) => {
            dispatch({ type: 'ADD_ITEM', payload: item.product });
            if (item.quantity > 1) {
              for (let i = 1; i < item.quantity; i++) {
                dispatch({ type: 'ADD_ITEM', payload: item.product });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const removeFromCart = (productId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const getItemQuantity = (productId: number): number => {
    const item = cart.items.find(item => item.product.product_id === productId);
    return item ? item.quantity : 0;
  };

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    getItemQuantity,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 