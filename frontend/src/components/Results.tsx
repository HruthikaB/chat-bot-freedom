import React, { useEffect, useState } from 'react';
import { Heart, Search, ChevronLeft, ChevronRight, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Product } from '@/lib/types';
import { fetchProducts, fetchBestSellers, fetchRecentlyPurchased } from '@/lib/api';
import { FilterState } from './FilterModal';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useNavigate } from 'react-router-dom';

interface ResultsProps {
  isChatMaximized?: boolean;
  displayProducts?: Product[];
  filterSource?: 'chat' | 'filter' | 'search' | 'image';
  activeFilters?: FilterState;
  imageSearchResults?: Array<{
    product: Product;
    similarity_score: number;
    match_type: string;
  }>;
  isImageSearchLoading?: boolean;
}

const PRODUCTS_PER_PAGE = 15;

const ProductCard = ({ product, isBestSeller, isRecentlyPurchased, similarityScore }: { 
  product: Product; 
  isBestSeller: boolean;
  isRecentlyPurchased: boolean;
  similarityScore?: number;
}) => {
  const { addToCart, getItemQuantity } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const quantityInCart = getItemQuantity(product.product_id);
  const inWishlist = isInWishlist(product.product_id);
  const getImageUrl = () => {
    if (product.images && product.images.length > 0 && product.images[0].image_path) {
      return product.images[0].image_path;
    }
    return '/placeholder.svg';
  };

  const formatPrice = (price: string | number): string => {
    if (typeof price === 'string') {
      const numPrice = parseFloat(price);
      return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
    }
    return price.toFixed(2);
  };

  return (
    <div className="relative bg-white rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => navigate(`/product/${product.product_id}`)}>
      {product.if_featured && (
        <div className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded z-10">
          Featured
        </div>
      )}
      {isRecentlyPurchased && (
        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded z-10">
          Recently Purchased
        </div>
      )}
      {isBestSeller && (
        <div className={`absolute ${isRecentlyPurchased ? 'top-10' : 'top-2'} left-2 bg-shop-purple text-white text-xs px-2 py-1 rounded z-10`}>
          Best Seller
        </div>
      )}

      <div className="relative h-52 bg-gray-100">
        <img 
          src={getImageUrl()} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 right-2 flex flex-col gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7 bg-white rounded-full">
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className={`h-7 w-7 bg-white rounded-full ${inWishlist ? 'text-red-500' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (inWishlist) {
                removeFromWishlist(product.product_id);
              } else {
                addToWishlist(product);
              }
            }}
          >
            <Heart className={`h-3.5 w-3.5 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7 bg-white rounded-full hover:bg-shop-purple hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
              <div className="p-3">
          <div className="text-sm mb-1">
            <span className="font-medium">{product.c_manufacturer}</span>
          </div>
          <h3 className="font-medium text-sm mb-1">{product.name}</h3>
          <div className="flex items-center mb-1">
            <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 stroke-gray-400" />
                    ))}
                  </div>
            <span className="text-gray-500 text-xs ml-1">(0)</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">US${formatPrice(product.price)}</span>
            {quantityInCart > 0 && (
              <span className="text-xs bg-shop-purple text-white px-2 py-1 rounded-full">
                {quantityInCart} in cart
              </span>
            )}
          </div>
        </div>
    </div>
  );
};

const Results: React.FC<ResultsProps> = ({ 
  isChatMaximized = false, 
  displayProducts,
  filterSource,
  activeFilters,
  imageSearchResults,
  isImageSearchLoading = false
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [bestSellers, setBestSellers] = useState<Set<number>>(new Set());
  const [recentlyPurchased, setRecentlyPurchased] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (imageSearchResults && imageSearchResults.length > 0) {
          const imageProducts = imageSearchResults.map(item => item.product);
          setProducts(imageProducts);
          setFilteredProducts(imageProducts);
          setBestSellers(new Set());
          setRecentlyPurchased(new Set());
          setError(null);
        } else {
          const [productsData, bestSellersData, recentlyPurchasedData] = await Promise.all([
            displayProducts ? Promise.resolve(displayProducts) : fetchProducts(),
            fetchBestSellers(),
            fetchRecentlyPurchased()
          ]);
          
          setProducts(productsData);
          setFilteredProducts(productsData);
          setBestSellers(new Set(bestSellersData.map(product => product.product_id)));
          setRecentlyPurchased(new Set(recentlyPurchasedData.map(product => product.product_id)));
          setError(null);
        }
      } catch (err) {
        setError('Failed to load products. Please try again later.');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [displayProducts, imageSearchResults]);

  useEffect(() => {
    if (!activeFilters) return;

    let filtered = [...products];

    if (activeFilters.category) {
      filtered = filtered.filter(product => 
        product.c_category?.toLowerCase() === activeFilters.category.toLowerCase()
      );
    }

    if (activeFilters.type) {
      filtered = filtered.filter(product => 
        product.c_type?.toLowerCase() === activeFilters.type.toLowerCase()
      );
    }

    if (activeFilters.manufacturer) {
      filtered = filtered.filter(product => 
        product.c_manufacturer?.toLowerCase() === activeFilters.manufacturer.toLowerCase()
      );
    }

    if (activeFilters.price) {
      filtered = filtered.filter(product => {
        const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        switch (activeFilters.price) {
          case 'under_25':
            return price < 25;
          case '25_50':
            return price >= 25 && price <= 50;
          case '50_100':
            return price >= 50 && price <= 100;
          case 'over_100':
            return price > 100;
          default:
            return true;
        }
      });
    }

    if (activeFilters.sort) {
      filtered.sort((a, b) => {
        const priceA = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
        const priceB = typeof b.price === 'string' ? parseFloat(b.price) : b.price;

        switch (activeFilters.sort) {
          case '':
            return ((b.if_featured ? 1 : 0) - (a.if_featured ? 1 : 0));
          case 'price_asc':
            return priceA - priceB;
          case 'price_desc':
            return priceB - priceA;
          case 'name_asc':
            return (a.name || '').localeCompare(b.name || '');
          case 'name_desc':
            return (b.name || '').localeCompare(a.name || '');
          case 'best_selling':
            return (bestSellers.has(b.product_id) ? 1 : 0) - (bestSellers.has(a.product_id) ? 1 : 0);
          case 'newest':
            return (b.created_at || '').localeCompare(a.created_at || '');
          default:
            return 0;
        }
      });
    } else {
      filtered.sort((a, b) => ((b.if_featured ? 1 : 0) - (a.if_featured ? 1 : 0)));
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [activeFilters, products, bestSellers]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSelect = (value: string) => {
    const pageNumber = parseInt(value, 10);
    handlePageChange(pageNumber);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  const getAllPageNumbers = () => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  };

  if (loading || isImageSearchLoading) {
    return (
      <div className="py-6">
        <h2 className="text-lg font-medium mb-4">
          {isImageSearchLoading ? 'Image Search Results' : 'Results'}
        </h2>
        <div className="flex flex-col justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shop-purple mb-4"></div>
          {isImageSearchLoading && (
            <p className="text-gray-600 text-center">
              Processing your image and finding similar products...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <h2 className="text-lg font-medium mb-4">Results</h2>
        <div className="flex justify-center items-center min-h-[400px] text-red-500">
          {error}
        </div>
      </div>
    );
  }

  // Handle empty search results
  if (filterSource && filteredProducts.length === 0) {
    return (
      <div className={`py-6 transition-all duration-300 ${isChatMaximized ? 'mr-[380px]' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">
            {filterSource === 'chat' 
              ? 'Chat Results' 
              : filterSource === 'filter' 
              ? 'Filtered Products' 
              : filterSource === 'image'
              ? 'Image Search Results'
              : filterSource === 'search'
              ? 'Search Results'
              : 'Results'}
          </h2>
        </div>
        <div className="flex flex-col justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">
              {filterSource === 'image' 
                ? "We couldn't find any products similar to your image. Try uploading a different image or use text search instead."
                : filterSource === 'search'
                ? "No products match your search criteria. Try different keywords or browse our categories."
                : filterSource === 'filter'
                ? "No products match your filter criteria. Try adjusting your filters or browse all products."
                : filterSource === 'chat'
                ? "No products found based on your request. Try rephrasing your question or browse our products."
                : "No products available. Please try again later."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-6 transition-all duration-300 ${isChatMaximized ? 'mr-[380px]' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">
          {filterSource === 'chat' 
            ? 'Chat Results' 
            : filterSource === 'filter' 
            ? 'Filtered Products' 
            : filterSource === 'image'
            ? 'Image Search Results'
            : 'All Products'}
        </h2>
        <p className="text-sm text-gray-500">
          Showing {startIndex + 1} - {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
        </p>
      </div>
      <div className={`product-grid grid gap-6 pb-6 ${
        isChatMaximized 
          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4' 
          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      }`}>
        {currentProducts.map((product) => {
          const imageResult = imageSearchResults?.find(item => item.product.product_id === product.product_id);
          const similarityScore = imageResult?.similarity_score;
          
          return (
            <ProductCard 
              key={product.product_id} 
              product={product} 
              isBestSeller={bestSellers.has(product.product_id)}
              isRecentlyPurchased={recentlyPurchased.has(product.product_id)}
              similarityScore={similarityScore}
            />
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getPageNumbers().map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={pageNumber === currentPage ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 ${pageNumber === currentPage ? 'bg-shop-purple text-white' : ''}`}
                onClick={() => handlePageChange(pageNumber)}
              >
                {pageNumber}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={currentPage.toString()}
              onValueChange={handlePageSelect}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder="Page" />
              </SelectTrigger>
              <SelectContent className="max-h-[170px]">
                <div className="overflow-y-auto max-h-[170px]">
                  {getAllPageNumbers().map((pageNum) => (
                    <SelectItem 
                      key={pageNum} 
                      value={pageNum.toString()}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      {pageNum}
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;