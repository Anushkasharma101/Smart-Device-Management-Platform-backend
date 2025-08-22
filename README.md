# Curvvtech Smart Device Management Platform - Backend

This is the backend service for the **Curvvtech Smart Device Management Platform**, built with **MERN stack technologies** and providing APIs for:  
- User authentication  
- Device management  
- Device analytics  
- Real-time device status updates  
- Data export and reporting  

---

## 📑 Table of Contents

- [Project Overview](#project-overview)  
- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Getting Started](#getting-started)  
- [Environment Variables](#environment-variables)  
- [Running the Application](#running-the-application)  
- [API Endpoints](#api-endpoints)  
- [Test API](#test-api)  

---

## 🚀 Project Overview

This project implements the backend for managing smart devices. Users can:  
- Sign up / login  
- Register devices  
- Send heartbeat & log data  
- Query device analytics  

The system ensures:  
- **Secure access** → JWT-based authentication with refresh tokens  
- **Optimized performance** → Redis caching  
- **Real-time updates** → WebSockets / Server-Sent Events (SSE)  

---

## ⚡ Features

### 1️⃣ API Performance & Caching

- [x] Redis caching for:  
  - Device listings & user data (TTL: 15–30 min)  
  - Expensive analytics queries (TTL: 5 min)  
- [x] Cache invalidation on device updates  
- [x] Response time logging for monitoring  

**Performance Targets:**  
- Device listing API: ≤ **100ms** (cached results)  
- Analytics endpoints: handle **1000+ concurrent requests**  

---

### 2️⃣ Advanced Authentication & Security

- [x] JWT-based authentication  
  - Access tokens → expires in **15 min**  
  - Refresh tokens → expires in **7 days**  
  - Rotation on refresh  
  - Blacklist mechanism for revoked tokens  
- [x] Security features  
  - CORS setup  
  - Rate limiting (per endpoint, custom for auth/device ops)  
  - Request logging with IP tracking  

---

### 3️⃣ Real-time Device Status

- [x] WebSocket implementation  
  - Broadcast device heartbeat events to org users  
  - JWT-based auth for connections  
  - Graceful handling of disconnections  
- [ ] Alternative strategies:  
  - SSE (Server-Sent Events) fallback  
  - ETag / Last-Modified headers for optimized polling  

---

### 4️⃣ Data Export & Reporting

- [x] Export APIs for:  
  - Device logs (CSV/JSON, date range-based)  
  - Usage reports (JSON with chart-ready data)  
- [x] Background jobs for large exports  
  - Returns **job ID** for status checks  
  - Email notifications (simulated via logs)  

---

### 5️⃣ Core Backend Features

- User **registration & authentication**  
- **CRUD** for devices  
- Device **heartbeat tracking**  
- Device log creation & retrieval  
- Aggregated usage statistics (24-hour units consumed)  
- API **rate limiting**  
- Background task: auto-deactivate inactive devices  
- **Input validation** with Joi  
- **Modular code structure** → controllers, services, models, middlewares  
- **Docker support** for containerized deployment  

---

## 🛠 Tech Stack

- **Node.js + Express** → REST APIs  
- **MongoDB + Mongoose** → Database / ODM  
- **Redis** → Caching  
- **JWT** → Authentication  
- **Joi** → Validation  
- **bcryptjs** → Password hashing  
- **express-rate-limit** → Rate limiting  
- **dotenv** → Config management  
- **Docker** → Containerization  

---

## ⚙️ Getting Started

### ✅ Prerequisites

- Node.js v16+  
- npm  
- MongoDB (local or Atlas)  
- Redis  
- Docker (optional)  

### 🔧 Running project
docker-compose up --build
