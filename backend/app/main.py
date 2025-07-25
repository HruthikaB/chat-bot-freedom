from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, db_manager
from app.routers import products, llm, voice_search, image_search

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
app.include_router(products.router)
app.include_router(llm.router)
app.include_router(voice_search.router)
app.include_router(image_search.router)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        if db_manager.connect():
            db_manager.ensure_image_features_table_exists()
        else:
            print("Failed to connect to database")
    except Exception as e:
        print(f"Error creating product_image_features table: {e}")
    image_search.initialize_image_search()

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    image_search.cleanup_image_search()
    db_manager.disconnect()

