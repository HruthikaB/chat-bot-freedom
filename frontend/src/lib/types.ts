export interface MessageType {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  products?: Product[];
}

export interface ProductImage {
  image_id: number;
  image_name: string;
  image_path: string;
  image_sort: number;
  product_id: number;
}

export interface Product {
  product_id: number;
  name: string;
  description?: string;
  meta_description?: string;
  meta_keyword?: string;
  tag?: string;
  product_type?: string;
  price: string | number;
  c_type?: string;
  c_category?: string;
  c_manufacturer?: string;
  c_product_group?: string;
  if_featured?: boolean;
  if_sellable?: boolean;
  show_in_store?: number;
  status?: number;
  sku_name?: string;
  w_description?: string | null;
  w_oem?: string | null;
  w_weight?: string;
  w_height?: string;
  w_width?: string;
  w_depth?: string;
  images?: ProductImage[];
  rating?: number;
  date_added?: string;
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