import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Product } from '@/lib/types';
import { fetchProductById } from '@/lib/api';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  
  const { addToCart, removeFromCart, updateQuantity, getItemQuantity } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const quantityInCart = product ? getItemQuantity(product.product_id) : 0;
  const inWishlist = product ? isInWishlist(product.product_id) : false;

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const productData = await fetchProductById(parseInt(id));
        setProduct(productData);
        setError(null);
      } catch (err) {
        setError('Failed to load product details. Please try again later.');
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const formatPrice = (price: string | number): string => {
    if (typeof price === 'string') {
      const numPrice = parseFloat(price);
      return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
    }
    return price.toFixed(2);
  };

  const getImageUrl = (index: number) => {
    if (product?.images && product.images.length > index && product.images[index].image_path) {
      return product.images[index].image_path;
    }
    return '/placeholder.svg';
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
    }
  };

  const handleQuantityChange = (action: 'increase' | 'decrease') => {
    if (!product) return;

    if (action === 'increase') {
      addToCart(product);
    } else {
      if (quantityInCart === 1) {
        removeFromCart(product.product_id);
      } else {
        updateQuantity(product.product_id, quantityInCart - 1);
      }
    }
  };

  const handleWishlistToggle = () => {
    if (!product) return;

    if (inWishlist) {
      removeFromWishlist(product.product_id);
    } else {
      addToWishlist(product);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          toggleChat={() => {}} 
          onSearchResults={() => {}}
          onClearResults={() => {}}
        />
        <div className="pt-24">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shop-purple"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
              <p className="text-gray-500 mb-6">{error || 'The product you are looking for does not exist.'}</p>
              <Link to="/">
                <Button className="bg-shop-purple hover:bg-shop-purple/90 text-white">
                  Continue Shopping
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="w-full h-[28rem] bg-white rounded-lg border border-gray-200 overflow-hidden">
                <img 
                  src={getImageUrl(selectedImage)} 
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md border-2 overflow-hidden ${
                        selectedImage === index ? 'border-shop-purple' : 'border-gray-200'
                      }`}
                    >
                      <img 
                        src={image.image_path || '/placeholder.svg'} 
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-lg text-gray-600 mb-4">{product.c_manufacturer}</p>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 stroke-gray-400" />
                    ))}
                  </div>
                  <span className="text-gray-500">(0 reviews)</span>
                </div>

                {/* Price */}
                <div className="text-3xl font-bold text-gray-900 mb-6">
                  US${formatPrice(product.price)}
                </div>

                {/* Availability */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">In Stock</span>
                </div>
              </div>

              {/* Cart Management Section */}
              <div className="space-y-4">
                {quantityInCart > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleQuantityChange('decrease')}
                          className="h-10 w-10 text-gray-500 hover:text-red-600"
                        >
                          {quantityInCart === 1 ? (
                            <Trash2 className="h-4 w-4" />
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                        </Button>
                        <span className="px-4 py-2 text-center min-w-[60px] font-medium">
                          {quantityInCart}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleQuantityChange('increase')}
                          className="h-10 w-10 text-gray-500 hover:text-green-600"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={`h-12 w-12 ${inWishlist ? 'text-red-500' : ''}`}
                        onClick={handleWishlistToggle}
                      >
                        <Heart className={`h-5 w-5 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Button 
                      className="flex items-center bg-shop-purple hover:bg-shop-purple/90 text-white py-3"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Add to Cart
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className={`h-12 w-12 ${inWishlist ? 'text-red-500' : ''}`}
                      onClick={handleWishlistToggle}
                    >
                      <Heart className={`h-5 w-5 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>
                )}
              </div>

              {/* Product Description */}
              {product.description && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Additional Details */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="text-gray-600 ml-2">{product.c_category || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="text-gray-600 ml-2">{product.c_type || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Manufacturer:</span>
                    <span className="text-gray-600 ml-2">{product.c_manufacturer || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">SKU:</span>
                    <span className="text-gray-600 ml-2">{product.sku_name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails; 