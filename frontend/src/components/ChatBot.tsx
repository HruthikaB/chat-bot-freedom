import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Maximize, Minimize, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { sendChatMessage, formatProduct } from "@/lib/api";
import { MessageType, Product } from '@/lib/types';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  onMaximizeChange: (isMaximized: boolean) => void;
  onProductsUpdate: (products: Product[]) => void;
}

type ProductMessageProps = {
  products: Product[];
  initialLimit?: number;
}

const ProductMessage = ({ products, initialLimit = 5 }: ProductMessageProps) => {
  const [showAll, setShowAll] = useState(false);
  const displayedProducts = showAll ? products : products.slice(0, initialLimit);
  const hasMore = products.length > initialLimit;

  return (
    <div className="flex flex-col gap-3">
      {displayedProducts.map((product, index) => (
        <div key={index} className="text-sm whitespace-pre-line">
          {formatProduct(product, index)}
        </div>
      ))}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-shop-purple hover:text-shop-purple/80"
        >
          {showAll ? (
            <>
              Show Less <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Show More ({products.length - initialLimit} more items) <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
};

const Message = ({ message }: { message: MessageType }) => {
  const handleThumbsUp = () => {
    console.log('Feedback: Thumbs up for message', message.id);
  };

  const handleThumbsDown = () => {
    console.log('Feedback: Thumbs down for message', message.id);
  };

  return (
    <div className={`flex mb-4 ${message.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
      {message.sender === 'bot' && (
        <div className="h-8 w-8 rounded-full bg-shop-purple text-white flex-shrink-0 flex items-center justify-center mr-2 self-start">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div className="flex flex-col max-w-xs">
        <div className={`p-3 rounded-lg ${
          message.sender === 'bot' 
            ? 'bg-gray-100 text-black' 
            : 'bg-shop-purple text-white'
        }`}>
          {message.products ? (
            <ProductMessage products={message.products} />
          ) : (
            <p className="text-sm whitespace-pre-line">{message.text}</p>
          )}
        </div>
        
        {message.sender === 'bot' && (
          <div className="flex mt-1 gap-2">
            <button 
              onClick={handleThumbsUp}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ThumbsUp className="h-4 w-4 text-gray-500" />
            </button>
            <button 
              onClick={handleThumbsDown}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ThumbsDown className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatBot: React.FC<ChatBotProps> = ({ 
  isOpen, 
  onClose, 
  onMaximizeChange,
  onProductsUpdate 
}) => {
  const [visible, setVisible] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: 1,
      text: 'Hi there! I can help you find products. What type of product are you looking for today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setTimeout(scrollToBottom, 100); // Ensure scroll after render
    } else {
      setVisible(false);
      setIsMaximized(false);
      onMaximizeChange(false);
    }
  }, [isOpen, onMaximizeChange]);

  useEffect(() => {
    onMaximizeChange(isMaximized);
  }, [isMaximized, onMaximizeChange]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: MessageType = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userQuery = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(userQuery);
      
      const botMessage: MessageType = {
        id: messages.length + 2,
        text: response.ai_response,
        sender: 'bot',
        timestamp: new Date(),
        products: response.products
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Update products in parent component
      if (response.products && response.products.length > 0) {
        onProductsUpdate(response.products);
      }
    } catch (error) {
      console.error('Error sending message to backend:', error);
      
      const errorMessage: MessageType = {
        id: messages.length + 2,
        text: 'Sorry, I encountered an error processing your request. Please try again later.',
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMaximize = () => {
    setIsMaximized(prev => !prev);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  if (!visible) {
    return null;
  }

  const suggestions = ['Printer', 'Display', 'Circuit Board', 'Cash Drawer'];

  return (
    <div 
      className={`fixed bg-white rounded-lg shadow-lg overflow-hidden border z-50 transition-all duration-300 ease-in-out ${
        isMaximized 
          ? 'right-0 top-[72px] bottom-0 w-[380px] border-l-2 border-shop-purple/20 rounded-none' 
          : 'right-6 bottom-6 w-80'
      }`}
    >
      <div className="p-4 bg-shop-darkPurple border-b flex justify-between items-center">
        <h3 className="font-medium text-shop-purple">Shop AI</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleMaximize} className="h-6 w-6 hover:bg-white/10">
            {isMaximized ? <Minimize className="h-4 w-4 text-shop-purple" /> : <Maximize className="h-4 w-4 text-shop-purple" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 hover:bg-white/10">
            <X className="h-4 w-4 text-shop-purple" />
          </Button>
        </div>
      </div>
      
      <div className={`p-4 overflow-y-auto flex flex-col ${isMaximized ? 'h-[calc(100vh-12.5rem-72px)]' : 'max-h-96'}`}>
        {messages.map(message => (
          <Message key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="h-8 w-8 rounded-full bg-shop-purple text-white flex items-center justify-center mr-2">
              <Bot className="h-4 w-4" />
            </div>
            <div className="p-3 rounded-lg bg-gray-100">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className={`${isMaximized ? 'p-3 pb-2' : 'p-4'} border-t bg-white`}>
        <div className={`flex gap-2 ${isMaximized ? 'mb-2' : 'mb-3'}`}>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <div className="relative flex items-center">
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="w-full px-4 py-2 pr-10 bg-gray-100 rounded-full focus:outline-none text-sm min-h-[42px] border border-gray-200"
            disabled={isLoading}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSendMessage} 
            className="absolute right-1 h-7 w-7"
            disabled={isLoading || !inputValue.trim()}
          >
            <Send className="h-4 w-4 text-shop-purple" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;