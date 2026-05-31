# 💰 Loan Management System (LMS)

A full-stack Loan Management System built with **Next.js · Node.js · MongoDB · TypeScript**.
Live: <https://loan-management-system-fe.onrender.com/login>
---

## 🏗️ Tech Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind CSS |
| Backend | Node.js · Express.js · TypeScript |
| Database | MongoDB · Mongoose |
| Auth | JWT · bcryptjs |
| File Upload | Multer (PDF/JPG/PNG, max 5 MB) |

---

## 📁 Project Structure

```
lms/
├── backend/          # Express REST API
│   ├── src/
│   │   ├── routes/       # auth, loan, ops, payment
│   │   ├── controllers/  # business logic
│   │   ├── middleware/   # JWT auth + RBAC
│   │   ├── models/       # User, Loan, Document, Payment
│   │   ├── services/     # BRE engine
│   │   └── utils/        # loan calculator
│   ├── scripts/seed.ts   # creates one account per role
│   └── .env.example
└── frontend/         # Next.js App Router
    └── app/
        ├── login/        # auth pages
        ├── signup/
        ├── apply/        # borrower portal (4-step flow)
        └── dashboard/    # ops panel (sales/sanction/disbursement/collection)
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
# Backend
cp .env.example .env
# Edit MONGO_URI and JWT_SECRET as needed
```

```bash
# Frontend — create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
```

### 3. Seed the database

```bash
cd backend
npm run seed
```

This creates **one account per role** with known credentials.

### 4. Run both servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

Open **http://localhost:3000**

---

## 🔐 Login Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@lms.com | Admin@123 |
| **Sales** | sales@lms.com | Sales@123 |
| **Sanction** | sanction@lms.com | Sanction@123 |
| **Disbursement** | disburse@lms.com | Disburse@123 |
| **Collection** | collection@lms.com | Collection@123 |
| **Borrower** | borrower@lms.com | Borrower@123 |

> The demo login page has quick-fill buttons for all roles.

---

## 🧭 Complete Flow

### Borrower Journey
1. **Sign up / Login** → creates a Borrower account
2. **Personal Details** → fill name, PAN, DOB, salary, employment
   - BRE (Business Rule Engine) checks: Age 23–50, salary ≥ ₹25k, valid PAN, not unemployed
   - Fails instantly if any rule breaks
3. **Upload Salary Slip** → PDF/JPG/PNG, max 5 MB
4. **Loan Configuration** → sliders for amount (₹50k–₹5L) and tenure (30–365 days)
   - Live Simple Interest preview: `SI = (P × R × T) / (365 × 100)`
5. **Track status** on the status page

### Operations Dashboard
| Module | Role | Action |
|---|---|---|
| Sales | sales / admin | View all borrowers + lead status |
| Sanction | sanction / admin | Approve or reject applied loans |
| Disbursement | disbursement / admin | Release funds on sanctioned loans |
| Collection | collection / admin | Record payments with UTR, auto-close on full repayment |

---

## 🔒 Role-Based Access Control

- **Frontend**: `useAuth()` hook redirects wrong-role users; nav only shows permitted modules
- **Backend**: `authenticate` middleware verifies JWT; `enforceRole([...])` middleware rejects with **403** if role doesn't match
- Borrowers cannot access the dashboard; executives cannot access the borrower portal

### Status Transitions

```
applied → sanctioned  (sanction exec)
applied → rejected    (sanction exec, with reason)
sanctioned → disbursed (disbursement exec)
disbursed → closed    (auto — when total paid ≥ total repayment)
```

---

## 📐 Business Rule Engine (BRE)

Rules run **server-side** (cannot be bypassed):

| Rule | Rejection Condition |
|---|---|
| Age | Not between 23 and 50 |
| Salary | Below ₹25,000/month |
| PAN | Doesn't match `^[A-Z]{5}[0-9]{4}[A-Z]$` |
| Employment | Applicant is unemployed |

---

## 💳 Payment Validation

- UTR must be **unique** across all payments (enforced at DB level with unique index)
- Amount cannot exceed the outstanding balance
- Loan **auto-closes** when `totalPaid >= totalRepayment`
- Outstanding balance = `totalRepayment − sum(payments.amount)`

---

## 🛠️ API Reference

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/signup` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Any |
| POST | `/api/loans/personal-details` | Borrower |
| POST | `/api/loans/upload-document` | Borrower |
| POST | `/api/loans/apply` | Borrower |
| GET | `/api/loans/my` | Borrower |
| GET | `/api/loans/calculate?principalAmount=&tenureDays=` | Borrower |
| GET | `/api/ops/sales` | Sales, Admin |
| GET | `/api/ops/sanction` | Sanction, Admin |
| PATCH | `/api/ops/sanction/:id` | Sanction, Admin |
| GET | `/api/ops/disbursement` | Disbursement, Admin |
| PATCH | `/api/ops/disburse/:id` | Disbursement, Admin |
| GET | `/api/ops/collection` | Collection, Admin |
| POST | `/api/payments/:loanId` | Collection, Admin |
| GET | `/api/payments/:loanId` | Collection, Admin |

---

## 📦 Build for Production

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm start
```
