from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from typing import List, Dict
import numpy as np

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
        self.session = None
    
    def connect(self) -> bool:
        """Establish database session"""
        try:
            self.session = SessionLocal()
            return True
        except Exception as e:
            print(f"Failed to create database session: {e}")
            return False
    
    def disconnect(self):
        """Close database session"""
        if self.session:
            self.session.close()
            self.session = None
    
    def ensure_image_features_table_exists(self) -> bool:
        """Ensure the product_image_features table exists"""
        try:
            check_query = text("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = :db_name 
                AND table_name = 'product_image_features'
            """)
            result = self.session.execute(check_query, {"db_name": DB_NAME})
            table_exists = result.fetchone()[0] > 0
            if not table_exists:
                create_query = text("""
                    CREATE TABLE product_image_features (
                        image_id INT NOT NULL PRIMARY KEY,
                        features LONGBLOB NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (image_id) REFERENCES product_image(image_id)
                    )
                """)
                self.session.execute(create_query)
                self.session.commit()
            return True
        except Exception as e:
            return False

    def get_products_with_images(self) -> List[Dict]:
        """Get all products with their images"""
        try:
            query = text("""
                SELECT 
                    p.product_id,
                    p.name as product_name,
                    p.description,
                    p.price,
                    p.c_category as category,
                    p.c_manufacturer as brand,
                    p.c_type as type,
                    p.c_product_group,
                    p.if_featured,
                    p.if_sellable,
                    p.show_in_store,
                    p.status,
                    p.sku_name,
                    p.w_description,
                    p.w_oem,
                    p.w_weight,
                    p.w_height,
                    p.w_width,
                    p.w_depth,
                    p.sales,
                    p.date_added,
                    pi.image_id,
                    pi.image_path,
                    pi.image_name,
                    pi.image_sort
                FROM product p
                INNER JOIN product_image pi ON p.product_id = pi.product_id
                WHERE pi.image_path IS NOT NULL 
                AND pi.image_path != ''
                AND p.inactive = 0
                AND p.show_in_store = 1
                AND p.if_sellable = 1
                ORDER BY p.product_id, pi.image_sort
            """)
            result = self.session.execute(query)
            rows = result.fetchall()
            products = []
            for row in rows:
                product_id = row.product_id
                image_path = row.image_path
                image_id = row.image_id
                if not image_path or not image_path.strip():
                    continue
                image_path = image_path.strip()
                products.append({
                    'product_id': product_id,
                    'product_name': row.product_name or 'Unknown',
                    'description': row.description or '',
                    'price': float(row.price) if row.price else 0.0,
                    'category': row.category or 'Unknown',
                    'brand': row.brand or 'Unknown',
                    'type': row.type or '',
                    'c_product_group': row.c_product_group or '',
                    'if_featured': bool(row.if_featured) if row.if_featured is not None else False,
                    'if_sellable': bool(row.if_sellable) if row.if_sellable is not None else True,
                    'show_in_store': int(row.show_in_store) if row.show_in_store is not None else 1,
                    'status': int(row.status) if row.status is not None else 0,
                    'sku_name': row.sku_name or '',
                    'w_description': row.w_description or '',
                    'w_oem': row.w_oem or '',
                    'w_weight': str(row.w_weight) if row.w_weight else '',
                    'w_height': str(row.w_height) if row.w_height else '',
                    'w_width': str(row.w_width) if row.w_width else '',
                    'w_depth': str(row.w_depth) if row.w_depth else '',
                    'sales': int(row.sales) if row.sales else 0,
                    'date_added': str(row.date_added) if row.date_added else '',
                    'image_id': image_id,
                    'image_path': image_path,
                    'image_name': row.image_name or '',
                    'image_sort': int(row.image_sort) if row.image_sort else 0
                })
            return products
        except Exception as e:
            print(f"Error getting products with images: {e}")
            return []

    def save_image_features(self, image_id, features: np.ndarray):
        try:
            query = text("""
                INSERT INTO product_image_features (image_id, features)
                VALUES (:image_id, :features)
                ON DUPLICATE KEY UPDATE features = :features
            """)
            self.session.execute(query, {
                "image_id": image_id,
                "features": features.astype(np.float32).tobytes()
            })
            self.session.commit()
            print(f"Successfully saved features for image_id: {image_id}")
        except Exception as e:
            print(f"Error saving image features for image_id {image_id}: {e}")
            self.session.rollback()

    def get_all_image_features(self):
        try:
            query = text("""
                SELECT image_id, features
                FROM product_image_features
            """)
            result = self.session.execute(query)
            rows = result.fetchall()
            features_list = []
            for row in rows:
                try:
                    features = np.frombuffer(row.features, dtype=np.float32)
                    features_list.append({
                        "image_id": row.image_id,
                        "features": features
                    })
                except Exception as e:
                    print(f"Error processing features for image_id {row.image_id}: {e}")
            return features_list
        except Exception as e:
            print(f"Error loading image features: {e}")
            return []

db_manager = DatabaseManager()