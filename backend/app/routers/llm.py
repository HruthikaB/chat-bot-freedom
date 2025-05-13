# app/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.database import SessionLocal
from app.models import Product
import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat_with_bot(request: ChatRequest):
    prompt = f"""
You are an intelligent shopping assistant. Based on the user input, extract filters like:
- category
- brand
- size
- color
- max_price (if mentioned)

Respond only in JSON format like:
{{"category": "Shoes", "brand": "Adidas", "color": "Red", "size": "9", "max_price": 300}}

User input: "{request.message}"
"""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            temperature=0,
            messages=[{"role": "user", "content": prompt}],
        )
        filters = eval(response['choices'][0]['message']['content'])

        db = SessionLocal()
        query = db.query(Product)

        if filters.get("category"):
            query = query.filter(Product.category.ilike(filters["category"]))
        if filters.get("brand"):
            query = query.filter(Product.brand.ilike(filters["brand"]))
        if filters.get("size"):
            query = query.filter(Product.size == filters["size"])
        if filters.get("color"):
            query = query.filter(Product.color.ilike(filters["color"]))
        if filters.get("max_price"):
            query = query.filter(Product.price <= float(filters["max_price"]))

        results = query.all()
        db.close()

        return {
            "filters": filters,
            "results": [r.__dict__ for r in results]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
