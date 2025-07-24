import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFilterOptions } from '@/lib/api';

interface FilterOptions {
  categories: string[];
  types: string[];
  manufacturers: string[];
}

interface FilterContextType {
  filterOptions: FilterOptions;
  isLoading: boolean;
  error: string | null;
  refreshFilterOptions: () => Promise<void>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilterOptions = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterOptions must be used within a FilterProvider');
  }
  return context;
};

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    types: [],
    manufacturers: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFilterOptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const options = await getFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      setError('Failed to load filter options');
      console.error('Error loading filter options:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFilterOptions = async () => {
    await loadFilterOptions();
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  return (
    <FilterContext.Provider value={{
      filterOptions,
      isLoading,
      error,
      refreshFilterOptions
    }}>
      {children}
    </FilterContext.Provider>
  );
}; 