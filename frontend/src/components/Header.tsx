import { useState, useEffect, useRef } from 'react';
import { Search, MessagesSquare, Heart, ShoppingCart, X, Filter, Mic, Focus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchProducts, fetchProductSuggestions, fetchDetailedProductSuggestions, advancedSearchProducts, searchProductsByImage, ImageSearchResponse } from "@/lib/api";
import { Product } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';

type HeaderProps = {
  toggleChat: () => void;
  toggleProductsFilter?: () => void;
  onClearResults: () => void;
  onSearchResults: (products: Product[]) => void;
  onImageSearchResults?: (imageResults: Array<{
    product: Product;
    similarity_score: number;
    match_type: string;
  }>) => void;
  onImageSearchStart?: () => void;
};

const Header = ({ 
  toggleChat, 
  toggleProductsFilter, 
  onClearResults,
  onSearchResults,
  onImageSearchResults,
  onImageSearchStart
}: HeaderProps) => {
  const { cart } = useCart();
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [detailedSuggestions, setDetailedSuggestions] = useState<Product[]>([]);
  const debounceTimeout = useRef<any>(null);
  const justSelectedSuggestion = useRef(false);

  const performSearch = async (text: string) => {
    if (!text.trim()) {
      onClearResults();
      return;
    }
    
    try {
      setIsSearching(true);
      
      const hasLogicalOperators = /(AND|OR|IN|NOT|\(|\))/i.test(text);
      
      let results: Product[];
      if (hasLogicalOperators) {
        results = await advancedSearchProducts(text);
      } else {
        results = await searchProducts(text);
      }

      if (results && Array.isArray(results) && results.length > 0) {
        onSearchResults(results);
      } else {
        onSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      onClearResults();
    } finally {
      setIsSearching(false);
    }
  };

  const performImageSearch = async (imageFile: File) => {
    try {
      const response: ImageSearchResponse = await searchProductsByImage(imageFile);

      if (response.products && response.products.length > 0) {
        if (onImageSearchResults) {
          onImageSearchResults(response.products);
        } else {
          const products = response.products.map(item => item.product);
          onSearchResults(products);
        }
        
        setSearchText('');
      } else {
        if (onImageSearchResults) {
          onImageSearchResults([]);
        } else {
          onSearchResults([]);
        }
        setSearchText('');
      }
    } catch (error) {
      console.error('Image search error:', error);
      onClearResults();
      setSearchText('');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, etc.)');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file size must be less than 10MB');
        return;
      }
      
      if (onImageSearchStart) {
        onImageSearchStart();
      }
      
      performImageSearch(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFocusClick = () => {
    fileInputRef.current?.click();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    if (!value.trim()) {
      onClearResults();
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchText.trim()) {
      await performSearch(searchText);
      setShowSuggestions(false);
    }
  };

  const handleClearSearch = () => {
    setSearchText('');
    setSuggestions([]);
    setDetailedSuggestions([]);
    setShowSuggestions(false);
    onClearResults();
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (justSelectedSuggestion.current) {
      justSelectedSuggestion.current = false;
      return;
    }
    if (searchText.trim()) {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(async () => {
        const hasLogicalOperators = /(AND|OR|IN|NOT|\(|\))/i.test(searchText);
        
        if (hasLogicalOperators) {
          const detailedSuggs = await fetchDetailedProductSuggestions(searchText);
          setDetailedSuggestions(detailedSuggs);
          setSuggestions([]);
          setShowSuggestions(true);
        } else {
          const suggs = await fetchProductSuggestions(searchText);
          setSuggestions(suggs);
          setDetailedSuggestions([]);
          setShowSuggestions(true);
        }
      }, 250);
    } else {
      setSuggestions([]);
      setDetailedSuggestions([]);
      setShowSuggestions(false);
    }
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchText]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(target)) {
        setShowSuggestions(false);
        setSuggestions([]);
        setDetailedSuggestions([]);
        setIsFocused(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const handleSuggestionClick = async (suggestion: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    justSelectedSuggestion.current = true;
    setShowSuggestions(false);
    setSuggestions([]);
    setDetailedSuggestions([]);
    
    setSearchText(suggestion);
    
    await performSearch(suggestion);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-shop-darkPurple border-b fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-8">
        <a href="/" className="text-shop-purple text-2xl font-bold font-sans">shop</a>
        <nav className="flex gap-6">
          <a href="/" className="text-white hover:text-shop-purple">Home</a>
          <a href="/explore" className="text-white hover:text-shop-purple">Explore</a>
        </nav>
      </div>
      
      <div className="relative flex-1 max-w-xl mx-8 search-container">
        <div className="relative">
          {isSearching ? (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
            </div>
          ) : (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          )}
          <Input 
            ref={inputRef}
            type="text" 
            placeholder="Search products..."
            value={searchText}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
            }}
            className="pl-10 pr-10 py-2 w-full rounded-full bg-gray-100 border-none"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-3 pr-2">
            <div className="relative group">
              <Mic
                className="text-gray-400 h-5 w-5 cursor-pointer hover:text-gray-600"
                onClick={() => console.log('Mic clicked')}
              />
            </div>
            <div className="relative group">
              <Focus
                className="h-5 w-5 cursor-pointer transition-colors text-gray-400 hover:text-gray-600"
                onClick={handleFocusClick}
              />
            </div>
            
            {searchText && (
              <div className="relative group">
                <button 
                  className="text-gray-400 h-5 w-5 hover:text-gray-600" 
                  onClick={handleClearSearch}
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Clear search
                </div>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {showSuggestions && (suggestions.length > 0 || detailedSuggestions.length > 0) && (
            <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-56 overflow-y-auto">
              {detailedSuggestions.length > 0 ? (
                detailedSuggestions.map((product, index) => (
                  <li
                    key={index}
                    className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                    onMouseDown={(e) => handleSuggestionClick(product.name, e)}
                  >
                    {product.name}
                  </li>
                ))
              ) : (
                suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                    onMouseDown={(e) => handleSuggestionClick(suggestion, e)}
                  >
                    {suggestion}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-white/10"
          onClick={toggleProductsFilter}
        >
          <Filter className="h-7.5 w-7.5 text-shop-purple" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-white/10"
          onClick={toggleChat}
        >
          <MessagesSquare className="h-7.5 w-7.5 text-shop-purple" />
        </Button>
        <Link to="/wishlist">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 relative">
            <Heart className="h-7.5 w-7.5 text-shop-purple" />
          </Button>
        </Link>
        <Link to="/cart">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 relative">
            <ShoppingCart className="h-7.5 w-7.5 text-shop-purple" />
            {cart.totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.totalItems > 99 ? '99+' : cart.totalItems}
              </span>
            )}
          </Button>
        </Link>
        <Button 
          className="bg-shop-purple hover:bg-shop-purple/90 text-white rounded-full px-6 py-1 h-9"
        >
          Sign in
        </Button>
      </div>
    </header>
  );
};

export default Header;