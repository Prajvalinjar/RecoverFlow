# RecoverFlow Backend Service (`recoverflow-api`)

FastAPI backend service for RecoverFlow (Razorpay Buildathon Track 03 — AI Revenue Recovery).

---

## Service Overview

- **Service Name**: `recoverflow-api`
- **Framework**: FastAPI
- **Python Version**: 3.14+ (Verified on Python 3.14.6)
- **Phase 0 Status**: Health endpoints and CORS configuration initialized. No database or business logic.

---

## Endpoints

### 1. Root Identification Endpoint
- **Method**: `GET /`
- **Response**:
  ```json
  {
    "service": "recoverflow-api",
    "version": "0.1.0",
    "status": "running"
  }
  ```

### 2. Health Check Endpoint
- **Method**: `GET /health`
- **Response**:
  ```json
  {
    "status": "healthy",
    "service": "recoverflow-api",
    "version": "0.1.0"
  }
  ```

---

## Local Setup & Execution

### 1. Environment Setup
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install minimal requirements
pip install -r requirements.txt
```

### 2. Run Tests
```powershell
pytest
```

### 3. Run FastAPI Application
```powershell
uvicorn app.main:app --reload --port 8000
```

The service will be available at `http://localhost:8000`.
