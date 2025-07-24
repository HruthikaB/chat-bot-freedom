import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Product } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getProductImageUrl = (product: Product): string => {
  if (product.images && product.images.length > 0 && product.images[0].image_path) {
    return product.images[0].image_path;
  }
  return '/placeholder.svg';
};

export const formatProductPrice = (price: string | number): string => {
  if (typeof price === 'string') {
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  }
  return price.toFixed(2);
};

export const getProductDisplayName = (product: Product): string => {
  return product.name || product.sku_name || 'Unnamed Product';
};

export const getProductManufacturer = (product: Product): string => {
  return product.c_manufacturer || product.w_oem || 'Unknown Manufacturer';
};

export const getProductCategory = (product: Product): string => {
  return product.c_category || 'Uncategorized';
};

export const getProductType = (product: Product): string => {
  return product.c_type || 'Unknown Type';
};

export const isProductFeatured = (product: Product): boolean => {
  return product.if_featured === true;
};

export const isProductSellable = (product: Product): boolean => {
  return product.if_sellable === true;
};

export const isProductInStore = (product: Product): boolean => {
  return product.show_in_store === 1;
};

export const filterProductsByCategory = (products: Product[], category: string): Product[] => {
  if (!category) return products;
  return products.filter(product => 
    product.c_category?.toLowerCase() === category.toLowerCase()
  );
};

export const filterProductsByType = (products: Product[], type: string): Product[] => {
  if (!type) return products;
  return products.filter(product => 
    product.c_type?.toLowerCase() === type.toLowerCase()
  );
};

export const filterProductsByManufacturer = (products: Product[], manufacturer: string): Product[] => {
  if (!manufacturer) return products;
  return products.filter(product => 
    product.c_manufacturer?.toLowerCase() === manufacturer.toLowerCase()
  );
};

export const filterProductsByPrice = (products: Product[], priceRange: string): Product[] => {
  if (!priceRange) return products;
  
  return products.filter(product => {
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    
    switch (priceRange) {
      case 'under_25':
        return price < 25;
      case '25_50':
        return price >= 25 && price <= 50;
      case '50_100':
        return price >= 50 && price <= 100;
      case 'over_100':
        return price > 100;
      default:
        return true;
    }
  });
};

export const sortProducts = (products: Product[], sortBy: string, bestSellers: Set<number>): Product[] => {
  const sortedProducts = [...products];
  
  sortedProducts.sort((a, b) => {
    const priceA = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
    const priceB = typeof b.price === 'string' ? parseFloat(b.price) : b.price;

    switch (sortBy) {
      case '':
        return ((b.if_featured ? 1 : 0) - (a.if_featured ? 1 : 0));
      case 'price_asc':
        return priceA - priceB;
      case 'price_desc':
        return priceB - priceA;
      case 'name_asc':
        return (a.name || '').localeCompare(b.name || '');
      case 'name_desc':
        return (b.name || '').localeCompare(a.name || '');
      case 'best_selling':
        return (bestSellers.has(b.product_id) ? 1 : 0) - (bestSellers.has(a.product_id) ? 1 : 0);
      case 'newest':
        return (b.date_added || '').localeCompare(a.date_added || '');
      default:
        return 0;
    }
  });
  
  return sortedProducts;
};

export const ensureArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
};