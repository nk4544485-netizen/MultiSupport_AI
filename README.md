# 🤖 MultiSupport AI

<div align="center">

### AI-Powered Multi-Agent Customer Support System

An enterprise-grade customer support platform that uses **Retrieval-Augmented Generation (RAG)**, **Large Language Models**, **Intelligent Agent Routing**, and **Knowledge Base Search** to deliver fast, accurate, and context-aware customer support.

---

![Python](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb)
![ChromaDB](https://img.shields.io/badge/ChromaDB-VectorDB-orange?style=for-the-badge)
![Groq AI](https://img.shields.io/badge/Groq-LLM-black?style=for-the-badge)

</div>

---

# 📌 Overview

MultiSupport AI is an intelligent customer support platform designed to automate customer service using AI while maintaining enterprise-level support quality.

Instead of relying on a single chatbot, the platform automatically understands customer intent, routes the request to the appropriate AI specialist, retrieves company knowledge from uploaded documents, and provides grounded responses with confidence scoring.

The platform also creates support tickets for unresolved issues, making it suitable for modern businesses.

---

# ✨ Features

## 🤖 AI Customer Assistant

- Human-like conversations
- Context-aware responses
- Conversation memory
- Multi-turn chat
- Confidence score generation

---

## 🧠 Multi-Agent Architecture

The AI automatically routes requests to specialized support agents.

- 💳 Billing Agent
- 🛠 Technical Support Agent
- 🛒 Product & Sales Agent
- 📦 General Support Agent

---

## 📚 Retrieval-Augmented Generation (RAG)

Instead of hallucinating answers, MultiSupport AI searches company documents before generating responses.

Supported documents:

- FAQ.pdf
- UserManual.pdf
- RefundPolicy.pdf
- Warranty.pdf
- ShippingPolicy.pdf
- PrivacyPolicy.pdf
- ContactInformations.pdf
- Pricing.pdf

---

## 📂 Knowledge Base Management

Admins can upload documents directly from the dashboard.

Supported formats

- PDF
- DOCX
- TXT
- JSON FAQ

Uploaded files are

- Parsed
- Chunked
- Embedded
- Indexed in ChromaDB
- Instantly searchable

---

## 🎯 Smart Intent Detection

Automatically detects customer intent such as

- Billing
- Refund
- Login Issues
- Password Reset
- Product Questions
- Warranty
- Shipping
- Technical Errors

and routes the conversation to the correct AI specialist.

---

## 🎫 Automatic Ticket Generation

If the AI detects that an issue requires human attention, it automatically creates a support ticket.

Generated ticket includes

- Ticket ID
- Priority
- Sentiment
- Assigned Department
- SLA Deadline

---

## 😊 Sentiment Analysis

The AI determines whether the customer is

- Positive
- Neutral
- Negative

Negative conversations automatically receive higher priority.

---

## 🔍 Conversation History

Each user has

- Multiple conversations
- Searchable history
- Rename conversations
- Delete conversations
- Persistent memory

---

## 🔐 Authentication

- User Registration
- User Login
- JWT Authentication
- Protected Routes
- Role-Based Access Control

Roles

- Customer
- Support Agent
- Administrator

---

## 📡 Real-Time Features

- Live Notifications
- WebSocket Support
- Ticket Updates
- Real-Time Dashboard Refresh

---

# 🏗 System Architecture

```
                 Customer
                     │
                     ▼
             React Web Interface
                     │
                     ▼
              FastAPI Backend API
                     │
         ┌───────────┴────────────┐
         ▼                        ▼
 Authentication             Conversation Memory
         │
         ▼
   Intent Detection
         │
         ▼
     Agent Router
         │
 ┌───────┼──────────┬───────────┬──────────┐
 ▼       ▼          ▼           ▼
Billing Technical Product   General
 Agent    Agent      Agent      Agent
         │
         ▼
     RAG Engine
         │
         ▼
     ChromaDB
         │
         ▼
 Company Knowledge Base
         │
         ▼
  AI Response Generator
         │
         ▼
 Final Customer Response
```

---

# 🛠 Tech Stack

## Frontend

- React
- React Router
- Axios
- CSS3
- JavaScript

---

## Backend

- FastAPI
- Python
- JWT Authentication
- WebSocket

---

## AI

- Groq API
- LLM
- Prompt Engineering
- RAG

---

## Database

- MongoDB
- ChromaDB

---

## Document Processing

- PyPDF2
- python-docx

---

## Machine Learning

- Sentence Embeddings
- Semantic Search
- Sentiment Analysis

---

# 📁 Project Structure

```
MultiSupport-AI
│
├── backend
│   ├── app
│   │   ├── api
│   │   ├── auth
│   │   ├── database
│   │   ├── models
│   │   ├── prompts
│   │   ├── services
│   │   └── uploads
│   │
│   ├── knowledge_base
│   ├── chroma_data
│   └── main.py
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── routes
│   │   ├── services
│   │   └── App.jsx
│   │
│   └── package.json
│
└── README.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/MultiSupport-AI.git
```

---

## Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload
```

Backend

```
http://127.0.0.1:8000
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend

```
http://localhost:5173
```

---

# 🔑 Environment Variables

Create a `.env`

```
GROQ_API_KEY=YOUR_KEY

JWT_SECRET=YOUR_SECRET

MONGO_URI=YOUR_MONGODB_URI
```

---

# 📄 Knowledge Base Workflow

```
Upload PDF

↓

Extract Text

↓

Split into Chunks

↓

Store in ChromaDB

↓

Semantic Search

↓

Relevant Context

↓

AI Response
```

---

# 🎯 Future Improvements

- Voice Support
- Image Understanding
- OCR Support
- Multi-language Chat
- Analytics Dashboard
- Live Human Handoff
- CRM Integration
- Email Automation
- WhatsApp Integration
- Microsoft Teams Integration
- Slack Integration

---

# 📸 Screenshots

You can place screenshots here.

```
Home Page

Login

Register

Chat

Admin Dashboard

Knowledge Base

Tickets

Analytics
```

---

# 👨‍💻 Developed By

**Nirmal Kumar**

B.Tech Artificial Intelligence & Data Science

Passionate about

- Artificial Intelligence
- Machine Learning
- Generative AI
- Full Stack Development
- Intelligent Automation

---

# ⭐ If you like this project

Please consider giving it a ⭐ on GitHub.

It helps others discover the project and motivates further development.

---

## 📜 License

This project is released under the **MIT License**.

Feel free to use, modify, and learn from it.