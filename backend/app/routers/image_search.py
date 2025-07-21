from fastapi import APIRouter, File, UploadFile, HTTPException, Form
import os
import json
import numpy as np
from PIL import Image
import requests
from pydantic import BaseModel
from typing import Optional
import math
from app.database import db_manager
import io
import base64
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import re
import torch
import torchvision.transforms as transforms
from torchvision.models import resnet50, ResNet50_Weights
import cv2

router = APIRouter(
    prefix="/image-search",
    tags=["Image Search"]
)

product_info = []
data_loaded = False
tfidf_vectorizer = None
product_features = None
image_features = None
model = None
preprocess = None

def clean_value(value):
    """Clean a value to make it JSON-compliant"""
    if value is None:
        return "Unknown"
    elif isinstance(value, (int, float)):
        if math.isnan(value) or math.isinf(value):
            return "Unknown"
        return value
    elif isinstance(value, str):
        return value.strip() if value.strip() else "Unknown"
    else:
        return str(value)

def load_image_model():
    """Load pre-trained ResNet model for feature extraction"""
    global model, preprocess
    
    try:
        model = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
        model.eval()
        
        preprocess = ResNet50_Weights.IMAGENET1K_V2.transforms()
        
        print("Image model loaded successfully")
        return True
    except Exception as e:
        print(f"Error loading image model: {e}")
        return False

def download_image_from_url(url, timeout=10):
    """Download image from URL with error handling"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=timeout, stream=True)
        response.raise_for_status()
        
        image_data = response.content
        
        image = Image.open(io.BytesIO(image_data))
        image.verify()
        
        return image_data
    except Exception as e:
        print(f"Error downloading image from {url}: {e}")
        return None

def extract_image_features(image_data):
    """Extract features from image using ResNet"""
    global model, preprocess
    
    if model is None or preprocess is None:
        return None
    
    try:
        image = Image.open(io.BytesIO(image_data))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        input_tensor = preprocess(image)
        input_batch = input_tensor.unsqueeze(0)
        
        with torch.no_grad():
            features = model.forward(input_batch)
            features = features.squeeze().cpu().numpy()
        
        return features
    except Exception as e:
        print(f"Error extracting image features: {e}")
        return None

def find_similar_images(query_features, num_results=6):
    """Find similar images based on feature similarity"""
    global image_features, product_info
    
    if image_features is None or query_features is None:
        return []
    
    try:
        similarities = cosine_similarity([query_features], image_features).flatten()
        
        top_indices = similarities.argsort()[-num_results:][::-1]
        
        results = []
        for i, idx in enumerate(top_indices):
            if similarities[idx] > 0.1:
                product = product_info[idx]
                results.append({
                    'score': round(float(similarities[idx]), 3),
                    'product_id': product['product_id'],
                    'product_name': product['product_name'],
                    'brand': product['brand'],
                    'price': product['price'],
                    'image_path': product['image_path']
                })
        
        return results
    except Exception as e:
        print(f"Error in image similarity search: {e}")
        return []

def load_database_data(max_products=200):
    """Load data from MySQL database and create search index"""
    global product_info, data_loaded, tfidf_vectorizer, product_features, image_features
    
    print("Loading data from MySQL database...")
    
    try:
        if not db_manager.connect():
            print("Failed to connect to database")
            data_loaded = False
            return
        
        products = db_manager.get_products_with_images(max_products)
        
        if not products:
            print("No products found in database")
            data_loaded = False
            return
        
        product_info = []
        image_features_list = []
        
        print(f"Processing {len(products)} products from database...")
        
        for i, product in enumerate(products):
            image_path = product['image_path']
            if image_path and image_path.strip():
                image_path = image_path.strip()
                
                image_data = download_image_from_url(image_path)
                if image_data:
                    features = extract_image_features(image_data)
                    if features is not None:
                        product_info.append({
                            'product_id': product['product_id'],
                            'product_name': clean_value(product['product_name']),
                            'brand': clean_value(product['brand']),
                            'category': clean_value(product['category']),
                            'price': clean_value(product['price']),
                            'image_path': image_path
                        })
                        image_features_list.append(features)
                        
                        if (i + 1) % 10 == 0:
                            print(f"Processed {i + 1}/{len(products)} products")
        
        print(f"Successfully loaded {len(product_info)} products with image features")
        
        if image_features_list:
            image_features = np.array(image_features_list)
            print(f"Image features shape: {image_features.shape}")
        
        data_loaded = True
        
    except Exception as e:
        print(f"Error loading data from database: {e}")
        import traceback
        traceback.print_exc()
        data_loaded = False

def allowed_file(filename):
    """Check if file extension is allowed"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    """Handle file upload and return similar images"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    try:
        content = await file.read()
        
        query_features = extract_image_features(content)
        
        if query_features is None:
            raise HTTPException(status_code=400, detail="Could not process uploaded image")
        
        results = find_similar_images(query_features, 6)
        
        products_with_scores = []
        for result in results:
            product_data = None
            for product in product_info:
                if product['product_id'] == result['product_id']:
                    product_data = product
                    break
            
            if product_data:
                complete_product = {
                    'product_id': product_data['product_id'],
                    'name': product_data['product_name'],
                    'description': product_data.get('description', ''),
                    'price': product_data['price'],
                    'category': product_data.get('category', ''),
                    'c_manufacturer': product_data['brand'],
                    'c_category': product_data.get('category', ''),
                    'c_type': product_data.get('type', ''),
                    'if_sellable': True,
                    'show_in_store': 1,
                    'status': 1,
                    'sku_name': '',
                    'w_description': '',
                    'w_oem': '',
                    'sales': 0,
                    'manufacturer': product_data['brand'],
                    'product_type': product_data.get('type', ''),
                    'images': [{'image_id': 1, 'image_path': product_data['image_path']}]
                }
                
                products_with_scores.append({
                    'product': complete_product,
                    'similarity_score': result['score'],
                    'match_type': 'image_similarity'
                })
        
        return {
            'image_hash': 'generated_hash',
            'search_type': 'image_similarity',
            'threshold': 0.1,
            'products': products_with_scores,
            'total_results': len(products_with_scores),
            'message': f'Found {len(products_with_scores)} similar products'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in upload: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



def initialize_image_search():
    """Initialize image search functionality"""
    if load_image_model():
        load_database_data(max_products=200)
    else:
        print("Failed to load image model")

def cleanup_image_search():
    """Clean up image search resources"""
    db_manager.disconnect()

