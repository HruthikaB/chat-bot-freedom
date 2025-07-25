from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, not_, func, desc
from typing import List, Optional
from decimal import Decimal
import re
from app import models, schemas
from app.database import SessionLocal
import time
from datetime import datetime, timedelta

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

def parse_logical_query(query: str) -> dict:
    """
     Parse logical query string and return structured filter conditions.
    Supports the following logical operators:
    - SKU1 only: sku='SKU1'
    - SKU1 AND SKU2: sku IN ('SKU1','SKU2')
    - SKU1 OR SKU2: sku='SKU1' OR sku='SKU2'
    - SKU1 in ManufacturerX: sku='SKU1' AND manufacturer='ManufacturerX'
    - SKU1 not in ManufacturerX: sku='SKU1' AND manufacturer!='ManufacturerX'
    - SKU1 AND SKU2 in ManufacturerX: sku IN ('SKU1','SKU2') AND manufacturer='ManufacturerX'
    - SKU1 OR SKU2 in ManufacturerX: (sku='SKU1' OR sku='SKU2') AND manufacturer='ManufacturerX'
    - SKU1 AND SKU2 not in ManufacturerX: sku IN ('SKU1','SKU2') AND manufacturer!='ManufacturerX'
    - SKU1 OR SKU2 not in ManufacturerX: (sku='SKU1' OR sku='SKU2') AND manufacturer!='ManufacturerX'
    - SKU1 in ManufacturerX OR SKU2 in ManufacturerY: (sku='SKU1' AND manufacturer='X') OR (sku='SKU2' AND manufacturer='Y')
    - SKU1, Manufacturer IN (X,Y): sku='SKU1' AND manufacturer IN ('X','Y')
    - SKU1, Manufacturer NOT IN (X,Y): sku='SKU1' AND manufacturer NOT IN ('X','Y')
    - NOT SKU1: sku!='SKU1'
    - NOT (SKU1 or SKU2): sku NOT IN ('SKU1','SKU2')
    - NOT (SKU1 AND ManufacturerX): NOT (sku='SKU1' AND manufacturer='ManufacturerX')
    """
    
    result = {
        'sku_conditions': [],
        'manufacturer_conditions': [],
        'logical_operator': 'AND',
        'negation': False,
        'negation_type': None
    }
    
    original_query = query.strip()
    query = query.strip().upper()
    
    if query.startswith('NOT '):
        result['negation'] = True
        query = query[4:].strip()
        
        if query.startswith('(') and query.endswith(')'):
            query = query[1:-1].strip()
            
            if ' OR ' in query and ' AND ' not in query:
                result['negation_type'] = 'or'
            elif ' AND ' in query and ' IN ' in query:
                result['negation_type'] = 'and'
            elif ' OR ' not in query and ' AND ' not in query:
                result['negation_type'] = 'simple'
        else:
            result['negation_type'] = 'simple'
    
    # Pattern 1: SKU1 only (and Pattern 13: NOT SKU1)
    if re.match(r'^[A-Z0-9_-]+$', query):
        if result['negation'] and result['negation_type'] == 'simple':
            result['sku_conditions'] = [{'operator': '!=', 'values': [query]}]
        else:
            result['sku_conditions'] = [{'operator': '=', 'values': [query]}]
        return result
    
    # Pattern 2: SKU1 AND SKU2 (handles both regular and negated)
    if ' AND ' in query and ' IN ' not in query and ' NOT ' not in query:
        skus = [sku.strip() for sku in query.split(' AND ')]
        if all(re.match(r'^[A-Z0-9_-]+$', sku) for sku in skus):
            if result['negation'] and result['negation_type'] == 'and':
                # NOT (SKU1 AND SKU2) becomes NOT IN (SKU1, SKU2)
                result['sku_conditions'] = [{'operator': 'NOT_IN', 'values': skus}]
            else:
                result['sku_conditions'] = [{'operator': 'IN', 'values': skus}]
            return result
    
    # Pattern 3: SKU1 OR SKU2 (and Pattern 14: NOT (SKU1 OR SKU2))
    if ' OR ' in query and ' IN ' not in query and ' NOT ' not in query:
        skus = [sku.strip() for sku in query.split(' OR ')]
        if all(re.match(r'^[A-Z0-9_-]+$', sku) for sku in skus):
            if result['negation'] and result['negation_type'] == 'or':
                # NOT (SKU1 OR SKU2) becomes NOT IN (SKU1, SKU2)
                result['sku_conditions'] = [{'operator': 'NOT_IN', 'values': skus}]
            else:
                result['sku_conditions'] = [{'operator': 'OR', 'values': skus}]
            return result
    
    # Pattern 4: SKU1 in ManufacturerX
    in_match = re.search(r'^([A-Z0-9_-]+)\s+IN\s+([A-Z0-9\s_-]+)$', query)
    if in_match:
        sku = in_match.group(1)
        manufacturer = in_match.group(2).strip()
        result['sku_conditions'] = [{'operator': '=', 'values': [sku]}]
        result['manufacturer_conditions'] = [{'operator': '=', 'values': [manufacturer]}]
        return result
    
    # Pattern 5: SKU1 not in ManufacturerX
    not_in_match = re.search(r'^([A-Z0-9_-]+)\s+NOT\s+IN\s+([A-Z0-9\s_-]+)$', query)
    if not_in_match:
        sku = not_in_match.group(1)
        manufacturer = not_in_match.group(2).strip()
        result['sku_conditions'] = [{'operator': '=', 'values': [sku]}]
        result['manufacturer_conditions'] = [{'operator': '!=', 'values': [manufacturer]}]
        return result
    
    # Pattern 6: SKU1 AND SKU2 in ManufacturerX
    and_in_match = re.search(r'^([A-Z0-9_-]+)\s+AND\s+([A-Z0-9_-]+)\s+IN\s+([A-Z0-9\s_-]+)$', query)
    if and_in_match:
        sku1 = and_in_match.group(1)
        sku2 = and_in_match.group(2)
        manufacturer = and_in_match.group(3).strip()
        result['sku_conditions'] = [{'operator': 'IN', 'values': [sku1, sku2]}]
        result['manufacturer_conditions'] = [{'operator': '=', 'values': [manufacturer]}]
        return result
    
    # Pattern 7: SKU1 OR SKU2 in ManufacturerX
    or_in_match = re.search(r'^([A-Z0-9_-]+)\s+OR\s+([A-Z0-9_-]+)\s+IN\s+([A-Z0-9\s_-]+)$', query)
    if or_in_match:
        sku1 = or_in_match.group(1)
        sku2 = or_in_match.group(2)
        manufacturer = or_in_match.group(3).strip()
        result['sku_conditions'] = [{'operator': 'OR', 'values': [sku1, sku2]}]
        result['manufacturer_conditions'] = [{'operator': '=', 'values': [manufacturer]}]
        return result
    
    # Pattern 8: SKU1 AND SKU2 not in ManufacturerX
    and_not_in_match = re.search(r'^([A-Z0-9_-]+)\s+AND\s+([A-Z0-9_-]+)\s+NOT\s+IN\s+([A-Z0-9\s_-]+)$', query)
    if and_not_in_match:
        sku1 = and_not_in_match.group(1)
        sku2 = and_not_in_match.group(2)
        manufacturer = and_not_in_match.group(3).strip()
        result['sku_conditions'] = [{'operator': 'IN', 'values': [sku1, sku2]}]
        result['manufacturer_conditions'] = [{'operator': '!=', 'values': [manufacturer]}]
        return result
    
    # Pattern 9: SKU1 OR SKU2 not in ManufacturerX
    or_not_in_match = re.search(r'^([A-Z0-9_-]+)\s+OR\s+([A-Z0-9_-]+)\s+NOT\s+IN\s+([A-Z0-9\s_-]+)$', query)
    if or_not_in_match:
        sku1 = or_not_in_match.group(1)
        sku2 = or_not_in_match.group(2)
        manufacturer = or_not_in_match.group(3).strip()
        result['sku_conditions'] = [{'operator': 'OR', 'values': [sku1, sku2]}]
        result['manufacturer_conditions'] = [{'operator': '!=', 'values': [manufacturer]}]
        return result
    
    # Pattern 10: SKU1 in ManufacturerX OR SKU2 in ManufacturerY
    complex_or_match = re.search(r'^([A-Z0-9_-]+)\s+IN\s+([A-Z0-9\s_-]+)\s+OR\s+([A-Z0-9_-]+)\s+IN\s+([A-Z0-9\s_-]+)$', query)
    if complex_or_match:
        result['logical_operator'] = 'OR'
        result['sku_conditions'] = [
            {'operator': '=', 'values': [complex_or_match.group(1)]},
            {'operator': '=', 'values': [complex_or_match.group(3)]}
        ]
        result['manufacturer_conditions'] = [
            {'operator': '=', 'values': [complex_or_match.group(2).strip()]},
            {'operator': '=', 'values': [complex_or_match.group(4).strip()]}
        ]
        return result
    
    # Pattern 11: SKU1, Manufacturer IN (X,Y)
    in_list_match = re.search(r'^([A-Z0-9_-]+),\s*MANUFACTURER\s+IN\s+\(([A-Z0-9\s,_-]+)\)$', query)
    if in_list_match:
        sku = in_list_match.group(1)
        manufacturers = [m.strip() for m in in_list_match.group(2).split(',')]
        result['sku_conditions'] = [{'operator': '=', 'values': [sku]}]
        result['manufacturer_conditions'] = [{'operator': 'IN', 'values': manufacturers}]
        return result
    
    # Pattern 12: SKU1, Manufacturer NOT IN (X,Y)
    not_in_list_match = re.search(r'^([A-Z0-9_-]+),\s*MANUFACTURER\s+NOT\s+IN\s+\(([A-Z0-9\s,_-]+)\)$', query)
    if not_in_list_match:
        sku = not_in_list_match.group(1)
        manufacturers = [m.strip() for m in not_in_list_match.group(2).split(',')]
        result['sku_conditions'] = [{'operator': '=', 'values': [sku]}]
        result['manufacturer_conditions'] = [{'operator': 'NOT_IN', 'values': manufacturers}]
        return result
    
    # Pattern 15: NOT (SKU1 AND ManufacturerX) - handle this special case
    if result['negation'] and result['negation_type'] == 'and':
        and_manufacturer_match = re.search(r'^([A-Z0-9_-]+)\s+AND\s+([A-Z0-9\s_-]+)$', query)
        if and_manufacturer_match:
            sku = and_manufacturer_match.group(1)
            manufacturer = and_manufacturer_match.group(2).strip()
            # For NOT (SKU1 AND ManufacturerX), we want records where NOT (sku=SKU1 AND manufacturer=ManufacturerX)
            # This means: sku!=SKU1 OR manufacturer!=ManufacturerX
            result['sku_conditions'] = [{'operator': '!=', 'values': [sku]}]
            result['manufacturer_conditions'] = [{'operator': '!=', 'values': [manufacturer]}]
            result['logical_operator'] = 'OR'  # Important: OR for negated AND
            return result
    
    # If no pattern matches, treat as simple text search
    result['text_search'] = original_query
    return result

def apply_logical_filters(query, conditions: dict):
    """
    Apply logical filters to SQLAlchemy query based on parsed conditions
    """
    if not conditions:
        return query
    
    # Handle text search
    if 'text_search' in conditions:
        search_term = conditions['text_search']
        query = query.filter(
            or_(
                models.Product.name.ilike(f"%{search_term}%"),
                models.Product.sku_name.ilike(f"%{search_term}%"),
                models.Product.c_manufacturer.ilike(f"%{search_term}%"),
                models.Product.c_category.ilike(f"%{search_term}%"),
                models.Product.c_type.ilike(f"%{search_term}%"),
                models.Product.w_oem.ilike(f"%{search_term}%"),
                models.Product.w_sku_category.ilike(f"%{search_term}%"),
                models.Product.w_primary_category.ilike(f"%{search_term}%"),
                models.Product.w_subcategory.ilike(f"%{search_term}%"),
                models.Product.w_oem_new_pn.ilike(f"%{search_term}%"),
                models.Product.w_oem_repair_pn.ilike(f"%{search_term}%"),
                models.Product.w_freedom_new_pn.ilike(f"%{search_term}%"),
                models.Product.w_freedom_repair_pn.ilike(f"%{search_term}%")
            )
        )
        return query
    
    # Build filter conditions
    sku_filters = []
    manufacturer_filters = []
    
    # Process SKU conditions
    for condition in conditions.get('sku_conditions', []):
        operator = condition['operator']
        values = condition['values']
        
        if operator == '=':
            sku_filters.append(models.Product.sku_name == values[0])
        elif operator == '!=':
            sku_filters.append(models.Product.sku_name != values[0])
        elif operator == 'IN':
            sku_filters.append(models.Product.sku_name.in_(values))
        elif operator == 'NOT_IN':
            sku_filters.append(~models.Product.sku_name.in_(values))
        elif operator == 'OR':
            or_conditions = [models.Product.sku_name == value for value in values]
            sku_filters.append(or_(*or_conditions))
    
    # Process manufacturer conditions
    for condition in conditions.get('manufacturer_conditions', []):
        operator = condition['operator']
        values = condition['values']
        
        if operator == '=':
            manufacturer_filters.append(models.Product.c_manufacturer == values[0])
        elif operator == '!=':
            manufacturer_filters.append(models.Product.c_manufacturer != values[0])
        elif operator == 'IN':
            manufacturer_filters.append(models.Product.c_manufacturer.in_(values))
        elif operator == 'NOT_IN':
            manufacturer_filters.append(~models.Product.c_manufacturer.in_(values))
    
    # Apply filters based on logical operator
    if conditions.get('logical_operator') == 'OR':
        if len(sku_filters) == 2 and len(manufacturer_filters) == 2:
            # Pattern 10: (SKU1 AND Manufacturer1) OR (SKU2 AND Manufacturer2)
            combined_filters = [
                and_(sku_filters[0], manufacturer_filters[0]),
                and_(sku_filters[1], manufacturer_filters[1])
            ]
            query = query.filter(or_(*combined_filters))
        elif len(sku_filters) == 1 and len(manufacturer_filters) == 1:
            # Pattern 15: NOT (SKU1 AND ManufacturerX) = (sku!=SKU1 OR manufacturer!=ManufacturerX)
            query = query.filter(or_(sku_filters[0], manufacturer_filters[0]))
        else:
            # Simple OR for SKUs or manufacturers
            all_filters = sku_filters + manufacturer_filters
            if all_filters:
                query = query.filter(or_(*all_filters))
    else:
        # Default AND operation
        all_filters = sku_filters + manufacturer_filters
        if all_filters:
            query = query.filter(and_(*all_filters))
    
    return query

@router.get("/", response_model=dict)
def get_all_products(
    db: Session = Depends(get_db)
):
    """
    Get all active, sellable products that are shown in store
    """
    products = (
        db.query(models.Product)
        .filter(
            and_(
                models.Product.inactive == 0,
                models.Product.show_in_store == 1,
                models.Product.if_sellable == 1
            )
        )
        .all()
    )
    total_results = len(products)
    message = f"Found {total_results} products."
    products_data = [schemas.Product.model_validate(p).model_dump() for p in products]
    return {"products": products_data, "total_results": total_results, "message": message}

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
        .filter(
            and_(
                models.Product.inactive == 0,
                models.Product.show_in_store == 1,
                models.Product.if_sellable == 1,
                models.OrderProduct.created_at >= seven_days_ago
            )
        )
        .group_by(models.Product.product_id)
        .order_by(desc(func.max(models.OrderProduct.created_at)))
        .all()
    )

    return recent_products

@router.get("/recently-shipped", response_model=List[schemas.Product])
def get_recently_shipped(db: Session = Depends(get_db)):
    """
    Get products that were shipped in the last 7 days
    """
    seven_days_ago = int(time.time()) - (7 * 24 * 60 * 60)

    recent_shipped_products = (
        db.query(models.Product)
        .join(models.ShipmentProduct, models.Product.product_id == models.ShipmentProduct.product_id)
        .filter(
            and_(
                models.Product.inactive == 0,
                models.Product.show_in_store == 1,
                models.Product.if_sellable == 1,
                models.ShipmentProduct.created_at >= seven_days_ago
            )
        )
        .group_by(models.Product.product_id)
        .order_by(desc(func.max(models.ShipmentProduct.created_at)))
        .all()
    )
    return recent_shipped_products

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
        .filter(
            and_(
                models.Product.inactive == 0,
                models.Product.show_in_store == 1,
                models.Product.if_sellable == 1,
                models.Product.sales > 0  # Only consider products with sales
            )
        )
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
        .filter(
            and_(
                models.Product.inactive == 0,
                models.Product.show_in_store == 1,
                models.Product.if_sellable == 1
            )
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
    query = (
        db.query(models.Product)
        .filter(
            and_(
                models.Product.inactive == 0,
                models.Product.show_in_store == 1,
                models.Product.if_sellable == 1
            )
        )
    )
    
    if search:
        try:
            # Try to parse as logical query first
            conditions = parse_logical_query(search)
            query = apply_logical_filters(query, conditions)
        except Exception:
            # Fallback to simple text search
            search_terms = search.split()
            for term in search_terms:
                query = query.filter(
                    or_(
                        models.Product.name.ilike(f"%{term}%"),
                        models.Product.sku_name.ilike(f"%{term}%"),
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

@router.get("/suggestions", response_model=List[str])
def get_product_suggestions(
    query: str,
    db: Session = Depends(get_db)
):
    """
    Get product name suggestions based on logical query operators.
    Supports complex logical expressions for advanced filtering.
    """
    try:
        # Parse the logical query
        conditions = parse_logical_query(query)
        # If the query is a simple keyword (not logical), search all relevant columns
        if not any(op in query.upper() for op in ["AND", "OR", "IN", "NOT", "(", ")"]):
            suggestions = (
                db.query(models.Product.name)
                .filter(
                    and_(
                        models.Product.inactive == 0,
                        models.Product.show_in_store == 1,
                        models.Product.if_sellable == 1,
                        or_(
                            models.Product.name.ilike(f"%{query}%"),
                            models.Product.description.ilike(f"%{query}%"),
                            models.Product.meta_description.ilike(f"%{query}%"),
                            models.Product.meta_keyword.ilike(f"%{query}%"),
                            models.Product.tag.ilike(f"%{query}%"),
                            models.Product.sku_name.ilike(f"%{query}%")
                        )
                    )
                )
                .order_by(models.Product.sales.desc(), models.Product.name)
                .limit(10)
                .all()
            )
            return [name for (name,) in suggestions]
        # Otherwise, use logical parsing and filters
        base_query = (
            db.query(models.Product.name)
            .filter(
                and_(
                    models.Product.inactive == 0,
                    models.Product.show_in_store == 1,
                    models.Product.if_sellable == 1
                )
            )
        )
        filtered_query = apply_logical_filters(base_query, conditions)
        suggestions = (
            filtered_query
            .order_by(models.Product.sales.desc(), models.Product.name)
            .limit(10)
            .all()
        )
        return [name for (name,) in suggestions]
    except Exception as e:
        # Fallback: search all relevant columns
        suggestions = (
            db.query(models.Product.name)
            .filter(
                and_(
                    models.Product.inactive == 0,
                    models.Product.show_in_store == 1,
                    models.Product.if_sellable == 1,
                    or_(
                        models.Product.name.ilike(f"%{query}%"),
                        models.Product.description.ilike(f"%{query}%"),
                        models.Product.meta_description.ilike(f"%{query}%"),
                        models.Product.meta_keyword.ilike(f"%{query}%"),
                        models.Product.tag.ilike(f"%{query}%"),
                        models.Product.sku_name.ilike(f"%{query}%")
                    )
                )
            )
            .order_by(models.Product.sales.desc(), models.Product.name)
            .limit(10)
            .all()
        )
        return [name for (name,) in suggestions]

@router.get("/suggestions-detailed", response_model=List[schemas.Product])
def get_detailed_product_suggestions(
    query: str,
    limit: Optional[int] = 10,
    db: Session = Depends(get_db)
):
    """
    Get detailed product suggestions based on logical query operators.
    Returns full product information for advanced filtering.
    """
    try:
        # Parse the logical query
        conditions = parse_logical_query(query)
        # If the query is a simple keyword (not logical), search all relevant columns
        if not any(op in query.upper() for op in ["AND", "OR", "IN", "NOT", "(", ")"]):
            suggestions = (
                db.query(models.Product)
                .filter(
                    and_(
                        models.Product.inactive == 0,
                        models.Product.show_in_store == 1,
                        models.Product.if_sellable == 1,
                        or_(
                            models.Product.name.ilike(f"%{query}%"),
                            models.Product.description.ilike(f"%{query}%"),
                            models.Product.meta_description.ilike(f"%{query}%"),
                            models.Product.meta_keyword.ilike(f"%{query}%"),
                            models.Product.tag.ilike(f"%{query}%"),
                            models.Product.sku_name.ilike(f"%{query}%")
                        )
                    )
                )
                .order_by(models.Product.sales.desc(), models.Product.name)
                .limit(limit)
                .all()
            )
            return suggestions
        # Otherwise, use logical parsing and filters
        base_query = (
            db.query(models.Product)
            .filter(
                and_(
                    models.Product.inactive == 0,
                    models.Product.show_in_store == 1,
                    models.Product.if_sellable == 1
                )
            )
        )
        filtered_query = apply_logical_filters(base_query, conditions)
        suggestions = (
            filtered_query
            .order_by(models.Product.sales.desc(), models.Product.name)
            .limit(limit)
            .all()
        )
        return suggestions
    except Exception as e:
        # Fallback: search all relevant columns
        suggestions = (
            db.query(models.Product)
            .filter(
                and_(
                    models.Product.inactive == 0,
                    models.Product.show_in_store == 1,
                    models.Product.if_sellable == 1,
                    or_(
                        models.Product.name.ilike(f"%{query}%"),
                        models.Product.description.ilike(f"%{query}%"),
                        models.Product.meta_description.ilike(f"%{query}%"),
                        models.Product.meta_keyword.ilike(f"%{query}%"),
                        models.Product.tag.ilike(f"%{query}%"),
                        models.Product.sku_name.ilike(f"%{query}%")
                    )
                )
            )
            .order_by(models.Product.sales.desc(), models.Product.name)
            .limit(limit)
            .all()
        )
        return suggestions

@router.get("/advanced-search", response_model=List[schemas.Product])
def advanced_search_products(
    query: str,
    limit: Optional[int] = 50,
    db: Session = Depends(get_db)
):
    """
    Advanced search endpoint that supports all 15 logical operators.
    Examples:
    - "SKU1" - Find products with specific SKU
    - "SKU1 AND SKU2" - Find products with either SKU (treated as IN)
    - "SKU1 OR SKU2" - Find products with either SKU
    - "SKU1 IN ManufacturerX" - Find SKU1 from specific manufacturer
    - "SKU1 NOT IN ManufacturerX" - Find SKU1 not from specific manufacturer
    - "SKU1 AND SKU2 IN ManufacturerX" - Find both SKUs from manufacturer
    - "SKU1 OR SKU2 IN ManufacturerX" - Find either SKU from manufacturer
    - "SKU1 AND SKU2 NOT IN ManufacturerX" - Find both SKUs not from manufacturer
    - "SKU1 OR SKU2 NOT IN ManufacturerX" - Find either SKU not from manufacturer
    - "SKU1 in ManufacturerX OR SKU2 in ManufacturerY" - Complex OR condition
    - "SKU1, Manufacturer IN (X,Y)" - SKU1 from multiple manufacturers
    - "SKU1, Manufacturer NOT IN (X,Y)" - SKU1 not from multiple manufacturers
    - "NOT SKU1" - Exclude specific SKU
    - "NOT (SKU1 OR SKU2)" - Exclude multiple SKUs
    - "NOT (SKU1 AND ManufacturerX)" - Complex negation
    """
    try:
        # Parse the logical query
        conditions = parse_logical_query(query)
        
        # Start with base query
        base_query = (
            db.query(models.Product)
            .filter(
                and_(
                    models.Product.inactive == 0,
                    models.Product.show_in_store == 1,
                    models.Product.if_sellable == 1
                )
            )
        )
        
        # Apply logical filters
        filtered_query = apply_logical_filters(base_query, conditions)
        
        # Get results with ordering and limit
        products = (
            filtered_query
            .order_by(models.Product.sales.desc(), models.Product.name)
            .limit(limit)
            .all()
        )
        
        return products
        
    except Exception as e:
        # Fallback to simple text search if parsing fails
        products = (
            db.query(models.Product)
            .filter(
                and_(
                    models.Product.inactive == 0,
                    models.Product.show_in_store == 1,
                    models.Product.if_sellable == 1,
                    or_(
                        models.Product.name.ilike(f"%{query}%"),
                        models.Product.description.ilike(f"%{query}%"),
                        models.Product.meta_description.ilike(f"%{query}%"),
                        models.Product.meta_keyword.ilike(f"%{query}%"),
                        models.Product.tag.ilike(f"%{query}%"),
                        models.Product.sku_name.ilike(f"%{query}%")
                    )
                )
            )
            .order_by(models.Product.sales.desc(), models.Product.name)
            .limit(limit)
            .all()
        )
        return products

@router.get("/{product_id}", response_model=schemas.Product)
def get_product_by_id(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific product by its ID (only if active, sellable, and shown in store)
    """
    product = (
        db.query(models.Product)
        .filter(
            and_(
                models.Product.product_id == product_id,
                models.Product.inactive == 0,
                models.Product.show_in_store == 1,
                models.Product.if_sellable == 1
            )
        )
        .first()
    )
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