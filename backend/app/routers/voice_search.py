from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
import speech_recognition as sr
from pydub import AudioSegment
import io
import tempfile
import os
import re
from app import models, schemas
from app.database import SessionLocal
from app.routers.products import apply_logical_filters, parse_logical_query

router = APIRouter(
    prefix="/voice-search",
    tags=["Voice Search"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def convert_audio_to_text(audio_file: UploadFile) -> str:
    """
    Convert uploaded audio file to text using Google Speech Recognition
    Supports multiple audio formats: WAV, MP3, M4A, FLAC, etc.
    """
    try:
        audio_data = audio_file.file.read()
        
        content_type = audio_file.content_type or ""
        filename = audio_file.filename or ""
        
        extension_map = {
            'audio/mpeg': '.mp3',
            'audio/mp3': '.mp3',
            'audio/wav': '.wav',
            'audio/x-wav': '.wav',
            'audio/flac': '.flac',
            'audio/x-flac': '.flac',
            'audio/mp4': '.m4a',
            'audio/x-m4a': '.m4a',
            'audio/ogg': '.ogg',
            'audio/webm': '.webm'
        }
        
        extension = extension_map.get(content_type, '.wav')
        
        if extension == '.wav' and filename:
            if filename.lower().endswith('.mp3'):
                extension = '.mp3'
            elif filename.lower().endswith('.m4a'):
                extension = '.m4a'
            elif filename.lower().endswith('.flac'):
                extension = '.flac'
            elif filename.lower().endswith('.ogg'):
                extension = '.ogg'
            elif filename.lower().endswith('.webm'):
                extension = '.webm'
        
        print(f"Processing audio file: {filename}, content_type: {content_type}, extension: {extension}")
        print(f"File size: {len(audio_data)} bytes")
        
        if len(audio_data) < 1000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio file is too small. Please ensure the file contains valid audio data."
            )
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
        
        try:
            recognizer = sr.Recognizer()
            
            recognizer.energy_threshold = 100
            recognizer.dynamic_energy_threshold = False
            recognizer.pause_threshold = 0.8
            recognizer.non_speaking_duration = 0.5
            
            audio = None
            
            try:
                with sr.AudioFile(temp_file_path) as source:
                    recognizer.adjust_for_ambient_noise(source, duration=0.1)
                    audio = recognizer.record(source)
                    print("Successfully loaded audio directly as WAV")
            except Exception as e:
                print(f"Direct WAV loading failed: {e}")
                
                try:
                    print("Attempting to convert audio using pydub...")
                    
                    audio_segment = AudioSegment.from_file(temp_file_path)
                    print(f"Successfully loaded audio with pydub, duration: {len(audio_segment)}ms")
                    
                    audio_segment = audio_segment.normalize()
                    
                    if len(audio_segment) < 2000:
                        print(f"Audio is very short ({len(audio_segment)}ms), adding silence")
                        silence = AudioSegment.silent(duration=1000)
                        audio_segment = silence + audio_segment + silence
                    
                    wav_path = temp_file_path.replace(extension, '_converted.wav')
                    print(f"Converting to WAV: {wav_path}")
                    
                    export_success = False
                    export_errors = []
                    
                    export_methods = [
                        ("Simple export", lambda: audio_segment.export(wav_path, format="wav")),
                        ("With sample rate", lambda: audio_segment.export(wav_path, format="wav", parameters=["-ar", "16000"])),
                        ("With codec", lambda: audio_segment.export(wav_path, format="wav", codec="pcm_s16le")),
                        ("With channels", lambda: audio_segment.export(wav_path, format="wav", parameters=["-ac", "1"]))
                    ]
                    
                    for method_name, export_method in export_methods:
                        try:
                            print(f"Trying {method_name}...")
                            export_method()
                            print(f"Export successful with {method_name}")
                            export_success = True
                            break
                        except Exception as export_error:
                            error_msg = f"{method_name} failed: {export_error}"
                            print(error_msg)
                            export_errors.append(error_msg)
                            continue
                    
                    if not export_success:
                        error_details = "; ".join(export_errors)
                        raise Exception(f"All export methods failed: {error_details}")
                    
                    with sr.AudioFile(wav_path) as source:
                        recognizer.adjust_for_ambient_noise(source, duration=0.1)
                        audio = recognizer.record(source)
                    
                    if os.path.exists(wav_path):
                        os.unlink(wav_path)
                        
                except Exception as e:
                    print(f"Audio conversion failed: {e}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Unable to process audio file. Please ensure the file is a valid audio format. Error: {str(e)}"
                    )
            
            if audio is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not process the audio file. Please try with a different audio file."
                )
            
            print(f"Attempting to recognize audio with length: {len(audio.frame_data)} bytes")
            
            text = None
            
            try:
                text = recognizer.recognize_google(audio, language='en-US')
                print(f"Recognized text (first attempt): {text}")
            except sr.UnknownValueError:
                print("First recognition attempt failed, trying with different settings...")
                
                try:
                    text = recognizer.recognize_google(audio, language='en-US', show_all=True)
                    if text and isinstance(text, dict) and 'alternative' in text:
                        text = text['alternative'][0]['transcript']
                        print(f"Recognized text (second attempt): {text}")
                    else:
                        raise sr.UnknownValueError("No alternatives found")
                except sr.UnknownValueError:
                    print("Second recognition attempt failed")
                    raise
            
            if not text or not text.strip():
                raise sr.UnknownValueError("No text recognized")
                
            return text.lower()
            
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except sr.UnknownValueError:
        print("Google Speech Recognition could not understand the audio")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not understand the audio. The audio file might be too short, unclear, or contain no speech. Please try with a longer, clearer audio recording."
        )
    except sr.RequestError as e:
        print(f"Google Speech Recognition service error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech recognition service error: {str(e)}"
        )
    except Exception as e:
        print(f"Unexpected error in convert_audio_to_text: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing audio file: {str(e)}"
        )

def search_products_by_text(db: Session, search_text: str, limit: Optional[int] = 50) -> List[models.Product]:
    """
    Search products using the converted text from voice input
    Enhanced with better text search and filtering
    """
    search_text = search_text.strip().lower()
    print(f"Searching for products with text: '{search_text}'")
    
    has_logical_operators = re.search(r'\b(and|or|not|in)\b', search_text, re.IGNORECASE)
    
    if has_logical_operators:
        conditions = parse_logical_query(search_text.upper())
        
        query = db.query(models.Product).filter(
            and_(
                models.Product.inactive == 0,
                models.Product.show_in_store == 1,
                models.Product.if_sellable == 1
            )
        )
        
        query = apply_logical_filters(query, conditions)
        
    else:
        query = db.query(models.Product).filter(
            and_(
                models.Product.inactive == 0,
                models.Product.show_in_store == 1,
                models.Product.if_sellable == 1,
                or_(
                    models.Product.name.ilike(f"%{search_text}%"),
                    models.Product.sku_name.ilike(f"%{search_text}%"),
                    models.Product.c_manufacturer.ilike(f"%{search_text}%"),
                    models.Product.c_category.ilike(f"%{search_text}%"),
                    models.Product.c_type.ilike(f"%{search_text}%"),
                    models.Product.w_oem.ilike(f"%{search_text}%"),
                    models.Product.w_sku_category.ilike(f"%{search_text}%"),
                    models.Product.w_primary_category.ilike(f"%{search_text}%"),
                    models.Product.w_subcategory.ilike(f"%{search_text}%"),
                    models.Product.w_oem_new_pn.ilike(f"%{search_text}%"),
                    models.Product.w_oem_repair_pn.ilike(f"%{search_text}%"),
                    models.Product.w_freedom_new_pn.ilike(f"%{search_text}%"),
                    models.Product.w_freedom_repair_pn.ilike(f"%{search_text}%"),
                    models.Product.description.ilike(f"%{search_text}%")
                )
            )
        )
    
    results = query.limit(limit).all()
    print(f"Found {len(results)} products matching '{search_text}'")
    return results

@router.post("/", response_model=dict)
async def search_products_by_voice(
    audio_file: UploadFile = File(..., description="Audio file (WAV, MP3, M4A, FLAC, etc.)"),
    db: Session = Depends(get_db)
):
    """
    Search products using voice input with enhanced Google Speech-to-Text
    """
    
    if not audio_file.content_type or not audio_file.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload an audio file"
        )
    
    try:
        print(f"Processing voice search with file: {audio_file.filename}, type: {audio_file.content_type}")
        
        search_text = convert_audio_to_text(audio_file)
        
        if not search_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No speech was detected in the audio file. Please ensure the file contains clear speech."
            )
        
        print(f"Successfully converted voice to text: '{search_text}'")
        
        products = search_products_by_text(db, search_text, limit=50)
        
        print(f"Found {len(products)} products for voice search")
        
        product_schemas = []
        for product in products:
            product_schema = schemas.Product(
                product_id=product.product_id,
                name=product.name,
                description=product.description,
                meta_description=product.meta_description,
                meta_keyword=product.meta_keyword,
                tag=product.tag,
                product_type=product.product_type,
                price=product.price,
                sales=product.sales,
                c_type=product.c_type,
                c_category=product.c_category,
                c_manufacturer=product.c_manufacturer,
                c_product_group=product.c_product_group,
                if_featured=product.if_featured,
                if_sellable=product.if_sellable,
                show_in_store=product.show_in_store,
                status=product.status,
                sku_name=product.sku_name,
                w_description=product.w_description,
                w_oem=product.w_oem,
                w_weight=product.w_weight,
                w_height=product.w_height,
                w_width=product.w_width,
                w_depth=product.w_depth,
                date_added=product.date_added,
                images=[]
            )
            product_schemas.append(product_schema)
        
        if len(product_schemas) > 0:
            message = f"Found {len(product_schemas)} products matching your voice search: '{search_text}'"
        else:
            message = f"No products found matching your voice search: '{search_text}'. Try different keywords or be more specific."
        
        return {
            "converted_text": search_text,
            "products": product_schemas,
            "total_results": len(product_schemas),
            "message": message
        }
        
    except Exception as e:
        print(f"Error in voice search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing voice search: {str(e)}"
        )