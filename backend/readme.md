# Backend Setup for E-commerce Product API

This project uses **FastAPI**, **MySQL**, and **SQLAlchemy** to serve product data for an e-commerce frontend.

---

## ✅ Requirements

- Python 3.10+
- MySQL Server running locally or remotely
- pip or poetry (for dependency management)

---

## 📦 Installation

1. **Clone the Repository:**

```bash
cd chat-bot/backend
```

2. **Create Virtual Environment (optional but recommended):**

```bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
```

3. **Install Dependencies:**

```bash
pip install -r requirements.txt
```

---

## 🛠 Configure Database Connection

Edit the file at `app/database.py` and replace with your MySQL credentials:

```python
SQLALCHEMY_DATABASE_URL = "mysql+mysqlconnector://<username>:<password>@localhost:3306/<database_name>"
```

Example:

```python
SQLALCHEMY_DATABASE_URL = "mysql+mysqlconnector://root:password@localhost:3306/ecommerce"
```

---

## 🗃️ Create the Database in MySQL

```sql
CREATE DATABASE ecommerce;
```

You can do this via the MySQL CLI:

```bash
mysql -u root -p
```

Then:

```sql
CREATE DATABASE ecommerce;
```

---

## 🔨 Initialize the Tables

This is automatically handled when running the seed script or when the FastAPI server starts. But to do it explicitly:

```bash
python -m app.models  # If using declarative Base setup
```

---

## 🌱 Seed the Database with 500+ Fake Products

Run the following script to populate your database with test products:

```bash
python -m app.seed_products
```

✅ This will insert 500 products with random values for testing.

---

## 🚀 Run the FastAPI Server

```bash
uvicorn app.main:app --reload
```

Visit: [http://localhost:8000/docs](http://localhost:8000/docs) to test the API.

---

## 🧪 API Endpoints

- `GET /products` - List all products
- `GET /products?brand=Nike&category=Shoes` - Filter by any combination of:
  - `category`
  - `type`
  - `size`
  - `brand`
  - `color`

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── seed_products.py
│   └── ...
├── requirements.txt
└── README.md
```

---

## ❓ Troubleshooting

If you get `ModuleNotFoundError: No module named 'app'`:
- Run scripts using the `-m` flag from project root: `python -m app.seed_products`

If you get `VARCHAR requires a length`:
- Make sure all `String` columns in `models.py` have an explicit length: `String(100)`, `String(255)`, etc.

---

Happy Coding! 🚀

