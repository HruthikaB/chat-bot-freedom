export interface MessageType {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  products?: Product[];
}

export interface ProductImage {
  image_path: string;
}

export interface Product {
  product_id: number;
  name: string;
  description?: string;
  price: number | string;
  category?: string;
  c_manufacturer?: string;
  if_featured?: boolean;
  images?: Array<{
    image_id: number;
    image_path: string;
  }>;
  rating?: number;
  created_at?: string;
  manufacturer: string;
  product_type: string;
  c_category?: string;
  c_type?: string;
  if_sellable?: boolean;
  show_in_store?: number;
  status?: number;
  sku_name?: string;
  w_description?: string;
  w_oem?: string;
  sales?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface ChatResponse {
  user_message: string;
  extracted_filters: Record<string, any>;
  products: Product[];
  total_count: number;
  ai_response: string;
}

export interface ProductFilterParams {
  category?: string;
  manufacturer?: string;
  type?: string;
  min_price?: number;
  max_price?: number;
}

export interface ShopCardProps {
  name: string;
  image: string;
  products: number;
}

export interface Manufacturer {
  id: string;
  name: string;
  products: number;
  image: string;
}