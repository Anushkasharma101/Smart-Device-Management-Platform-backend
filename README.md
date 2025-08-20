# Curvvtech Smart Device Management Platform - Backend

This is the backend service for the Curvvtech Smart Device Management Platform, built with the MERN stack technologies and providing APIs for user authentication, device management, and device data logging/analytics.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)

## Project Overview

This project implements the backend for managing smart devices, allowing users to sign up/login, register their devices, send heartbeat and log data, and query device analytics. It uses JWT-based authentication for secure access, MongoDB for data storage, and Express.js as the web framework following a clean architecture pattern.

## Features

- User registration and authentication with JWT.
- CRUD operations on devices owned by authenticated users.
- Device heartbeat updates for status/activity tracking.
- Log creation and retrieval for devices.
- Aggregated usage statistics (24-hour units consumed).
- Rate limiting (100 requests/minute per user).
- Background task to auto-deactivate devices inactive for over 24 hours.
- Input validation with Joi.
- Modular, clean code structure with controllers, services, models, and middlewares.
- Docker support for containerized deployment.
- Unit tests (planned/partially implemented).

## Tech Stack

- **Node.js** with **Express** for REST API.
- **MongoDB** with **Mongoose** ODM.
- **JWT** for authentication.
- **Joi** for request validation.
- **bcryptjs** for password hashing.
- **express-rate-limit** for rate limiting.
- **dotenv** for environment variable management.
- **Docker** for containerization.

## Getting Started

### Prerequisites

- Node.js v16+
- npm
- MongoDB (local or Atlas cloud)
- Docker (optional)

### Installation

1. Clone the repo:

git clone <your-repo-url>
cd curvvtech-backend

2. Install dependencies:

npm install

3. Setup environment variables by creating a `.env` file in the root directory with the following keys:

PORT=5000
MONGO_URI=mongodb+srv://as0846403:z7RSjHkLSUN9Wd9j@cluster0.6q7gapy.mongodb.net/
JWT_SECRET=e3ff5f077839c1331b1d893a728246685cb7dba9e3a77bffe7d52eaccf660988
JWT_EXPIRES_IN=1d

## Running the Application

### Run locally with nodemon (development)

npm run dev

### Run production server

npm start
