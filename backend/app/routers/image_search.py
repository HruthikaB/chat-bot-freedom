from fastapi import APIRouter, File, UploadFile, HTTPException
import numpy as np
from PIL import Image
import requests
import math
from app.database import db_manager
import io
from sklearn.metrics.pairwise import cosine_similarity
import torch
from torchvision.models import resnet50, ResNet50_Weights

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
        
        return True
    except Exception as e:
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
        return None

def find_similar_images(query_features):
    """Find all exact similar images based on feature similarity"""
    global image_features, product_info
    
    if image_features is None or query_features is None:
        return []
    
    try:
        similarities = cosine_similarity([query_features], image_features).flatten()
        
        sorted_indices = similarities.argsort()[::-1]
        
        best_scores = {}
        best_indices = {}
        
        for idx in sorted_indices:
            similarity_score = similarities[idx]
            if similarity_score > 0.8:
                product = product_info[idx]
                product_id = product['product_id']
                
                if product_id not in best_scores or similarity_score > best_scores[product_id]:
                    best_scores[product_id] = similarity_score
                    best_indices[product_id] = idx
        
        results = []
        for product_id, best_score in best_scores.items():
            best_idx = best_indices[product_id]
            product = product_info[best_idx]
            results.append({
                'score': round(float(best_score), 3),
                'product_id': product_id,
                'product_name': product['product_name'],
                'brand': product['brand'],
                'price': product['price'],
                'image_path': product['image_path']
            })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return results
    except Exception as e:
        return []

def load_database_data():
    """Load data from MySQL database and create search index using DB-stored features"""
    global product_info, data_loaded, image_features
    try:
        if not db_manager.connect():
            data_loaded = False
            return
        products = db_manager.get_products_with_images()
        if not products:
            data_loaded = False
            return
        
        image_to_product = {}
        for product in products:
            image_id = product['image_id']
            image_to_product[image_id] = product
                
        features_records = db_manager.get_all_image_features()
        existing_ids = {rec['image_id'] for rec in features_records}
        features_extracted = 0
        for product in products:
            image_id = product['image_id']
            image_path = product['image_path']
            if image_id not in existing_ids:
                image_data = download_image_from_url(image_path)
                if image_data:
                    features = extract_image_features(image_data)
                    if features is not None:
                        db_manager.save_image_features(image_id, features)
        features_records = db_manager.get_all_image_features()
        
        if not features_records:
            print("No features in database, trying fallback approach...")
            features_records = []
            for product in products[:10]:  # Limit to first 10 for testing
                image_id = product['image_id']
                image_path = product['image_path']
                print(f"Fallback: Extracting features for image_id: {image_id}")
                image_data = download_image_from_url(image_path)
                if image_data:
                    features = extract_image_features(image_data)
                    if features is not None:
                        features_records.append({
                            "image_id": image_id,
                            "features": features
                        })
                        print(f"Fallback: Extracted features for image_id: {image_id}")
        
        product_info = []
        image_features_list = []
        seen_product_ids = set()
        
        for rec in features_records:
            image_id = rec["image_id"]
            
            product_data = image_to_product.get(image_id)
            if product_data:
                product_info.append({
                    "image_id": image_id,
                    "product_id": product_data['product_id'],
                    "product_name": product_data['product_name'],
                    "description": product_data['description'],
                    "price": product_data['price'],
                    "category": product_data['category'],
                    "brand": product_data['brand'],
                    "type": product_data['type'],
                    "c_product_group": product_data['c_product_group'],
                    "if_featured": product_data['if_featured'],
                    "if_sellable": product_data['if_sellable'],
                    "show_in_store": product_data['show_in_store'],
                    "status": product_data['status'],
                    "sku_name": product_data['sku_name'],
                    "w_description": product_data['w_description'],
                    "w_oem": product_data['w_oem'],
                    "w_weight": product_data['w_weight'],
                    "w_height": product_data['w_height'],
                    "w_width": product_data['w_width'],
                    "w_depth": product_data['w_depth'],
                    "sales": product_data['sales'],
                    "date_added": product_data['date_added'],
                    "image_path": product_data['image_path'],
                    "image_name": product_data['image_name'],
                    "image_sort": product_data['image_sort']
                })
                image_features_list.append(rec["features"])
                seen_product_ids.add(product_data['product_id'])  # Debug: track unique products
            else:
                print(f"Warning: No product data found for image_id: {image_id}")
        
        if image_features_list:
            image_features = np.stack(image_features_list)
            data_loaded = True
        else:
            image_features = None
            data_loaded = False
            print("No image features loaded")
            
    except Exception as e:
        import traceback
        print(f"Error in load_database_data: {e}")
        traceback.print_exc()
        data_loaded = False

def allowed_file(filename):
    """Check if file extension is allowed"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    """Handle file upload and return exact image matches"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    try:
        content = await file.read()
        
        query_features = extract_image_features(content)
        
        if query_features is None:
            raise HTTPException(status_code=400, detail="Could not process uploaded image")
        
        results = find_similar_images(query_features)
        
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
                    'meta_description': product_data.get('sku_name', ''),
                    'meta_keyword': product_data.get('sku_name', ''),
                    'tag': product_data.get('sku_name', ''),
                    'product_type': product_data.get('type', ''),
                    'price': str(product_data['price']),
                    'c_type': product_data.get('type', ''),
                    'c_category': product_data.get('category', ''),
                    'c_manufacturer': product_data.get('brand', ''),
                    'c_product_group': product_data.get('c_product_group', ''),
                    'if_featured': product_data.get('if_featured', False),
                    'if_sellable': product_data.get('if_sellable', True),
                    'show_in_store': product_data.get('show_in_store', 1),
                    'status': product_data.get('status', 0),
                    'sku_name': product_data.get('sku_name', ''),
                    'w_description': product_data.get('w_description', ''),
                    'w_oem': product_data.get('w_oem', ''),
                    'w_weight': product_data.get('w_weight', ''),
                    'w_height': product_data.get('w_height', ''),
                    'w_width': product_data.get('w_width', ''),
                    'w_depth': product_data.get('w_depth', ''),
                    'sales': product_data.get('sales', 0),
                    'date_added': product_data.get('date_added', ''),
                    'images': [{
                        'image_id': product_data['image_id'],
                        'image_name': product_data['image_name'],
                        'image_path': product_data['image_path'],
                        'image_sort': product_data.get('image_sort', 0),
                        'product_id': product_data['product_id']
                    }]
                }
                
                products_with_scores.append({
                    'product': complete_product,
                    'similarity_score': result['score'],
                    'match_type': 'exact_image_match'
                })
        
        return {
            'image_hash': 'generated_hash',
            'search_type': 'exact_image_match',
            'threshold': 0.8,
            'products': products_with_scores,
            'total_results': len(products_with_scores),
            'message': f'Found {len(products_with_scores)} exact image matches'
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
        load_database_data()
    else:
        print("Failed to load image model")

def cleanup_image_search():
    """Clean up image search resources"""
    db_manager.disconnect()

