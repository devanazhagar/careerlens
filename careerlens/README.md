# CareerLens

A simplified career guidance platform for students and professionals.

## Project Structure
- **client/**: React + Vite frontend.
- **server/**: Node.js + Express + MongoDB backend.

## Setup Instructions

If you are cloning this repository for the first time, follow these steps:

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB Atlas Account (or local MongoDB)

### 2. Server Setup
1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    Create a `.env` file in the `server` directory (this file is excluded from git for security). Add the following keys:
    ```env
    PORT=3000
    DB_URI=your_mongodb_connection_string
    JWT_PASS="your_secret_key"
    SECURE="development"
    SMTP_USER="your_smtp_user"
    SMTP_PASS="your_smtp_password"
    SENDER_EMAIL="your_sender_email"
    FRONTEND_URL="http://localhost:5173"
    ```
4.  Start the server:
    ```bash
    npm run start
    ```

### 3. Client Setup
1.  Open a new terminal and navigate to the client directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## Features
- **Onboarding**: Gamified intent-mapping flow (School, College, Professional).
- **Authentication**: Secure login/signup.
