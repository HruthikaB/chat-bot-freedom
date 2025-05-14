import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Filters from "@/components/Filters";
import RelatedShops from "@/components/RelatedShops";
import Results from "@/components/Results";
import ChatBot from "@/components/ChatBot";
import ProductsFilter from "@/components/ProductsFilter";

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [isProductsFilterOpen, setIsProductsFilterOpen] = useState(false);
  const [isProductsFilterMaximized, setIsProductsFilterMaximized] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const toggleChat = () => {
    setIsChatOpen(prevState => !prevState);
    if (isProductsFilterOpen) setIsProductsFilterOpen(false);
  };

  const toggleProductsFilter = () => {
    setIsProductsFilterOpen(prevState => !prevState);
    if (isChatOpen) setIsChatOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isChatOpen) {
      document.body.classList.remove('chat-open');
      document.body.classList.remove('chatbot-maximized');
    }
  }, [isChatOpen]);

  const handleMaximizeChange = (isMaximized: boolean) => {
    setIsChatMaximized(isMaximized);    
    if (isMaximized) {
      document.body.classList.add('chatbot-maximized');
    } else {
      document.body.classList.remove('chatbot-maximized');
    }
  };

  const handleProductsFilterMaximizeChange = (isMaximized: boolean) => {
    setIsProductsFilterMaximized(isMaximized);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header toggleChat={toggleChat} toggleProductsFilter={toggleProductsFilter} />
      <div className="filters-container pt-24 px-6">
        <Filters />
      </div>
      <div className="max-w-[1800px] mx-auto px-6">
        <RelatedShops isChatMaximized={isChatMaximized || isProductsFilterMaximized} />
        <Results isChatMaximized={isChatMaximized || isProductsFilterMaximized} />
      </div>
      
      <ChatBot 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        onMaximizeChange={handleMaximizeChange}
      />

      <ProductsFilter
        isOpen={isProductsFilterOpen}
        onClose={() => setIsProductsFilterOpen(false)}
        onMaximizeChange={handleProductsFilterMaximizeChange}
      />
    </div>
  );
};

export default Index;