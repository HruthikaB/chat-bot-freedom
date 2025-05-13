from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/products", response_model=list[schemas.Product])
def get_products(
    category: str = None,
    type: str = None,
    size: str = None,
    min_price: float = 0.0,
    max_price: float = 100000.0,
    db: Session = Depends(get_db),
):
    query = db.query(models.Product)
    if category:
        query = query.filter(models.Product.category.ilike(f"%{category}%"))
    if type:
        query = query.filter(models.Product.type.ilike(f"%{type}%"))
    if size:
        query = query.filter(models.Product.size == size)
    query = query.filter(models.Product.price >= min_price, models.Product.price <= max_price)
    return query.all()
