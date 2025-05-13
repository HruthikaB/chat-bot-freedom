import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Filters from "@/components/Filters";
import RelatedShops from "@/components/RelatedShops";
import Results from "@/components/Results";
import ChatBot from "@/components/ChatBot";

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const toggleChat = () => {
    setIsChatOpen(prevState => !prevState);
    console.log("Chat toggle clicked, new state:", !isChatOpen);
  };

  // Track window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debug log to track state changes
  useEffect(() => {
    console.log("Chat state updated:", isChatOpen);

    // Remove class when chat is closed
    if (!isChatOpen) {
      document.body.classList.remove('chat-open');
      document.body.classList.remove('chatbot-maximized');
    }
  }, [isChatOpen]);

  // Listen for maximize state changes from the ChatBot
  const handleMaximizeChange = (isMaximized: boolean) => {
    setIsChatMaximized(isMaximized);
    console.log("Chat maximized state updated:", isMaximized);
    
    if (isMaximized) {
      document.body.classList.add('chatbot-maximized');
    } else {
      document.body.classList.remove('chatbot-maximized');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header toggleChat={toggleChat} />
      <div className="filters-container pt-24 px-6"> {/* Restored original container class and px-6 padding */}
        <Filters />
      </div>
      <div className="max-w-[1800px] mx-auto px-6"> {/* Restored original max-width */}
        <RelatedShops isChatMaximized={isChatMaximized} />
        <Results isChatMaximized={isChatMaximized} />
      </div>
      
      <ChatBot 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        onMaximizeChange={handleMaximizeChange}
      />
    </div>
  );
};

export default Index;