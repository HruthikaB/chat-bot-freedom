import { ChatResponse, ProductFilterParams, Product } from "./types";
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const sendChatMessage = async (message: string): Promise<ChatResponse> => {
  try {
    const response = await axios.post(`${API_URL}/chat`, { message });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

export const fetchProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}/products/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const fetchBestSellers = async (): Promise<Product[]> => {
  try {
    const response = await axios.get(`${API_URL}/products/best-sellers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    return [];
  }
};

export const fetchCategories = async (): Promise<string[]> => {
  try {
    const response = await axios.get<Product[]>(`${API_URL}/products/`);
    const products = response.data;
    
    const categories = [...new Set(products
      .map(product => product.c_category)
      .filter(category => category)
    )];
    
    return categories.sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const fetchTypes = async (): Promise<string[]> => {
  try {
    const response = await axios.get<Product[]>(`${API_URL}/products/`);
    const products = response.data;
    
    const types = [...new Set(products
      .map(product => product.c_type)
      .filter(type => type)
    )];
    
    return types.sort();
  } catch (error) {
    console.error('Error fetching types:', error);
    return [];
  }
};

export const fetchManufacturers = async (): Promise<string[]> => {
  try {
    const response = await axios.get<Product[]>(`${API_URL}/products/`);
    const products = response.data;
    
    const manufacturers = [...new Set(products
      .map(product => product.c_manufacturer)
      .filter(manufacturer => manufacturer)
    )];
    
    return manufacturers.sort();
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    return [];
  }
};

export const fetchFilteredProducts = async (filters: ProductFilterParams) => {
  try {
    const response = await axios.get(`${API_URL}/products/search`, { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching filtered products:', error);
    throw error;
  }
};

export const searchProducts = async (searchText: string): Promise<Product[]> => {
  try {
    const response = await axios.get(`${API_URL}/products/search`, {
      params: { search: searchText }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

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

export const searchProductsByImage = async (
  imageFile: File
): Promise<ImageSearchResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await axios.post(`${API_URL}/image-search/`, formData, {
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

export const searchProductsByVoice = async (audioFile: File) => {
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

export const formatProduct = (product: Product, index: number): string => {
  let formattedProduct = `${index + 1}. ${product.name}\n`;
  formattedProduct += `Type: ${product.c_type || 'N/A'}\n`;
  formattedProduct += `Category: ${product.c_category || 'N/A'}\n`;
  formattedProduct += `Manufacturer: ${product.c_manufacturer || 'N/A'}\n`;
  formattedProduct += `Price: ${product.price ? `$${Number(product.price).toFixed(2)}` : 'N/A'}`;
  return formattedProduct;
};

export const formatChatResponse = (data: ChatResponse): string => {
  if (!data.products || data.products.length === 0) {
    return "I couldn't find any products matching your criteria. Could you try a different search?";
  }
  
  const limitedProducts = data.products.slice(0, 5);
  
  let response = limitedProducts.map((product, index) => formatProduct(product, index)).join('\n\n');
  
  if (data.products.length > 5) {
    response += `\n\n... and ${data.products.length - 5} more products available.`;
  }
  
  return response;
};

export const formatFilterResponse = (products: Product[], startIndex: number = 0): string => {
  if (products.length === 0) {
    return 'No products matched your criteria.';
  }
  
  return products.map((product, index) => formatProduct(product, startIndex + index)).join('\n\n');
};

export const fetchRecentlyPurchased = async (days: number = 180): Promise<Product[]> => {
  try {
    const response = await axios.get(`${API_URL}/products/recently-purchased`, {
      params: { days }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recently purchased products:', error);
    return [];
  }
};

export const fetchProductSuggestions = async (query: string): Promise<string[]> => {
  if (!query.trim()) return [];
  try {
    const response = await axios.get(`${API_URL}/products/suggestions`, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching product suggestions:', error);
    return [];
  }
};

export const fetchDetailedProductSuggestions = async (query: string, limit: number = 10): Promise<Product[]> => {
  if (!query.trim()) return [];
  try {
    const response = await axios.get(`${API_URL}/products/suggestions-detailed`, {
      params: { query, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching detailed product suggestions:', error);
    return [];
  }
};

export const advancedSearchProducts = async (query: string, limit: number = 50): Promise<Product[]> => {
  if (!query.trim()) return [];
  try {
    const response = await axios.get(`${API_URL}/products/advanced-search`, {
      params: { query, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error performing advanced search:', error);
    return [];
  }
};

export const fetchProductById = async (productId: number): Promise<Product> => {
  try {
    const response = await axios.get(`${API_URL}/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw error;
  }
};
