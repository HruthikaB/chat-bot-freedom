# Freedom Chatbot - Advanced E-commerce Search Platform

A comprehensive full-stack e-commerce application featuring advanced product search capabilities, AI-powered chatbot, voice search, image search, and modern shopping features. Built with FastAPI backend, React frontend, and MySQL database.

## Features

### Advanced Search System
- **Multi-Modal Search**: Text, voice, and image-based product search
- **Logical Query Support**: Complex search queries using AND, OR, IN, NOT operators
- **Real-time Suggestions**: Intelligent product suggestions as you type
- **Advanced Filtering**: Category, manufacturer, type, price range filters
- **Best Sellers**: Products ranked by sales performance
- **Recently Purchased/Shipped**: Dynamic product recommendations

### AI-Powered Chatbot
- **Natural Language Processing**: Conversational product queries
- **SQL Query Generation**: AI-generated database queries from user messages
- **Interactive Interface**: Real-time chat with product results

### Voice Search
- **Speech-to-Text**: Google Speech-to-Text integration
- **Audio Processing**: Support for multiple audio formats (WAV, MP3, M4A, FLAC)
- **Real-time Recording**: Live voice recording with visual feedback
- **Voice-to-Product**: Direct conversion from speech to product search

### Image Search
- **Visual Product Search**: Upload images to find similar products
- **Camera Integration**: Take photos directly from device camera
- **AI Image Processing**: ResNet50-based image feature extraction
- **Similarity Matching**: Cosine similarity-based product matching

### Shopping Features
- **Shopping Cart**: Add/remove products with quantity management
- **Wishlist**: Save products for later
- **Product Details**: Comprehensive product information pages

## Prerequisites

- **Docker Desktop**
- **MySQL Server**
- **Node.js 18+**
- **Python 3.11+**
- **OpenAI API Key**

## Quick Start

### 1. Database Setup

```sql
CREATE DATABASE freedom_dev;
```

### 3. Run with Docker

```bash
docker-compose up build
docker-compose up
```

### 4. Local Development
**Backend**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
**Frontend**

```bash
cd frontend
npm install
npm run dev
```
The services will be available at:
 - Frontend: http://localhost:5173
 - Backend API: http://localhost:8000
 - API Documentation: http://localhost:8000/docs