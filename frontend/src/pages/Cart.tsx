import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const formatPrice = (price: string | number): string => {
    if (typeof price === 'string') {
      const numPrice = parseFloat(price);
      return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
    }
    return price.toFixed(2);
  };

  const getImageUrl = (product: any) => {
    if (product.images && product.images.length > 0 && product.images[0].image_path) {
      return product.images[0].image_path;
    }
    return '/placeholder.svg';
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          toggleChat={() => {}} 
          onSearchResults={() => {}}
          onClearResults={() => {}}
        />
        <div className="pt-24">
          <div className="container mx-auto px-4 py-8">            
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <ShoppingBag className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
              <Link to="/">
                <Button className="bg-shop-purple hover:bg-shop-purple/90 text-white">
                  Start Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        toggleChat={() => {}} 
        onSearchResults={() => {}}
        onClearResults={() => {}}
      />
      <div className="pt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h1 className="text-xl font-semibold text-gray-900">Shopping Cart ({cart.totalItems} items)</h1>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {cart.items.map((item) => (
                    <div key={item.product.product_id} className="p-6">
                      <div className="flex gap-6">
                        <div className="flex-shrink-0">
                          <img 
                            src={getImageUrl(item.product)} 
                            alt={item.product.name}
                            className="w-32 h-32 object-cover rounded-md border border-gray-200"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-4">
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {item.product.name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {item.product.c_manufacturer}
                              </p>
                              
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm text-gray-600 font-medium">${formatPrice(item.product.price)}</span>
                              </div>
                              
                              <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center border  rounded-md p-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (item.quantity === 1) {
                                        removeFromCart(item.product.product_id);
                                      } else {
                                        updateQuantity(item.product.product_id, item.quantity - 1);
                                      }
                                    }}
                                    className="h-8 w-8 text-gray-500 hover:text-red-600"
                                  >
                                    {item.quantity === 1 ? (
                                      <Trash2 className="h-4 w-4" />
                                    ) : (
                                      <Minus className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <span className="text-sm font-medium px-3">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => updateQuantity(item.product.product_id, item.quantity + 1)}
                                    className="h-8 w-8 text-gray-500 hover:text-green-600"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({cart.totalItems} items)</span>
                    <span className="font-medium">US${cart.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">Calculated at checkout</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>US${cart.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button className="w-full bg-shop-purple hover:bg-shop-purple/90 text-white">
                  Proceed to Checkout
                </Button>
                
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Secure checkout powered by Stripe
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart; 