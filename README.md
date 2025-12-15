# 🌐 DisasterLink – Intelligent Disaster Prediction & Response System

[![GitHub issues](https://img.shields.io/github/issues/misbha448/DisasterLink)](https://github.com/misbha448/DisasterLink/issues)
[![GitHub forks](https://img.shields.io/github/forks/misbha448/DisasterLink)](https://github.com/misbha448/DisasterLink/network)
[![GitHub stars](https://img.shields.io/github/stars/misbha448/DisasterLink)](https://github.com/misbha448/DisasterLink/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/misbha448/DisasterLink/blob/main/LICENSE)

**DisasterLink** is a unified disaster-management platform that combines **Machine Learning (FastAPI)**, **Node.js backend**, **React frontend**, and **MongoDB database** to deliver early disaster warnings and streamline coordination between victims, volunteers, NGOs, and government officers.

---

## 🌪️ Overview

DisasterLink solves two critical challenges:

### 1️⃣ Early Earthquake Prediction (Python + ML + FastAPI)
- ML model processes historical seismic data to predict earthquake likelihood.
- Exposes a **FastAPI endpoint** for real-time predictions.
- Integrated into the main backend dashboards for alerts and insights.

### 2️⃣ Smart Disaster Response & Coordination (Node.js + Express + MongoDB)
- Enables victims to request help.
- Volunteers manage and respond to tasks.
- NGOs allocate resources efficiently.
- Officers/admins monitor operations in real time.

---

## ✨ Key Features

### 🔮 Earthquake Prediction (ML Service)
- Trained on global seismic datasets.
- Real-time FastAPI prediction API.
- Features: magnitude, depth, location patterns.
- Returns **risk level**: Low / Moderate / High.
- Fully integrated with main backend dashboards.

### 🚑 Disaster Response System

#### User Roles
- **Victims** – Raise emergency help requests.
- **Volunteers** – Accept and manage rescue tasks.
- **NGOs** – Provide resources, shelters, medical support.
- **Officers** – Manage field operations.
- **Admin** – Oversee analytics and system performance.

#### Modules
- Geo-based request tracking.
- Resource & shelter allocation.
- Real-time dashboards.
- Alerts & notifications.
- End-to-end role management.
- JWT authentication & secure API access.

---

## 🏗️ Tech Stack

### Frontend
- **React.js**
- Axios for APIs
- Responsive UI components

### Backend
- **Node.js + Express.js**
- REST APIs for authentication, requests, analytics
- Integrated with ML FastAPI service

### ML Backend
- **Python + FastAPI**
- Scikit-Learn model
- Data preprocessing pipeline
- `/predict` endpoint returning earthquake risk

### Database
- **MongoDB**
- Managed through Mongoose ORM

---



## 📁 **Project Structure**

```
DisasterLink/
│
├── backend/                # Node.js + Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   └── server.js
│
├── frontend/               # React frontend
│   ├── src/
│   └── public/
│
└── earthquake-ml/          # Python ML (FastAPI)
    ├── model/
    ├── data/
    ├── predict.py
    └── main.py             # FastAPI server
```

---

## ⚙️ **Setup Instructions**

### **1. Clone Repository**

```
git clone https://github.com/misbha448/DisasterLink.git
cd DisasterLink
```

---

### **2. Setup Node.js Backend**

```
cd backend
npm install
node server.js
```

---

### **3. Setup Python ML Backend (FastAPI)**

```
cd earthquake-ml
pip install -r requirements.txt
uvicorn main:app --reload
```

---

### **4. Setup Frontend**

```
cd frontend
npm install
npm start
```

---

## 🔗 **Important Endpoints**

### **Node.js (Main Backend)**

| Method | Endpoint       | Purpose                    |
| ------ | -------------- | -------------------------- |
| POST   | /auth/register | Create account             |
| POST   | /auth/login    | Login & token              |
| POST   | /help/request  | Raise emergency request    |
| GET    | /help/all      | Officer/NGO dashboard      |
| GET    | /analytics/all | Admin analytics            |
| GET    | /ml/predict    | Fetch ML prediction result |

### **FastAPI (ML Service)**

| Method | Endpoint | Purpose                    |
| ------ | -------- | -------------------------- |
| POST   | /predict | Earthquake risk prediction |

---

## 🎯 **Expected Outcomes**

* **More accurate and earlier earthquake predictions** with ML
* **Reduced disaster response time**
* **Centralized monitoring** for officers/NGOs
* **Optimized volunteer coordination**
* **Improved communication flow** across all stakeholders

---

## 🚧 **Future Enhancements**

* Deep learning upgrades (LSTM/GRU seismic forecasting)
* IoT sensor integration
* Mobile app version
* Multi-disaster prediction (cyclone, flood, wildfire)
* Offline-mode support
