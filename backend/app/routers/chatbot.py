from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

@router.get("/messages", response_model=list[schemas.ChatbotMessageOut])
def get_messages(db: Session = Depends(get_db)):
    return db.query(models.ChatbotMessage).all()
