from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List, Dict
from decimal import Decimal
from app import models, schemas
from app.database import SessionLocal
import time
from datetime import datetime, timedelta
from sqlalchemy import or_

router = APIRouter(
    prefix="/products",
    tags=["Product"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def format_timestamp(timestamp: int) -> str:
    """Format Unix timestamp to human-readable date"""
    return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')

@router.get("/", response_model=List[schemas.Product])
def get_all_products(
    db: Session = Depends(get_db)
):
    """
    Get all products
    """
    products = db.query(models.Product).all()
    return products

@router.get("/recently-purchased", response_model=List[schemas.Product])
def get_recently_purchased(db: Session = Depends(get_db)):
    """
    Get products that were purchased in the last 7 days
    """
    # Calculate timestamp for 7 days ago
    seven_days_ago = int(time.time()) - (7 * 24 * 60 * 60)

    # Get products with recent orders
    recent_products = (
        db.query(models.Product)
        .join(models.OrderProduct, models.Product.product_id == models.OrderProduct.product_id)
        .filter(models.OrderProduct.created_at >= seven_days_ago)
        .group_by(models.Product.product_id)
        .order_by(desc(func.max(models.OrderProduct.created_at)))
        .all()
    )

    return recent_products

@router.get("/best-sellers", response_model=List[schemas.Product])
def get_best_sellers(db: Session = Depends(get_db)):
    """
    Get best selling products for each manufacturer
    """
    # First, get a subquery with the highest sales for each manufacturer
    best_seller_subquery = (
        db.query(
            models.Product.c_manufacturer,
            func.max(models.Product.sales).label('max_sales')
        )
        .filter(models.Product.sales > 0)  # Only consider products with sales
        .group_by(models.Product.c_manufacturer)
        .subquery()
    )

    # Then get the complete product information for these best sellers
    best_sellers = (
        db.query(models.Product)
        .join(
            best_seller_subquery,
            (models.Product.c_manufacturer == best_seller_subquery.c.c_manufacturer) &
            (models.Product.sales == best_seller_subquery.c.max_sales)
        )
        .all()
    )

    return best_sellers

@router.get("/search", response_model=List[schemas.Product])
def search_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    manufacturer: Optional[str] = None,
    type: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Product)
    
    if search:
        # Split search terms and search across multiple fields
        search_terms = search.split()
        for term in search_terms:
            query = query.filter(
                or_(
                    models.Product.name.ilike(f"%{term}%"),
                    models.Product.c_type.ilike(f"%{term}%"),
                    models.Product.c_category.ilike(f"%{term}%"),
                    models.Product.c_manufacturer.ilike(f"%{term}%")
                )
            )
    
    if category:
        query = query.filter(models.Product.c_category.ilike(f"%{category}%"))
    if manufacturer:
        query = query.filter(models.Product.c_manufacturer.ilike(f"%{manufacturer}%"))
    if type:
        query = query.filter(models.Product.c_type.ilike(f"%{type}%"))
    if min_price is not None:
        query = query.filter(models.Product.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)
    
    return query.all()

@router.get("/{product_id}", response_model=schemas.Product)
def get_product_by_id(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific product by its ID
    """
    product = db.query(models.Product).filter(models.Product.product_id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new product
    """
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    product: schemas.ProductUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a product by its ID
    """
    db_product = db.query(models.Product).filter(models.Product.product_id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product.model_dump(exclude_unset=True).items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a product by its ID
    """
    db_product = db.query(models.Product).filter(models.Product.product_id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return None
