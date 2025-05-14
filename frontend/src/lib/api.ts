import { ChatResponse, ProductFilterParams } from "./types";
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export const sendChatMessage = async (message: string): Promise<ChatResponse> => {
  try {
    const response = await axios.post(`${API_URL}/chat`, { message });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

export const fetchFilteredProducts = async (filters: ProductFilterParams) => {
  try {
    const response = await axios.get(`${API_URL}/products`, { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const formatProduct = (product: any, index: number): string => {
  const { _sa_instance_state, ...productData } = product;
  
  let formattedProduct = `${index + 1}. ${productData.brand || ''} ${productData.name}\n`;
  formattedProduct += `   Size: ${productData.size || 'N/A'}\n`;
  formattedProduct += `   Type: ${productData.type || 'N/A'}\n`;
  formattedProduct += `   Color: ${productData.color || 'N/A'}\n`;
  formattedProduct += `   Price: $${productData.price}`;
  
  return formattedProduct;
};

export const formatChatResponse = (data: ChatResponse): string => {
  if (data.results.length === 0) {
    return 'I couldn\'t find any products matching your criteria. Could you try a different search?';
  }
  
  const productList = data.results
    .map((product, index) => formatProduct(product, index))
    .join('\n\n');
  
  return `I found ${data.results.length} products matching your criteria. Here are the top results:\n\n${productList}`;
};

export const formatFilterResponse = (products: any[]): string => {
  if (products.length === 0) {
    return 'No products matched your criteria.';
  }
  
  const productList = products
    .map((product, index) => formatProduct(product, index))
    .join('\n\n');
  
  return `Here are your results:\n\n${productList}`;
}; 