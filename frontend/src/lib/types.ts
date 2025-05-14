export type Product = {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  discount?: string;
};

export type ShopCardProps = {
  name: string;
  image: string;
  products: number;
};

export type MessageType = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

export interface ChatRequest {
    message: string;
  }
  
export interface ChatResponse {
    filters: {
      category?: string;
      brand?: string;
      size?: string;
      color?: string;
      max_price?: number;
    };
    results: any[];
  }

export type ProductFilterParams = {
  category?: string;
  type?: string;
  size?: string;
  min_price?: number;
  max_price?: number;
};