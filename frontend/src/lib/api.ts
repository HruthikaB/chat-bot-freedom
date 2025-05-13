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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const sendChatMessage = async (message: string): Promise<ChatResponse> => {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

export const formatProduct = (product: any, index: number): string => {
  const { _sa_instance_state, ...productData } = product;
  return `${index + 1}. ${productData.brand} ${productData.name} - $${productData.price}`;
};

export const formatChatResponse = (data: ChatResponse): string => {
  if (data.results.length === 0) {
    return 'I couldn\'t find any products matching your criteria. Could you try a different search?';
  }
  
  const productList = data.results
    .map((product, index) => formatProduct(product, index))
    .join('\n');
  
  return `I found ${data.results.length} products matching your criteria. Here are the top results:\n\n${productList}`;
}; 