from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("MYSQL_PORT", "3306")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class DatabaseManager:
    """Manages database connections and operations for image search"""
    
    def __init__(self):
        self.connection = None
    
    def connect(self) -> bool:
        """Establish database connection"""
        try:
            self.connection = engine.connect()
            return True
        except Exception as e:
            print(f"Failed to connect to database: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
    
    def get_products_with_images(self, limit: int = 200) -> List[Dict]:
        """Get products with their images"""
        try:
            query = text("""
                SELECT 
                    p.product_id,
                    p.name as product_name,
                    p.description,
                    p.price,
                    p.c_category as category,
                    p.c_manufacturer as brand,
                    pi.image_path,
                    pi.image_name
                FROM product p
                INNER JOIN product_image pi ON p.product_id = pi.product_id
                WHERE pi.image_path IS NOT NULL 
                AND pi.image_path != ''
                AND p.inactive = 0
                AND p.show_in_store = 1
                AND p.if_sellable = 1
                ORDER BY p.product_id, pi.image_sort
                LIMIT :limit
            """)
            
            result = self.connection.execute(query, {"limit": limit})
            rows = result.fetchall()
            
            products = {}
            for row in rows:
                product_id = row.product_id
                image_path = row.image_path
                
                if not image_path or not image_path.strip():
                    continue
                
                image_path = image_path.strip()
                
                if product_id not in products:
                    products[product_id] = {
                        'product_id': product_id,
                        'product_name': row.product_name or 'Unknown',
                        'description': row.description or '',
                        'price': float(row.price) if row.price else 0.0,
                        'category': row.category or 'Unknown',
                        'brand': row.brand or 'Unknown',
                        'image_path': image_path,
                        'image_name': row.image_name or ''
                    }
            
            return list(products.values())
            
        except Exception as e:
            print(f"Error getting products with images: {e}")
            return []

db_manager = DatabaseManager()