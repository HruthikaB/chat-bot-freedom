import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { fetchCategories, fetchTypes, fetchManufacturers } from '@/lib/api';

export interface FilterState {
  sort: string;
  category: string;
  type: string;
  manufacturer: string;
  price: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilters?: FilterState;
  onApplyFilters: (filters: FilterState) => void;
}

interface FilterSectionProps {
  title: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { id: string; label: string; value: string }[];
  isExpanded: boolean;
  onToggle: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  value,
  onValueChange,
  options,
  isExpanded,
  onToggle
}) => {
  return (
    <div className="space-y-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <h3 className="font-medium">{title}</h3>
        <Button 
          variant="ghost" 
          size="sm"
          className="p-0 h-auto hover:bg-transparent"
        >
          {isExpanded ? (
            <Minus className="h-5 w-5" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {isExpanded && (
        <RadioGroup value={value} onValueChange={onValueChange} className="space-y-3">
          {options.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.id} />
              <Label htmlFor={option.id}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </div>
  );
};

const FilterModal: React.FC<FilterModalProps> = ({ 
  isOpen, 
  onClose, 
  initialFilters,
  onApplyFilters 
}) => {
  const [selectedSort, setSelectedSort] = useState(initialFilters?.sort || "");
  const [selectedCategory, setSelectedCategory] = useState(initialFilters?.category || "");
  const [selectedType, setSelectedType] = useState(initialFilters?.type || "");
  const [selectedManufacturer, setSelectedManufacturer] = useState(initialFilters?.manufacturer || "");
  const [selectedPrice, setSelectedPrice] = useState(initialFilters?.price || "");

  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Track expanded state for each section
  const [expandedSections, setExpandedSections] = useState({
    sort: true,
    category: true,
    type: true,
    manufacturer: true,
    price: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadFilterData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleReset = () => {
    setSelectedSort("");
    setSelectedCategory("");
    setSelectedType("");
    setSelectedManufacturer("");
    setSelectedPrice("");
  };

  const handleApply = () => {
    onApplyFilters({
      sort: selectedSort,
      category: selectedCategory,
      type: selectedType,
      manufacturer: selectedManufacturer,
      price: selectedPrice
    });
    onClose();
  };

  const sortOptions = [
    { id: 'sort-featured', label: 'Featured', value: '' },
    { id: 'sort-price-asc', label: 'Price: Low to High', value: 'price_asc' },
    { id: 'sort-price-desc', label: 'Price: High to Low', value: 'price_desc' },
    { id: 'sort-name-asc', label: 'Name: A to Z', value: 'name_asc' },
    { id: 'sort-name-desc', label: 'Name: Z to A', value: 'name_desc' },
    { id: 'sort-best-selling', label: 'Best Selling', value: 'best_selling' },
    { id: 'sort-newest', label: 'Newest', value: 'newest' }
  ];

  const categoryOptions = [
    { id: 'cat-all', label: 'All Categories', value: '' },
    ...categories.map(category => ({
      id: `cat-${category}`,
      label: category,
      value: category
    }))
  ];

  const typeOptions = [
    { id: 'type-all', label: 'All Types', value: '' },
    ...types.map(type => ({
      id: `type-${type}`,
      label: type,
      value: type
    }))
  ];

  const manufacturerOptions = [
    { id: 'manufacturer-all', label: 'All Manufacturers', value: '' },
    ...manufacturers.map(manufacturer => ({
      id: `manufacturer-${manufacturer}`,
      label: manufacturer,
      value: manufacturer
    }))
  ];

  const priceOptions = [
    { id: 'price-all', label: 'All Prices', value: '' },
    { id: 'price-under-25', label: 'Under $25', value: 'under_25' },
    { id: 'price-25-50', label: '$25 to $50', value: '25_50' },
    { id: 'price-50-100', label: '$50 to $100', value: '50_100' },
    { id: 'price-over-100', label: 'Over $100', value: 'over_100' }
  ];

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shop-purple"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex"
      onClick={handleOverlayClick}
    >
      <div className="bg-white w-[320px] min-h-full animate-slide-in-from-left overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Filters</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4 space-y-6">
          <FilterSection
            title="Sort by"
            value={selectedSort}
            onValueChange={setSelectedSort}
            options={sortOptions}
            isExpanded={expandedSections.sort}
            onToggle={() => toggleSection('sort')}
          />
          
          <Separator />
          
          <FilterSection
            title="Category"
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            options={categoryOptions}
            isExpanded={expandedSections.category}
            onToggle={() => toggleSection('category')}
          />

          <Separator />

          <FilterSection
            title="Type"
            value={selectedType}
            onValueChange={setSelectedType}
            options={typeOptions}
            isExpanded={expandedSections.type}
            onToggle={() => toggleSection('type')}
          />

          <Separator />

          <FilterSection
            title="Manufacturer"
            value={selectedManufacturer}
            onValueChange={setSelectedManufacturer}
            options={manufacturerOptions}
            isExpanded={expandedSections.manufacturer}
            onToggle={() => toggleSection('manufacturer')}
          />

          <Separator />

          <FilterSection
            title="Price Range"
            value={selectedPrice}
            onValueChange={setSelectedPrice}
            options={priceOptions}
            isExpanded={expandedSections.price}
            onToggle={() => toggleSection('price')}
          />
        </div>
        
        <div className="sticky bottom-0 border-t p-4 bg-white flex items-center justify-between gap-4">
          <Button 
            variant="outline" 
            onClick={handleReset} 
            className="flex-1 hover:bg-gray-50"
          >
            Reset
          </Button>
          <Button 
            onClick={handleApply} 
            className="flex-1"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;