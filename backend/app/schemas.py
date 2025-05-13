from pydantic import BaseModel

class ProductBase(BaseModel):
    name: str
    category: str
    type: str
    size: str
    price: float
    brand: str
    color: str
    image_url: str

class Product(ProductBase):
    id: int

    class Config:
        orm_mode = True


class ChatbotMessageBase(BaseModel):
    message_type: str
    content: str

class ChatbotMessageCreate(ChatbotMessageBase):
    pass

class ChatbotMessageOut(ChatbotMessageBase):
    id: int

    class Config:
        orm_mode = True