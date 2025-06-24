from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from typing import List, Optional, Dict, Any
import openai
import os
import json
import re
from decimal import Decimal

from app.database import get_db
from app.models import Product
from app.schemas import Product as ProductSchema

openai.api_key = os.getenv("OPENAI_API_KEY")

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    user_message: str
    generated_sql: str
    products: List[ProductSchema]
    total_count: int
    ai_response: str

def get_table_schema(db: Session) -> str:
    """Get the table schema for context"""
    inspector = inspect(db.bind)
    
    # Get table name - assuming it's 'products' or similar
    table_name = Product.__tablename__
    columns = inspector.get_columns(table_name)
    
    schema_info = f"Table: {table_name}\nColumns:\n"
    for column in columns:
        col_type = str(column['type'])
        nullable = "NULL" if column['nullable'] else "NOT NULL"
        schema_info += f"  - {column['name']}: {col_type} {nullable}\n"
    
    return schema_info

def generate_sql_with_llm(user_message: str, db: Session) -> str:
    """Use OpenAI to generate SQL query from user message"""
    
    # Get table schema for context
    schema_info = get_table_schema(db)
    
    system_prompt = f"""
    You are a SQL query generator for a product database. Generate safe, read-only SELECT queries based on user requests.
    
    {schema_info}
    
    Important guidelines:
    1. ONLY generate SELECT queries - no INSERT, UPDATE, DELETE, DROP, etc.
    2. Use proper SQL syntax for MySQL
    3. Use LIKE with % wildcards for text searches (case-insensitive)
    4. Use appropriate WHERE conditions based on user intent
    5. Limit results to 50 rows maximum using LIMIT clause
    6. Use proper column names as shown in the schema
    7. Handle price ranges with BETWEEN or >= / <= operators
    8. For boolean fields, use 1 for true, 0 for false
    9. Use OR conditions for multiple keywords in text searches
    10. Always include relevant columns in SELECT (id, name, price, etc.)
    
    Common column mappings:
    - Product name: name
    - Category: c_category
    - Manufacturer/Brand: c_manufacturer
    - Price: price
    - Description: description or w_description
    - Product type: product_type
    - Product group: c_product_group
    - SKU: sku_name
    - Featured: if_featured (1 or 0)
    - Sellable: if_sellable (1 or 0)
    - Availability: product_availability
    - OEM: w_oem
    
    Examples:
    "Show me laptops under $1000" -> 
    SELECT * FROM products WHERE (name LIKE '%laptop%' OR c_category LIKE '%laptop%') AND price <= 1000 LIMIT 50;
    
    "Dell gaming computers" ->
    SELECT * FROM products WHERE c_manufacturer LIKE '%Dell%' AND (name LIKE '%gaming%' OR description LIKE '%gaming%') LIMIT 50;
    
    "Featured products" ->
    SELECT * FROM products WHERE if_featured = 1 LIMIT 50;
    
    "Printers between $100 and $500" ->
    SELECT * FROM products WHERE (name LIKE '%printer%' OR c_category LIKE '%printer%') AND price BETWEEN 100 AND 500 LIMIT 50;
    
    Return ONLY the SQL query, no explanation or markdown formatting.
    """
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate SQL query for: {user_message}"}
            ],
            temperature=0.1,
            max_tokens=300
        )
        
        sql_query = response.choices[0].message.content.strip()
        
        # Clean up the response
        sql_query = sql_query.replace("```sql", "").replace("```", "").strip()
        
        # Validate it's a SELECT query
        if not sql_query.upper().startswith('SELECT'):
            raise ValueError("Generated query is not a SELECT statement")
        
        # Ensure it has a LIMIT clause
        if 'LIMIT' not in sql_query.upper():
            sql_query += ' LIMIT 50'
        
        return sql_query
        
    except Exception as e:
        print(f"SQL generation error: {e}")
        # Fallback to simple query
        return generate_fallback_sql(user_message)

def generate_fallback_sql(user_message: str) -> str:
    """Generate a simple fallback SQL query"""
    # Extract potential keywords
    keywords = extract_keywords_fallback(user_message)
    
    if not keywords:
        return "SELECT * FROM products LIMIT 50"
    
    # Build a simple search query
    conditions = []
    for keyword in keywords[:3]:  # Limit to 3 keywords
        condition = f"(name LIKE '%{keyword}%' OR c_category LIKE '%{keyword}%' OR description LIKE '%{keyword}%')"
        conditions.append(condition)
    
    where_clause = " OR ".join(conditions)
    return f"SELECT * FROM products WHERE {where_clause} LIMIT 50"

def extract_keywords_fallback(user_message: str) -> List[str]:
    """Fallback keyword extraction using regex"""
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'show', 'me', 'find', 'get', 'search'}
    words = re.findall(r'\b\w+\b', user_message.lower())
    keywords = [word for word in words if word not in stop_words and len(word) > 2]
    return keywords[:5]

def execute_sql_query(db: Session, sql_query: str) -> List[Dict]:
    """Execute the generated SQL query safely"""
    try:
        # Execute the query
        result = db.execute(text(sql_query))
        
        # Get column names
        columns = result.keys()
        
        # Fetch all rows and convert to dict
        rows = result.fetchall()
        
        # Convert rows to list of dictionaries
        products_data = []
        for row in rows:
            product_dict = {}
            for i, column in enumerate(columns):
                value = row[i]
                # Handle Decimal conversion for JSON serialization
                if isinstance(value, Decimal):
                    value = float(value)
                product_dict[column] = value
            products_data.append(product_dict)
        
        return products_data
        
    except Exception as e:
        print(f"SQL execution error: {e}")
        raise HTTPException(status_code=400, detail=f"SQL execution failed: {str(e)}")

def convert_to_product_objects(products_data: List[Dict]) -> List[Product]:
    """Convert dictionary data to Product objects for schema validation"""
    products = []
    for data in products_data:
        try:
            # Create Product object from dictionary
            # Handle cases where some fields might be missing
            product = Product()
            
            # Map common fields
            for key, value in data.items():
                if hasattr(product, key):
                    setattr(product, key, value)
            
            products.append(product)
        except Exception as e:
            print(f"Error converting product data: {e}")
            continue
    
    return products

def generate_ai_response_from_sql(user_message: str, sql_query: str, products_data: List[Dict]) -> str:
    """Generate a natural language response about the SQL search results"""
    
    if not products_data:
        return f"I couldn't find any products matching '{user_message}'. The generated SQL query returned no results."
    
    # Create a summary of results
    product_summary = []
    for i, product in enumerate(products_data[:3]):  # Show top 3 results
        name = product.get('name', 'Unknown Product')
        price = product.get('price')
        price_str = f"${price}" if price else "Price not available"
        
        summary = f"- {name} ({price_str})"
        
        manufacturer = product.get('c_manufacturer')
        if manufacturer:
            summary += f" by {manufacturer}"
        
        product_summary.append(summary)
    
    response = f"Found {len(products_data)} products matching '{user_message}':\n\n"
    response += "\n".join(product_summary)
    
    if len(products_data) > 3:
        response += f"\n\n... and {len(products_data) - 3} more products."
    
    response += f"\n\nGenerated SQL: {sql_query}"
    
    return response

@router.post("/chat", response_model=ChatResponse)
def chat_with_bot(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Enhanced chat endpoint with OpenAI-generated SQL queries
    """
    try:
        # Generate SQL query using OpenAI
        sql_query = generate_sql_with_llm(request.message, db)
        
        # Execute the SQL query
        products_data = execute_sql_query(db, sql_query)
        
        # Convert to Product objects for response schema
        products = convert_to_product_objects(products_data)
        
        # Generate AI response
        ai_response = generate_ai_response_from_sql(request.message, sql_query, products_data)
        
        return ChatResponse(
            user_message=request.message,
            generated_sql=sql_query,
            products=products,
            total_count=len(products_data),
            ai_response=ai_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")