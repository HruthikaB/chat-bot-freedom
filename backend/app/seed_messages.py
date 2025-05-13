from .database import SessionLocal, engine
from .models import Base, ChatbotMessage

# 1. Create the table if it doesn't exist
Base.metadata.create_all(bind=engine)

# 2. Create a session
db = SessionLocal()

# 3. Define default chatbot messages
default_messages = [
    {"message_type": "greeting", "content": "Hi there! How can I help you today?"},
    {"message_type": "fallback", "content": "I'm sorry, I didn’t understand that."},
    {"message_type": "goodbye", "content": "Thanks for visiting! Have a great day!"},
]

# 4. Insert messages only if table is empty
existing = db.query(ChatbotMessage).first()
if not existing:
    for msg in default_messages:
        chatbot_msg = ChatbotMessage(**msg)
        db.add(chatbot_msg)
    db.commit()
    print("✅ Chatbot messages seeded successfully.")
else:
    print("ℹ️ Chatbot messages already exist. Skipping seed.")

# 5. Close the session
db.close()
