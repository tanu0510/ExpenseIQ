# ExpenseIQ — Intelligent Personal Expense Management Platform

ExpenseIQ is a full-stack personal finance management platform designed to help users **track transactions, manage budgets, monitor recurring expenses, scan receipts, and gain AI/ML-powered financial insights** through a unified dashboard.

The application follows a modular architecture with separate **React frontend, Node.js/Express backend, and Python ML service**, making the system easier to maintain, test, and extend.

---

## 🚀 Key Features

### 💰 Expense & Income Management

* Add and manage income and expense transactions
* Categorize financial transactions
* View transaction history
* Track financial activity through a centralized dashboard

### 📊 Analytics & Financial Insights

* Analyze spending patterns
* View transaction-based analytics
* Monitor financial trends
* Generate insights from user financial data

### 🎯 Budget Management

* Create and manage budgets
* Track spending against allocated budgets
* Monitor budget utilization
* Support category-based financial planning

### 🔄 Recurring Transactions

* Manage recurring expenses and transactions
* Track scheduled financial commitments
* Simplify repetitive transaction management

### 🧾 Receipt Scanner

* Upload receipts through the application
* Process receipt data through the ML service
* Extract useful information from uploaded receipts
* Integrate extracted information with expense tracking

### 🤖 AI & Machine Learning

ExpenseIQ includes a dedicated Python-based ML service for intelligent financial functionality, including:

* Expense prediction
* Transaction anomaly detection
* Receipt/OCR processing
* ML-powered financial analysis

### 🔐 Authentication & Security

* User registration and login
* JWT-based authentication
* Protected API routes
* Authentication middleware
* Environment-based configuration for sensitive credentials

### 🧪 Testing

The project includes automated tests for major backend and ML functionality.

Backend test coverage includes:

* Authentication
* Transactions
* Budgets
* Analytics

ML service testing includes:

* Health endpoint
* ML functionality

---

# 🏗️ System Architecture

ExpenseIQ follows a **three-service architecture**:

```text
                         ┌───────────────────────┐
                         │       Frontend        │
                         │     React + Vite       │
                         │                       │
                         │  Dashboard            │
                         │  Transactions          │
                         │  Budgets               │
                         │  Analytics             │
                         │  AI Assistant          │
                         │  Receipt Scanner       │
                         └───────────┬───────────┘
                                     │
                              REST API / HTTP
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │       Backend         │
                         │  Node.js + Express     │
                         │                       │
                         │  Authentication       │
                         │  Transactions          │
                         │  Budgets              │
                         │  Analytics            │
                         │  Receipts             │
                         │  Recurring Expenses   │
                         │  AI / ML Routes       │
                         └───────┬─────────┬─────┘
                                 │         │
                       MongoDB   │         │ HTTP/API
                                 │         │
                                 ▼         ▼
                      ┌──────────────┐  ┌────────────────────┐
                      │   MongoDB    │  │    ML Service      │
                      │              │  │  Python + FastAPI  │
                      │ Users        │  │                    │
                      │ Transactions │  │ Prediction         │
                      │ Budgets      │  │ Anomaly Detection  │
                      │ Recurring    │  │ OCR Extraction     │
                      └──────────────┘  └────────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

* React.js
* Vite
* JavaScript
* Tailwind CSS
* Axios
* React Context API
* React Router

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* REST APIs
* Multer
* Nodemailer

## Machine Learning Service

* Python
* FastAPI
* Pydantic
* Machine Learning models
* OCR processing
* Anomaly detection
* Prediction service

## Development & Testing

* Git
* GitHub
* npm
* Python virtual environment
* Jest / Supertest
* Pytest

---

# 📁 Project Structure

```text
ExpenseIQ/
│
├── backend/
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── budgetController.js
│   │   ├── receiptController.js
│   │   ├── recurringController.js
│   │   └── transactionController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── uploadMiddleware.js
│   │
│   ├── models/
│   │   ├── Budget.js
│   │   ├── RecurringTransaction.js
│   │   ├── Transaction.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── aiRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── authRoutes.js
│   │   ├── budgetRoutes.js
│   │   ├── exportRoutes.js
│   │   ├── insightRoutes.js
│   │   ├── mlRoutes.js
│   │   ├── receiptRoutes.js
│   │   ├── recurringRoutes.js
│   │   ├── starter.js
│   │   └── transactionRoutes.js
│   │
│   ├── tests/
│   │   ├── analytics.test.js
│   │   ├── auth.test.js
│   │   ├── budgets.test.js
│   │   └── transactions.test.js
│   │
│   ├── uploads/
│   │   └── .gitkeep
│   │
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   │
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   └── common/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── ml-service/
│   │
│   ├── models/
│   │   └── schemas.py
│   │
│   ├── routes/
│   │   ├── anomaly.py
│   │   ├── health.py
│   │   ├── ocr.py
│   │   └── predict.py
│   │
│   ├── services/
│   │   ├── anomaly_detector.py
│   │   ├── ocr_extractor.py
│   │   └── predictor.py
│   │
│   ├── tests/
│   │   ├── test_health.py
│   │   └── test_ml.py
│   │
│   ├── .env.example
│   ├── main.py
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

---

# ⚙️ Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/tanu0510/ExpenseIQ.git
cd ExpenseIQ
```

---

# 🔧 Backend Setup

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
copy .env.example .env
```

Configure the required environment variables in `.env`.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend:

```bash
npm run dev
```

or:

```bash
npm start
```

---

# 🎨 Frontend Setup

Open another terminal and navigate to:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will provide the local development URL in the terminal.

---

# 🤖 ML Service Setup

Open another terminal:

```bash
cd ml-service
```

Create a Python virtual environment:

### Windows

```bash
python -m venv venv
```

Activate it:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create the environment file:

```bash
copy .env.example .env
```

Start the ML service:

```bash
uvicorn main:app --reload
```

---

# 🔑 Environment Variables

Do **not** commit real credentials, API keys, database passwords, or secrets to GitHub.

The repository provides example environment files:

```text
backend/.env.example
ml-service/.env.example
```

Create your local `.env` files from these examples and add your own credentials.

---

# 🔄 Application Flow

A typical transaction flow works approximately as follows:

```text
User
 │
 ▼
React Frontend
 │
 │ HTTP Request
 ▼
Express REST API
 │
 ├──────────────► Authentication Middleware
 │
 ├──────────────► Controllers
 │
 ▼
MongoDB
 │
 ▼
Financial Data
 │
 ▼
Analytics / AI / ML Processing
 │
 ▼
Insights displayed in Dashboard
```

For receipt processing:

```text
Receipt Image
      │
      ▼
React Frontend
      │
      ▼
Backend Upload API
      │
      ▼
Python ML Service
      │
      ▼
OCR Extraction
      │
      ▼
Structured Receipt Data
      │
      ▼
Expense Processing
      │
      ▼
Dashboard
```

---

# 🧠 ML Components

The ML service is separated from the Node.js backend to keep machine-learning workloads independent from the core application API.

### Prediction

```text
Financial Data
      ↓
Feature Processing
      ↓
Prediction Model
      ↓
Predicted Result
```

### Anomaly Detection

```text
Transaction Data
      ↓
Pattern Analysis
      ↓
Anomaly Detection
      ↓
Potentially Unusual Transaction
```

### OCR

```text
Receipt Image
      ↓
Image Processing
      ↓
OCR Extraction
      ↓
Structured Information
```

---

# 🧪 Testing

## Backend

Navigate to:

```bash
cd backend
```

Run the test suite using the project's configured test command.

Backend tests cover areas such as:

* Authentication
* Transactions
* Budgets
* Analytics

## ML Service

Navigate to:

```bash
cd ml-service
```

Run:

```bash
pytest
```

The ML test suite includes health checks and ML-related functionality.

---

# 📌 Core Modules

| Module                 | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| Authentication         | User registration, login and protected access   |
| Transactions           | Manage income and expenses                      |
| Budgets                | Create and monitor financial budgets            |
| Analytics              | Analyze financial activity                      |
| Recurring Transactions | Manage recurring financial commitments          |
| Receipt Scanner        | Process receipt uploads and extract information |
| AI Assistant           | AI-powered financial interaction                |
| ML Insights            | Prediction and anomaly-related functionality    |
| Export                 | Financial data export functionality             |

---

# 🔒 Security Considerations

ExpenseIQ implements several application-level security practices:

* JWT-based authentication
* Protected API routes
* Authentication middleware
* Environment variables for secrets
* `.gitignore` protection for local environment files
* User-specific financial data handling
* Centralized error handling

> Never add production credentials or private API keys to the repository.

---

# 📈 Future Enhancements

Potential future improvements include:

* Advanced spending forecasting
* Personalized financial recommendations
* More sophisticated anomaly detection
* Automated recurring transaction execution
* Advanced receipt classification
* Financial goal tracking
* Notification and reminder system
* Cloud deployment
* CI/CD pipeline
* Improved observability and logging
* Role-based access control enhancements

---

# 🌐 Deployment

The application can be deployed as independent services:

```text
Frontend
   ↓
Cloud Hosting

Backend
   ↓
Node.js Hosting

ML Service
   ↓
Python/FastAPI Hosting

Database
   ↓
MongoDB
```

Separating the services allows each component to be deployed and scaled independently.

---

# 📊 Engineering Highlights

ExpenseIQ demonstrates several software-engineering concepts:

* Full-stack application development
* REST API design
* Modular backend architecture
* Separation of frontend and backend concerns
* Database modeling with MongoDB/Mongoose
* JWT-based authentication
* Middleware-based request processing
* File upload handling
* AI/ML service integration
* OCR processing
* Automated testing
* Environment-based configuration
* Multi-service application architecture

---

# 👩‍💻 Author

**Tanu Singh**

B.Tech Computer Science Engineering

GitHub: [@tanu0510](https://github.com/tanu0510)

---

# ⭐ Project

If you find ExpenseIQ useful or interesting, consider giving the repository a ⭐ on GitHub.

---

## 📄 License

This project is intended for educational and portfolio purposes.
