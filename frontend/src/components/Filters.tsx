import React, { useState } from 'react';
import { ChevronDown, ArrowDownUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "@/components/ui/dropdown-menu";
import FilterModal from './FilterModal';

const FilterItem = ({ 
  label, 
  isActive = false, 
  hasChevron = true, 
  className = "",
  children
}: { 
  label: string, 
  isActive?: boolean,
  hasChevron?: boolean,
  className?: string,
  children?: React.ReactNode
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
      <DropdownMenuContent align="start" className="w-48">
        {children || (
          <>
            <DropdownMenuItem>Option 1</DropdownMenuItem>
            <DropdownMenuItem>Option 2</DropdownMenuItem>
            <DropdownMenuItem>Option 3</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Filters = () => {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isOnSale, setIsOnSale] = useState(true);
  const [priceRange, setPriceRange] = useState([50]);
  
  const maxPrice = priceRange[0] * 12;
  const isMaxSlider = priceRange[0] === 100;
  const priceLabel = `$${maxPrice}${isMaxSlider ? '+' : ''}`;

  return (
    <>
      <div className="w-full">
        <div className="filters-container max-w-[1800px] w-full flex items-center gap-3 py-4 overflow-x-auto">
          <Button 
            variant="outline" 
            size="icon" 
            className="border-gray-300"
            onClick={() => setIsFilterModalOpen(true)}
          >
            <Filter className="h-4 w-4" />
          </Button>
          
          <FilterItem label="Category" />
          
          <Toggle 
            pressed={isOnSale}
            onPressedChange={setIsOnSale}
            variant="outline"
            size="sm"
            className={`border-gray-300 ${isOnSale ? 'bg-gray-100' : 'bg-white'}`}
          >
            On sale
          </Toggle>
          
          <FilterItem label="Ratings" />
          
          <FilterItem label="Gender" />
          
          <FilterItem label="Ships to - IN" />
          
          <FilterItem label="Size" />
          
          <FilterItem label="Color" />
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Price ${maxPrice}{isMaxSlider ? '+' : ''}</span>
            <div className="w-16 h-4 relative flex items-center">
              <Slider 
                defaultValue={[50]} 
                max={100} 
                step={1} 
                value={priceRange}
                onValueChange={setPriceRange}
                className="slider-purple"
              />
            </div>
          </div>
          
          <FilterItem label={priceLabel} />
          
          <Button variant="outline" size="sm" className="border-gray-300 flex items-center gap-1">
            Sort by <ArrowDownUp className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
      
      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} />
    </>
  );
};

export default Filters;