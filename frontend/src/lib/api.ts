import { ChatResponse, ProductFilterParams, Product } from "./types";
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ProductsResponse {
  products: Product[];
  total_results: number;
  message: string;
}

export interface ImageSearchResponse {
  image_hash: string;
  search_type: string;
  threshold: number;
  products: Array<{
    product: Product;
    similarity_score: number;
    match_type: string;
  }>;
  total_results: number;
  message: string;
}

let globalCache: {
  bestSellers: Product[];
  recentlyPurchased: Product[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 10 * 60 * 1000;

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const response = await axios.get<ProductsResponse>(`${API_URL}/products/`);
    return response.data.products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const fetchBestSellers = async (): Promise<Product[]> => {
  const now = Date.now();
  
  if (globalCache && (now - globalCache.timestamp) < CACHE_DURATION) {
    return globalCache.bestSellers;
  }
  
  try {
    const response = await axios.get<Product[]>(`${API_URL}/products/best-sellers`);
    const bestSellers = response.data;
    
    if (!globalCache) {
      globalCache = {
        bestSellers: [],
        recentlyPurchased: [],
        timestamp: now
      };
    }
    globalCache.bestSellers = bestSellers;
    globalCache.timestamp = now;
    
    return bestSellers;
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    return [];
  }
};

let filterDataCache: {
  products: Product[];
  categories: string[];
  types: string[];
  manufacturers: string[];
  timestamp: number;
} | null = null;

const FILTER_CACHE_DURATION = 5 * 60 * 1000;

const getFilterData = async (): Promise<Product[]> => {
  const now = Date.now();
  
  if (filterDataCache && (now - filterDataCache.timestamp) < FILTER_CACHE_DURATION) {
    return filterDataCache.products;
  }
  
  try {
    const response = await axios.get<ProductsResponse>(`${API_URL}/products/`);
    const products = response.data.products;
    
    filterDataCache = {
      products,
      categories: [...new Set(products.map(p => p.c_category).filter(Boolean))].sort(),
      types: [...new Set(products.map(p => p.c_type).filter(Boolean))].sort(),
      manufacturers: [...new Set(products.map(p => p.c_manufacturer).filter(Boolean))].sort(),
      timestamp: now
    };
    
    return products;
  } catch (error) {
    console.error('Error fetching filter data:', error);
    return [];
  }
};

export const getFilterOptions = async () => {
  await getFilterData();
  if (filterDataCache) {
    return {
      categories: filterDataCache.categories,
      types: filterDataCache.types,
      manufacturers: filterDataCache.manufacturers
    };
  }
  return { categories: [], types: [], manufacturers: [] };
};

export const fetchFilteredProducts = async (filters: ProductFilterParams): Promise<Product[]> => {
  try {
    const response = await axios.get<Product[]>(`${API_URL}/products/search`, { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching filtered products:', error);
    return [];
  }
};

export const searchProducts = async (searchText: string): Promise<Product[]> => {
  try {
    const response = await axios.get<Product[]>(`${API_URL}/products/search`, {
      params: { search: searchText }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

export const sendChatMessage = async (message: string): Promise<ChatResponse> => {
  try {
    const response = await axios.post<ChatResponse>(`${API_URL}/chat`, {
      message: message
    });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

export const searchProductsByImage = async (
  imageFile: File
): Promise<ImageSearchResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await axios.post<ImageSearchResponse>(`${API_URL}/image-search/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching products by image:', error);
    throw error;
  }
};

export const searchProductsByVoice = async (audioFile: File): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('audio_file', audioFile);

    const response = await axios.post(`${API_URL}/voice-search/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching products by voice:', error);
    throw error;
  }
};

export const fetchRecentlyPurchased = async (days: number = 180): Promise<Product[]> => {
  const now = Date.now();
  
  if (globalCache && (now - globalCache.timestamp) < CACHE_DURATION) {
    return globalCache.recentlyPurchased;
  }
  
  try {
    const response = await axios.get<Product[]>(`${API_URL}/products/recently-purchased`);
    const recentlyPurchased = response.data;
    
    if (!globalCache) {
      globalCache = {
        bestSellers: [],
        recentlyPurchased: [],
        timestamp: now
      };
    }
    globalCache.recentlyPurchased = recentlyPurchased;
    globalCache.timestamp = now;
    
    return recentlyPurchased;
  } catch (error) {
    console.error('Error fetching recently purchased products:', error);
    return [];
  }
};

export const fetchRecentlyShipped = async (days: number = 7): Promise<Product[]> => {
  try {
    const response = await axios.get<Product[]>(`${API_URL}/products/recently-shipped`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recently shipped products:', error);
    return [];
  }
};

export const fetchProductSuggestions = async (query: string): Promise<string[]> => {
  try {
    const response = await axios.get<string[]>(`${API_URL}/products/suggestions`, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching product suggestions:', error);
    return [];
  }
};

export const fetchDetailedProductSuggestions = async (query: string, limit: number = 10): Promise<Product[]> => {
  try {
    const response = await axios.get<Product[]>(`${API_URL}/products/suggestions-detailed`, {
      params: { query, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching detailed product suggestions:', error);
    return [];
  }
};

export const advancedSearchProducts = async (query: string, limit: number = 50): Promise<Product[]> => {
  try {
    const response = await axios.get<Product[]>(`${API_URL}/products/advanced-search`, {
      params: { query, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error performing advanced search:', error);
    return [];
  }
};

export const fetchProductById = async (productId: number): Promise<Product | null> => {
  try {
    const response = await axios.get<Product>(`${API_URL}/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }
};

export const preloadFrequentlyUsedData = async (): Promise<void> => {
  try {
    await Promise.all([
      fetchBestSellers(),
      fetchRecentlyPurchased()
    ]);
  } catch (error) {
    console.error('Error preloading data:', error);
  }
};

export const clearCache = (): void => {
  globalCache = null;
  filterDataCache = null;
};

export const formatProduct = (product: Product, index: number): string => {
  let formattedProduct = `${index + 1}. ${product.name}\n`;
  formattedProduct += `Type: ${product.c_type || 'N/A'}\n`;
  formattedProduct += `Category: ${product.c_category || 'N/A'}\n`;
  formattedProduct += `Manufacturer: ${product.c_manufacturer || 'N/A'}\n`;
  formattedProduct += `Price: ${product.price ? `$${Number(product.price).toFixed(2)}` : 'N/A'}`;
  return formattedProduct;
};

export const formatChatResponse = (data: ChatResponse): string => {
  let response = data.ai_response;
  
  if (data.products && data.products.length > 0) {
    response += '\n\nHere are the products I found:\n';
    data.products.forEach((product, index) => {
      response += formatProduct(product, index);
      response += '\n\n';
    });
  }
  
  return response;
};

export const formatFilterResponse = (products: Product[], startIndex: number = 0): string => {
  let response = `Found ${products.length} products:\n\n`;
  products.forEach((product, index) => {
    response += formatProduct(product, startIndex + index);
    response += '\n\n';
  });
  return response;
};
