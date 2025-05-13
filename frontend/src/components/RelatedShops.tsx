import React from 'react';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type ShopCardProps = {
  name: string;
  image: string;
  products: number;
};

interface RelatedShopsProps {
  isChatMaximized?: boolean;
}

const ShopCard = ({ name, image, products }: ShopCardProps) => (
  <div className="bg-white border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md">
    <div className="h-32 bg-gray-100">
      <img src={image} alt={name} className="w-full h-full object-cover" />
    </div>
    <div className="p-3">
      <h3 className="font-medium">{name}</h3>
      <p className="text-sm text-gray-500">{products} products</p>
    </div>
  </div>
);

const RelatedShops: React.FC<RelatedShopsProps> = ({ isChatMaximized = false }) => {
  const shops = [
    { id: 1, name: 'Nike Store', image: '/placeholder.svg', products: 2356 },
    { id: 2, name: 'Adidas Official', image: '/placeholder.svg', products: 1845 },
    { id: 3, name: 'Puma', image: '/placeholder.svg', products: 1523 },
    { id: 4, name: 'New Balance', image: '/placeholder.svg', products: 987 },
    { id: 5, name: 'Under Armour', image: '/placeholder.svg', products: 1245 },
    { id: 6, name: 'Reebok Shop', image: '/placeholder.svg', products: 876 },
    { id: 7, name: 'Converse', image: '/placeholder.svg', products: 654 },
    { id: 8, name: 'Vans Store', image: '/placeholder.svg', products: 432 }
  ];

  return (
    <div className={`py-6 ${isChatMaximized ? 'mr-[380px]' : ''}`}>
      <h2 className="text-lg font-medium mb-4">Related Shops</h2>
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent>
          {shops.map((shop) => (
            <CarouselItem key={shop.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
              <ShopCard name={shop.name} image={shop.image} products={shop.products} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    </div>
  );
};

export default RelatedShops;