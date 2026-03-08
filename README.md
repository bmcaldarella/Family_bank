# 💳 Family Bank — Serverless Finance App on AWS

Family Bank is a **serverless financial web application** that helps users track **available money after expenses**, manage shared households, and collaborate securely — all built on **AWS**.

This project demonstrates a **production-style architecture** using **Next.js + AWS (Cognito, API Gateway, Lambda, DynamoDB)**.

---

## 🚀 Live Features

- ✅ Secure authentication (signup, login, email confirmation)
- 👨‍👩‍👧 Shared households with roles (OWNER / MEMBER)
- 💸 Income & expense tracking
- 📊 Real-time **available balance** (Income − Expenses)
- 🎯 Savings goals with progress tracking
- 🔗 Invite users via secure links
- ✏️ Edit & delete transactions with permission checks
- ⚡ Real-time updates (polling)

---

## 🧠 Core Concept

> **Available Balance** = Money you actually have left after expenses  
This is the main metric shown prominently — similar to real banking apps.

---

## 🏗️ Architecture (AWS Serverless)

This app is built with a **fully serverless architecture on AWS**:

Next.js (Frontend)
↓
AWS API Gateway (HTTP API)
↓
AWS Lambda (Business Logic)
↓
AWS DynamoDB (Data Storage)

AWS Cognito → Authentication & User Management



### AWS Services Used

| Service | Purpose |
|------|--------|
| **AWS Cognito** | User authentication, signup, login, email verification |
| **API Gateway (HTTP API)** | Backend API endpoints |
| **AWS Lambda** | Stateless backend logic |
| **DynamoDB** | NoSQL database (households, transactions, profiles, goals) |
| **AWS CDK** | Infrastructure as Code |

---

## 🔐 Authentication Flow (Cognito)

- Users sign up with email & password
- Email confirmation handled by Cognito
- Sessions managed securely (no passwords stored manually)
- Frontend uses `aws-amplify/auth`

---

## 📦 Backend Design

### API Endpoints (Examples)

- `GET /households`
- `POST /transactions`
- `PATCH /transactions`
- `DELETE /transactions`
- `POST /invites`
- `POST /invites/accept`
- `GET /profile`
- `PUT /profile`
- `GET /goals`
- `PUT /goals`

All endpoints are protected using **JWT authorizers (Cognito)**.

---

## 🗄️ DynamoDB Data Modeling

Single-table design with composite keys:

- `PK` / `SK` for main access patterns
- `GSI1` for secondary queries
- Partitioned by **household**
- Optimized for scalability and low latency

---

## 🖥️ Frontend

- **Next.js (App Router)**
- Fully client-side authenticated UI
- Clean, bank-style dashboard
- Responsive layout
- Strong visual hierarchy for financial data

---

## 🧪 Key Engineering Principles

- Stateless backend
- Frontend never trusted
- Permissions validated in Lambda
- Serverless-first mindset
- Scalable & cost-efficient design

---

## 🛠️ Tech Stack

- **Frontend:** Next.js, TypeScript, React
- **Backend:** AWS Lambda (Node.js 20)
- **Auth:** AWS Cognito
- **API:** API Gateway (HTTP API)
- **Database:** DynamoDB
- **Infra:** AWS CDK
- **Auth SDK:** AWS Amplify

---

## 📁 Project Structure


---

## 🎥 Demo Video

👉 *Short demo video explaining the app and AWS architecture*  
*(link here if you upload it)*

---

## 📌 Why This Project?

This project was built to demonstrate:

- Real-world AWS usage (not toy examples)
- Serverless backend design
- Secure authentication flows
- Frontend + backend integration
- Financial data handling patterns

---

## 📬 Contact

Built by **Brandon**  
📍 Ireland  
💼 Software Engineering / Cloud / AWS

---

> ⚠️ This project is for educational and portfolio purposes. Not intended for production banking use.


IMPORTANT LOGIN TO TEST
TEST LOGIN: testaws@yopmail.com
Password:Qwerty123456@
