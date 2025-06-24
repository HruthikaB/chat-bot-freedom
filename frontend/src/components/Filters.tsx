import React, { useEffect, useState } from 'react';
import { Filter, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem} from "@/components/ui/dropdown-menu";
import { FilterState } from './FilterModal';
import { fetchCategories, fetchTypes, fetchManufacturers } from '@/lib/api';

interface FiltersProps {
  onClearFilters: () => void;
  onOpenFilterModal: () => void;
  activeFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const FilterItem = ({ 
  label, 
  isActive = false, 
  hasChevron = true, 
  className = "",
  options = [],
  value = "",
  onSelect,
  isLoading = false
}: { 
  label: string;
  isActive?: boolean;
  hasChevron?: boolean;
  className?: string;
  options: { label: string; value: string }[];
  value?: string;
  onSelect?: (value: string) => void;
  isLoading?: boolean;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`${className} ${isActive ? 'bg-gray-100' : 'bg-white'} border-gray-300`}
        >
          {label}
          {hasChevron && <ChevronDown className="h-4 w-4 ml-1" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-48"
      >
        <div className="max-h-[200px] overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : (
            options.map((option) => (
              <DropdownMenuItem 
                key={option.value}
                onClick={() => onSelect?.(option.value)}
                className={`${option.value === value ? 'bg-gray-100' : ''} cursor-pointer flex items-center justify-between`}
              >
                {option.label}
                {option.value === value && <Check className="h-4 w-4 text-shop-purple" />}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Filters: React.FC<FiltersProps> = ({ 
  onClearFilters, 
  onOpenFilterModal, 
  activeFilters,
  onFilterChange 
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState({
    categories: true,
    types: true,
    manufacturers: true
  });

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [categoriesData, typesData, manufacturersData] = await Promise.all([
          fetchCategories(),
          fetchTypes(),
          fetchManufacturers()
        ]);
        
        setCategories(categoriesData);
        setTypes(typesData);
        setManufacturers(manufacturersData);
      } catch (error) {
        console.error('Error loading filter data:', error);
      } finally {
        setIsLoading({
          categories: false,
          types: false,
          manufacturers: false
        });
      }
    };

    loadFilterData();
  }, []);

  const sortOptions = [
    { label: "Featured", value: "" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
    { label: "Name: A to Z", value: "name_asc" },
    { label: "Name: Z to A", value: "name_desc" },
    { label: "Best Selling", value: "best_selling" },
    { label: "Newest", value: "newest" }
  ];

  const categoryOptions = [
    { label: "All Categories", value: "" },
    ...categories.map(category => ({
      label: category,
      value: category
    }))
  ];

  const typeOptions = [
    { label: "All Types", value: "" },
    ...types.map(type => ({
      label: type,
      value: type
    }))
  ];

  const manufacturerOptions = [
    { label: "All Manufacturers", value: "" },
    ...manufacturers.map(manufacturer => ({
      label: manufacturer,
      value: manufacturer
    }))
  ];

  const priceOptions = [
    { label: "All Prices", value: "" },
    { label: "Under $25", value: "under_25" },
    { label: "$25 to $50", value: "25_50" },
    { label: "$50 to $100", value: "50_100" },
    { label: "Over $100", value: "over_100" }
  ];

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFilterChange({
      ...activeFilters,
      [key]: value
    });
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="border-gray-300 flex items-center gap-1 hover:bg-gray-50"
          onClick={onOpenFilterModal}
        >
          <Filter className="h-3.5 w-3.5" /> 
          <span>Filters</span>
        </Button>
        
        <FilterItem 
          label="Category" 
          options={categoryOptions}
          value={activeFilters.category}
          isActive={!!activeFilters.category}
          onSelect={(value) => handleFilterChange('category', value)}
          isLoading={isLoading.categories}
        />
        <FilterItem 
          label="Type" 
          options={typeOptions}
          value={activeFilters.type}
          isActive={!!activeFilters.type}
          onSelect={(value) => handleFilterChange('type', value)}
          isLoading={isLoading.types}
        />
        <FilterItem 
          label="Manufacturer" 
          options={manufacturerOptions}
          value={activeFilters.manufacturer}
          isActive={!!activeFilters.manufacturer}
          onSelect={(value) => handleFilterChange('manufacturer', value)}
          isLoading={isLoading.manufacturers}
        />
        <FilterItem 
          label="Price" 
          options={priceOptions}
          value={activeFilters.price}
          isActive={!!activeFilters.price}
          onSelect={(value) => handleFilterChange('price', value)}
        />
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearFilters}
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        >
          Clear all
        </Button>
      </div>
      
      <div className="flex items-center gap-3">
        <FilterItem 
          label="Sort by"
          options={sortOptions}
          value={activeFilters.sort}
          isActive={!!activeFilters.sort}
          onSelect={(value) => handleFilterChange('sort', value)}
          className="min-w-[140px] justify-between"
        />
      </div>
    </div>
  );
};

export default Filters;