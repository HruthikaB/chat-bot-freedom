import random
from faker import Faker
from sqlalchemy.orm import Session
from app.models import Product
from app.database import SessionLocal, engine, Base

fake = Faker()

# Ensure tables are created
Base.metadata.create_all(bind=engine)

categories = ["Shoes", "T-Shirts", "Bags", "Jackets"]
types = {
    "Shoes": ["Sneakers", "Boots", "Dress Shoes", "Sandals"],
    "T-Shirts": ["V-Neck", "Crew Neck", "Polo"],
    "Bags": ["Backpack", "Tote", "Messenger"],
    "Jackets": ["Bomber", "Leather", "Puffer"]
}
sizes = ["S", "M", "L", "XL", "6", "7", "8", "9", "10"]
brands = ["Nike", "Adidas", "Puma", "Reebok", "Levi's", "Gucci"]
colors = ["Red", "Blue", "Black", "White", "Green", "Yellow"]

def create_fake_products(n=500):
    db: Session = SessionLocal()
    for _ in range(n):
        category = random.choice(categories)
        product = Product(
            name=fake.catch_phrase(),
            category=category,
            type=random.choice(types[category]),
            size=random.choice(sizes),
            price=round(random.uniform(10, 500), 2),
            brand=random.choice(brands),
            color=random.choice(colors),
            image_url=fake.image_url()
        )
        db.add(product)
    db.commit()
    db.close()
    print(f"✅ {n} fake products inserted successfully.")

if __name__ == "__main__":
    create_fake_products()
