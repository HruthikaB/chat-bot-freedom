import { useState } from 'react';
import Header from '@/components/Header';
import Results from '@/components/Results';
import ChatBot from '@/components/ChatBot';
import ProductsFilter from '@/components/ProductsFilter';
import { Product } from '@/lib/types';
import Filters from '@/components/Filters';
import FilterModal, { FilterState } from '@/components/FilterModal';

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProductsFilterOpen, setIsProductsFilterOpen] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [isFilterMaximized, setIsFilterMaximized] = useState(false);
  const [displayProducts, setDisplayProducts] = useState<Product[] | undefined>();
  const [filterSource, setFilterSource] = useState<'chat' | 'filter' | 'search' | undefined>();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    sort: '',
    category: '',
    type: '',
    manufacturer: '',
    price: ''
  });

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
  };

  const handleClearResults = () => {
    setDisplayProducts(undefined);
    setFilterSource(undefined);
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