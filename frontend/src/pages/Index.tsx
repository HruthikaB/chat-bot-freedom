import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Results from '@/components/Results';
import ChatBot from '@/components/ChatBot';
import ProductsFilter from '@/components/ProductsFilter';
import { Product } from '@/lib/types';
import Filters from '@/components/Filters';
import FilterModal, { FilterState } from '@/components/FilterModal';
import { ImageSearchResponse, preloadFrequentlyUsedData } from '@/lib/api';

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProductsFilterOpen, setIsProductsFilterOpen] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [isFilterMaximized, setIsFilterMaximized] = useState(false);
  const [displayProducts, setDisplayProducts] = useState<Product[] | undefined>();
  const [filterSource, setFilterSource] = useState<'chat' | 'filter' | 'search' | 'image' | undefined>();
  const [imageSearchResults, setImageSearchResults] = useState<ImageSearchResponse['products'] | undefined>();
  const [isImageSearchLoading, setIsImageSearchLoading] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    sort: '',
    category: '',
    type: '',
    manufacturer: '',
    price: ''
  });

  useEffect(() => {
    preloadFrequentlyUsedData();
  }, []);

  const handleChatProducts = (products: Product[]) => {
    setDisplayProducts(products);
    setFilterSource('chat');
  };

  const handleFilteredProducts = (products: Product[]) => {
    setDisplayProducts(products);
    setFilterSource('filter');
  };

  const handleSearchResults = (products: Product[]) => {
    setDisplayProducts(products);
    setFilterSource('search');
    setImageSearchResults(undefined); // Clear image search results
  };

  const handleImageSearchResults = (imageResults: ImageSearchResponse['products']) => {
    const products = imageResults.map(item => item.product);
    setDisplayProducts(products);
    setImageSearchResults(imageResults);
    setFilterSource('image');
    setIsImageSearchLoading(false);
  };

  const handleImageSearchStart = () => {
    setIsImageSearchLoading(true);
    setFilterSource('image');
  };

  const handleClearResults = () => {
    setDisplayProducts(undefined);
    setFilterSource(undefined);
    setImageSearchResults(undefined);
    setIsImageSearchLoading(false);
    setActiveFilters({
      sort: '',
      category: '',
      type: '',
      manufacturer: '',
      price: ''
    });
  };

  const handleApplyFilters = (filters: FilterState) => {
    setActiveFilters(filters);
    setFilterSource('filter');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        toggleChat={() => setIsChatOpen(true)} 
        toggleProductsFilter={() => setIsProductsFilterOpen(true)}
        onSearchResults={handleSearchResults}
        onImageSearchResults={handleImageSearchResults}
        onImageSearchStart={handleImageSearchStart}
        onClearResults={handleClearResults}
      />
      <div className="filters-container pt-24 px-6">
        <Filters 
          onClearFilters={handleClearResults}
          onOpenFilterModal={() => setIsFilterModalOpen(true)}
          activeFilters={activeFilters}
          onFilterChange={handleApplyFilters}
        />
      </div>
      <main className="pt-[12px]">
        <div className="container mx-auto px-4">
          <Results 
            isChatMaximized={isChatMaximized || isFilterMaximized}
            displayProducts={displayProducts}
            filterSource={filterSource}
            activeFilters={activeFilters}
            imageSearchResults={imageSearchResults}
            isImageSearchLoading={isImageSearchLoading}
          />
        </div>
      </main>

      <ChatBot 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onMaximizeChange={setIsChatMaximized}
        onProductsUpdate={handleChatProducts}
      />

      <ProductsFilter 
        isOpen={isProductsFilterOpen}
        onClose={() => setIsProductsFilterOpen(false)}
        onMaximizeChange={setIsFilterMaximized}
        onProductsFiltered={handleFilteredProducts}
      />

      <FilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        initialFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default Index;