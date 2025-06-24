import random
import time
from sqlalchemy.orm import Session
from app.models import Product, OrderProduct
from app.database import SessionLocal, engine, Base

# Ensure tables are created
Base.metadata.create_all(bind=engine)

def create_sample_orders(n=100):
    """Create sample order data"""
    db: Session = SessionLocal()
    try:
        # Get all product IDs
        products = db.query(Product).all()
        if not products:
            print("No products found in database")
            return
        
        product_ids = [p.product_id for p in products]
        
        # Current timestamp
        current_time = int(time.time())
        # 180 days ago
        days_180_ago = current_time - (180 * 24 * 60 * 60)
        
        # Create random orders
        for i in range(n):
            # Random product
            product_id = random.choice(product_ids)
            # Random order date between now and 180 days ago
            order_date = random.randint(days_180_ago, current_time)
            # Random order ID (simulating orders)
            order_id = random.randint(1000, 9999)
            
            order = OrderProduct(
                product_id=product_id,
                order_id=order_id,
                quantity=random.randint(1, 5),
                created_at=order_date
            )
            db.add(order)
        
        db.commit()
        print(f"✅ Created {n} sample orders")
        
    except Exception as e:
        print(f"Error creating sample orders: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_orders() 