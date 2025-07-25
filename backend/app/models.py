from sqlalchemy import Column, Integer, String, Text, ForeignKey, DECIMAL, BigInteger, SmallInteger, LargeBinary, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Product(Base):
    __tablename__ = "product"

    product_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    description = Column(String(255))
    meta_description = Column(String(100))
    meta_keyword = Column(String(60))
    tag = Column(String(60))
    shop_site_overview = Column(String(512))
    detailed_description = Column(String(3000))
    product_type = Column(String(100))
    price = Column(DECIMAL(15,2))
    sales = Column(Integer)
    sales_amount = Column(DECIMAL(15,2))
    core_price = Column(DECIMAL(15,2))
    core_credit = Column(DECIMAL(15,2))
    product_availability = Column(String(60))
    product_availability_note = Column(String(255))
    date_added = Column(Integer)
    date_modify = Column(Integer)
    c_type = Column(String(45))
    c_category = Column(String(100))
    c_manufacturer = Column(String(100))
    c_product_group = Column(String(100))
    internal_notes = Column(String(250))
    receiving_notes = Column(String(200))
    shipping_notes = Column(String(200))
    if_featured = Column(SmallInteger)  # tinyint(1)
    package = Column(String(200))
    if_sellable = Column(SmallInteger)  # tinyint(1)
    cash_incentive_qualified = Column(Integer)
    revenue_account_id = Column(Integer)
    inventory_account_id = Column(Integer)
    sales_tax_code = Column(String(40))
    old_url_alias = Column(String(255))
    url_alias = Column(String(200))
    url_alias_id = Column(Integer)
    show_in_store = Column(Integer)
    repair_procedure = Column(String(150))
    serial_number_required = Column(SmallInteger)  # tinyint(1)
    collect_test_result_in_receiving = Column(SmallInteger)  # tinyint(1)
    oem_serial_number_required = Column(SmallInteger)  # tinyint(1)
    core_replacement_rate = Column(DECIMAL(15,2))
    inactive = Column(Integer)
    client_id = Column(Integer)
    if_core_swap_only = Column(SmallInteger)  # tinyint(1)
    warranty_time = Column(Integer)
    status = Column(Integer)
    sync = Column(SmallInteger)  # tinyint(1)
    sku_name = Column(String(60))
    salesforce_id = Column(String(45))
    order_notes = Column(String(250))
    w_description = Column(String(1000))
    w_url_part_number = Column(String(100))
    w_replacement_for = Column(String(200))
    w_oem_new_pn = Column(String(100))
    w_oem_repair_pn = Column(String(100))
    w_freedom_new_pn = Column(String(100))
    w_freedom_repair_pn = Column(String(100))
    w_pn_type = Column(String(100))
    w_available_as_oem_new = Column(SmallInteger)  # tinyint(1)
    w_available_as_oem_repair = Column(SmallInteger)  # tinyint(1)
    w_available_as_freedom_new = Column(SmallInteger)  # tinyint(1)
    w_available_as_freedom_repair = Column(SmallInteger)  # tinyint(1)
    w_outright = Column(SmallInteger)  # tinyint(1)
    w_exchange = Column(SmallInteger)  # tinyint(1)
    w_advance_exchange_required = Column(SmallInteger)  # tinyint(1)
    w_primary_category = Column(String(25))
    w_subcategory = Column(String(25))
    w_oem = Column(String(25))
    w_sku_category = Column(String(25))
    w_for_oem_system_models = Column(String(25))
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

class ShipmentProduct(Base):
    __tablename__ = "shipment_product"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("product.product_id"))
    shipment_id = Column(Integer, index=True)
    quantity = Column(Integer, default=1)
    created_at = Column(BigInteger)

    product = relationship("Product")

class ProductImageFeatures(Base):
    __tablename__ = "product_image_features"

    image_id = Column(Integer, ForeignKey("product_image.image_id"), primary_key=True, index=True)
    features = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product_image = relationship("ProductImage")