from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Boolean, DECIMAL, BigInteger
from sqlalchemy.orm import relationship
from .database import Base

class Product(Base):
    __tablename__ = "product"

    product_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(String(255))
    meta_description = Column(String(100))
    meta_keyword = Column(String(60))
    tag = Column(String(60))
    product_type = Column(String(100))
    price = Column(DECIMAL(15,2))
    sales = Column(Integer)
    sales_amount = Column(DECIMAL(15,2))
    product_availability = Column(String(60))
    c_type = Column(String(45))
    c_category = Column(String(100))
    c_manufacturer = Column(String(100))
    c_product_group = Column(String(100))
    if_featured = Column(Boolean)
    if_sellable = Column(Boolean)
    show_in_store = Column(Integer)
    status = Column(Integer)
    sku_name = Column(String(60))
    w_description = Column(String(1000))
    w_oem = Column(String(25))
    w_weight = Column(DECIMAL(15,2))
    w_height = Column(DECIMAL(15,2))
    w_width = Column(DECIMAL(15,2))
    w_depth = Column(DECIMAL(15,2))
    
    images = relationship("ProductImage", back_populates="product")
    orders = relationship("OrderProduct", back_populates="product")

class ProductImage(Base):
    __tablename__ = "product_image"

    image_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("product.product_id"))
    image_name = Column(String(100))
    image_path = Column(String(255))
    image_sort = Column(Integer)
    image_type = Column(Integer)
    image_path_qc = Column(String(255))
    
    product = relationship("Product", back_populates="images")

class ChatbotMessage(Base):
    __tablename__ = "chatbot_messages"

    id = Column(Integer, primary_key=True, index=True)
    message_type = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)

class OrderProduct(Base):
    __tablename__ = "order_product"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("product.product_id"))
    order_id = Column(Integer, index=True)
    quantity = Column(Integer, default=1)
    created_at = Column(BigInteger)
    
    product = relationship("Product", back_populates="orders")