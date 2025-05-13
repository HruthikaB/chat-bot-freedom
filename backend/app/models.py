from sqlalchemy import Column, Integer, String, Float, Text
from .database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    type = Column(String(50), nullable=False)
    size = Column(String(10), nullable=False)
    price = Column(Float, nullable=False)
    brand = Column(String(50), nullable=False)
    color = Column(String(30), nullable=False)
    image_url = Column(String(255), nullable=False)

class ChatbotMessage(Base):
    __tablename__ = "chatbot_messages"

    id = Column(Integer, primary_key=True, index=True)
    message_type = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)