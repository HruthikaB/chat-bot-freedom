import React from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex"
      onClick={handleOverlayClick}
    >
      <div className="bg-white w-[320px] min-h-full animate-slide-in-from-left overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Filters</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4">
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Sort by</h3>
              <Button variant="ghost" size="sm">
                <span className="text-lg">+</span>
              </Button>
            </div>
            <RadioGroup defaultValue="relevance">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="relevance" id="relevance" />
                <Label htmlFor="relevance">Relevance</Label>
              </div>
              
              <div className="flex items-center space-x-2 mt-3">
                <RadioGroupItem value="low-to-high" id="low-to-high" />
                <Label htmlFor="low-to-high">Lowest → Highest Price</Label>
              </div>
              
              <div className="flex items-center space-x-2 mt-3">
                <RadioGroupItem value="high-to-low" id="high-to-low" />
                <Label htmlFor="high-to-low">Highest → Lowest Price</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator className="my-4" />
          
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Category</h3>
              <Button variant="ghost" size="sm">
                <span className="text-lg">+</span>
              </Button>
            </div>
            <RadioGroup defaultValue="all">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All categories</Label>
              </div>
              
              <div className="flex items-center space-x-2 mt-3">
                <RadioGroupItem value="women" id="women" />
                <Label htmlFor="women">Women</Label>
              </div>
              
              <div className="flex items-center space-x-2 mt-3">
                <RadioGroupItem value="men" id="men" />
                <Label htmlFor="men">Men</Label>
              </div>
              
              <div className="flex items-center space-x-2 mt-3">
                <RadioGroupItem value="beauty" id="beauty" />
                <Label htmlFor="beauty">Beauty</Label>
              </div>
              
              <div className="flex items-center space-x-2 mt-3">
                <RadioGroupItem value="food" id="food" />
                <Label htmlFor="food">Food & drinks</Label>
              </div>
              
              <div className="flex items-center space-x-2 mt-3">
                <RadioGroupItem value="baby" id="baby" />
                <Label htmlFor="baby">Baby & toddler</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <div className="mt-auto border-t p-4 sticky bottom-0 bg-white flex justify-between">
          <Button variant="outline" onClick={onClose}>Reset</Button>
          <Button variant="default" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;