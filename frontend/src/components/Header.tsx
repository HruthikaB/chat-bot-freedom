import { useState, useEffect, useRef } from 'react';
import { Search, MessagesSquare, Heart, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HeaderProps = {
  toggleChat: () => void;
};

const Header = ({ toggleChat }: HeaderProps) => {
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isFocused && searchText === '') {
      timer = setTimeout(() => {
        setShowSuggestions(true);
      }, 2500);
    } else {
      setShowSuggestions(false);
    }
    return () => clearTimeout(timer);
  }, [isFocused, searchText]);

  const handleClearSearch = () => {
    setSearchText('');
    inputRef.current?.focus();
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
      
      <div className="relative flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input 
            ref={inputRef}
            type="text" 
            placeholder=""
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setTimeout(() => setIsFocused(false), 200);
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
          
          {isFocused && searchText === '' && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
              <div className="px-3 py-2 text-sm text-gray-500 border-b">Popular searches</div>
              <div className="py-1">
                <div className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer">shoes</div>
                <div className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer">t-shirts</div>
                <div className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer">headphones</div>
                <div className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer">watches</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
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