from sqlalchemy.orm import Session
from . import models

def get_products(db: Session, filters: dict):
    query = db.query(models.Product)
    
    for key, value in filters.items():
        if hasattr(models.Product, key) and value:
            query = query.filter(getattr(models.Product, key).ilike(f"%{value}%"))
    
    return query.all()
