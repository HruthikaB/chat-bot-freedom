import React, { useState } from 'react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Trash2, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';

const Wishlist: React.FC = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart, getItemQuantity } = useCart();
  const navigate = useNavigate();
  const [addedToCartItems, setAddedToCartItems] = useState<Set<number>>(new Set());

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

  const handleAddToCart = (product: any) => {
    addToCart(product);
    setAddedToCartItems(prev => new Set(prev).add(product.product_id));
  };

  const handleViewCart = () => {
    navigate('/cart');
  };

  const handleRemoveFromWishlist = (productId: number, productName: string) => {
    removeFromWishlist(productId);
    setAddedToCartItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  };

  const isItemInCart = (productId: number) => {
    return getItemQuantity(productId) > 0 || addedToCartItems.has(productId);
  };

  if (wishlist.items.length === 0) {
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
              <Heart className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
              <p className="text-gray-500 mb-6">Start adding items to your wishlist to see them here.</p>
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
      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-900">My Wishlist ({wishlist.items.length} items)</h1>
            </div>
            
            <div className="divide-y divide-gray-200">
              {wishlist.items.map((item) => (
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
                          
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg font-semibold text-gray-900">
                              US${formatPrice(item.product.price)}
                            </span>
                          </div>
                          
                          <div className="flex gap-3">
                            {isItemInCart(item.product.product_id) ? (
                              <Button 
                              variant='outline'
                                onClick={handleViewCart}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Cart
                              </Button>
                            ) : (
                              <Button 
                                className="bg-shop-purple hover:bg-shop-purple/90 text-white"
                                onClick={() => handleAddToCart(item.product)}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add to Cart
                              </Button>
                            )}
                            <Button 
                              variant="outline"
                              onClick={() => handleRemoveFromWishlist(item.product.product_id, item.product.name)}
                              className="text-gray-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
      </div>
    </div>
  );
};

export default Wishlist; 