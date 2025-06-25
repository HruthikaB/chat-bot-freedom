import { ChatResponse, ProductFilterParams, Product, Manufacturer } from "./types";
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
    
    // Get unique categories
    const categories = [...new Set(products
      .map(product => product.c_category)
      .filter(category => category) // Remove null/undefined
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
    
    // Get unique types
    const types = [...new Set(products
      .map(product => product.c_type)
      .filter(type => type) // Remove null/undefined
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
    
    // Get unique manufacturers
    const manufacturers = [...new Set(products
      .map(product => product.c_manufacturer)
      .filter(manufacturer => manufacturer) // Remove null/undefined
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
  
  // Take only the first 5 products
  const limitedProducts = data.products.slice(0, 5);
  
  let response = limitedProducts.map((product, index) => formatProduct(product, index)).join('\n\n');
  
  // Add a note if there are more products
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
