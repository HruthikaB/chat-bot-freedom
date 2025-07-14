import { useState, useEffect, useRef } from 'react';
import { Search, MessagesSquare, Heart, ShoppingCart, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchProducts, fetchProductSuggestions, fetchDetailedProductSuggestions, advancedSearchProducts } from "@/lib/api";
import { Product } from '@/lib/types';

type HeaderProps = {
  toggleChat: () => void;
  toggleProductsFilter?: () => void;
  onClearResults: () => void;
  onSearchResults: (products: Product[]) => void;
};

const Header = ({ 
  toggleChat, 
  toggleProductsFilter, 
  onClearResults,
  onSearchResults 
}: HeaderProps) => {
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [detailedSuggestions, setDetailedSuggestions] = useState<Product[]>([]);
  const debounceTimeout = useRef<any>(null);
  const justSelectedSuggestion = useRef(false);

  // Perform search function
  const performSearch = async (text: string) => {
    if (!text.trim()) {
      onClearResults();
      return;
    }
    
    try {
      setIsSearching(true);
      
      // Check if the search contains logical operators
      const hasLogicalOperators = /(AND|OR|IN|NOT|\(|\))/i.test(text);
      
      let results: Product[];
      if (hasLogicalOperators) {
        // Use advanced search for logical queries
        results = await advancedSearchProducts(text);
      } else {
        // Use regular search for simple text
        results = await searchProducts(text);
      }

      if (results && Array.isArray(results) && results.length > 0) {
        onSearchResults(results);
      } else {
        onClearResults();
      }
    } catch (error) {
      console.error('Search error:', error);
      onClearResults();
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    // No search on change
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

  // Handle clearing the search
  const handleClearSearch = () => {
    setSearchText('');
    setSuggestions([]);
    setDetailedSuggestions([]);
    setShowSuggestions(false);
    onClearResults();
    inputRef.current?.focus();
  };


  
  // Fetch suggestions as user types
  useEffect(() => {
    if (justSelectedSuggestion.current) {
      justSelectedSuggestion.current = false;
      return; // Skip showing suggestions after a click
    }
    if (searchText.trim()) {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(async () => {
        // Check if the search contains logical operators
        const hasLogicalOperators = /(AND|OR|IN|NOT|\(|\))/i.test(searchText);
        
        if (hasLogicalOperators) {
          // Use detailed suggestions for logical queries
          const detailedSuggs = await fetchDetailedProductSuggestions(searchText);
          setDetailedSuggestions(detailedSuggs);
          setSuggestions([]);
          setShowSuggestions(true);
        } else {
          // Use simple suggestions for text queries
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

          {searchText && (
            <button 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 -mt-0.5" 
              onClick={handleClearSearch}
            >
              <X className="h-5 w-5" />
            </button>
          )}
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
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
          <Heart className="h-7.5 w-7.5 text-shop-purple" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
          <ShoppingCart className="h-7.5 w-7.5 text-shop-purple" />
        </Button>
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