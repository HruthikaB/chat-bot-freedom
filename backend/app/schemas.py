from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

class ProductImageBase(BaseModel):
    image_name: Optional[str] = None
    image_path: Optional[str] = None
    image_sort: Optional[int] = None

class ProductImage(ProductImageBase):
    image_id: int
    product_id: int

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keyword: Optional[str] = None
    tag: Optional[str] = None
    product_type: Optional[str] = None
    price: Optional[Decimal] = None
    sales: Optional[int] = None
    c_type: Optional[str] = None
    c_category: Optional[str] = None
    c_manufacturer: Optional[str] = None
    c_product_group: Optional[str] = None
    if_featured: Optional[bool] = None
    if_sellable: Optional[bool] = None
    show_in_store: Optional[int] = None
    status: Optional[int] = None
    sku_name: Optional[str] = None
    w_description: Optional[str] = None
    w_oem: Optional[str] = None
    w_weight: Optional[Decimal] = None
    w_height: Optional[Decimal] = None
    w_width: Optional[Decimal] = None
    w_depth: Optional[Decimal] = None
    date_added: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    name: Optional[str] = None

class Product(ProductBase):
    product_id: int
    images: List[ProductImage] = []

    class Config:
        from_attributes = True

class ChatbotMessageBase(BaseModel):
    message_type: str
    content: str

class ChatbotMessageCreate(ChatbotMessageBase):
    pass

class ChatbotMessageOut(ChatbotMessageBase):
    id: int

    class Config:
        from_attributes = True

class ShipmentProduct(BaseModel):
    id: int
    product_id: int
    shipment_id: int
    quantity: int
    created_at: int

    class Config:
        from_attributes = True

class ProductImageFeaturesBase(BaseModel):
    image_id: int
    features: bytes

class ProductImageFeaturesCreate(ProductImageFeaturesBase):
    pass

class ProductImageFeatures(ProductImageFeaturesBase):
    created_at: datetime

    class Config:
        from_attributes = True