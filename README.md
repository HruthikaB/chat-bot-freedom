# Freedom Chatbot

A full-stack application featuring a chatbot interface with product search capabilities. The application consists of a FastAPI backend, React frontend, and uses MySQL for data storage.

## Prerequisites

- Docker
- MySQL Server (running locally)
- Node.js (for local development)
- Python 3.11+ (for local development)

## Project Structure

```
chat-bot-freedom/
├── backend/           # FastAPI backend
├── frontend/          # React frontend
└── docker-compose.yml # Docker configuration
```

## Setup Instructions

### 1. Database Setup

Ensure your local MySQL server is running and you have created a database named `freedom_dev`.

```sql
CREATE DATABASE freedom_dev;
```

### 2. Running the Application

- Start the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```

- The services will be available at:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
