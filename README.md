# 🚀 Counselor Performance Tracker 

> A real-time web application built for **Leap GeeBee Education** to track and monitor counselor daily performance — built with **Next.js 16** and **Firebase Firestore**.

---

## 🌐 Live Demo

| Dashboard | URL |
|-----------|-----|
| 👤 Counselor | [counselor-performance-tracker-web-a-nu.vercel.app](https://counselor-performance-tracker-web-a-nu.vercel.app) |
| 🔐 Admin | [counselor-performance-tracker-web-a-nu.vercel.app/admin](https://counselor-performance-tracker-web-a-nu.vercel.app/admin) |

> Admin Password: `admin123`

---

## 📌 About The Project

Managing counselor performance manually through paper sheets or Excel was error-prone, time-consuming, and gave no real-time visibility. This app solves that by providing a centralized, live platform where:

- **Counselors** log their daily performance in 6 key categories
- **Admin** monitors all counselors in real-time with daily, monthly, and financial yearly reports

---

## ✨ Features

### 👤 Counselor Dashboard
- Name-based login — enter once, remembered forever
- **6 performance cards** with count + notes input
- One-click **Save** button with confirmation
- **Daily View** — log today's performance
- **Monthly View** — current month summary + day-by-day breakdown
- **Yearly View** — Financial Year (April–March) summary + month-by-month breakdown
- Real-time sync with Firebase Firestore

### 🔐 Admin Dashboard
- Password-protected login — saved in browser, no repeated logins
- **Real-time updates** — see counselor data the moment it's saved
- **Daily View** — filter by any date, see all counselors
- **Monthly View** — filter by any month, total row included
- **Yearly View** — Financial Year (April–March) filter
- **Notes Popup** — click any number to see the notes written by that counselor
- Logout button

### 📊 6 Performance Categories (in order)
| # | Category |
|---|----------|
| 1 | 🟢 Warm Leads |
| 2 | 📄 Applications |
| 3 | 🚶 Walk-ins |
| 4 | 💰 Deposits |
| 5 | 📋 Shortlistings |
| 6 | ✈️ Visa Approvals |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | Frontend framework with App Router |
| **TypeScript** | Type-safe development |
| **Firebase Firestore** | Real-time NoSQL database |
| **Tailwind CSS v3** | Utility-first styling |
| **Vercel** | Deployment & hosting |
| **GitHub** | Version control & CI/CD |

---

## 📁 Project Structure

```
myapp/
├── app/
│   ├── page.tsx          # Counselor Dashboard
│   ├── admin/
│   │   └── page.tsx      # Admin Dashboard
│   ├── globals.css
│   └── layout.tsx
├── lib/
│   └── firebase.js       # Firebase configuration
├── public/
│   └── logo.png          # Leap GeeBee logo
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 🗄️ Database Structure

**Firebase Firestore — Collection: `entries`**

Each document is stored as `{CounselorName}_{date}`:

```json
{
  "counselor": "Nirali Solanki",
  "date": "2026-03-11",
  "warm_leads": { "count": "5", "notes": "Called 5 students" },
  "applications": { "count": "3", "notes": "Sent to UK unis" },
  "walk_ins": { "count": "2", "notes": "" },
  "deposit": { "count": "1", "notes": "Student paid deposit" },
  "shortlistings": { "count": "4", "notes": "" },
  "visa_approvals": { "count": "1", "notes": "Canada visa approved" }
}
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- Firebase account

### Installation

```bash
# Clone the repository
git clone https://github.com/NiraliSolanki97/Counselor-Performance-Tracker-Web-App.git

# Navigate to project
cd Counselor-Performance-Tracker-Web-App/myapp

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Update `lib/firebase.js` with your config:

```js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  ...
};
```

---

## 📅 Financial Year Logic

The yearly report follows the **Indian Financial Year**:
- **Starts:** April 1st
- **Ends:** March 31st (next year)
- Example: FY 2025-2026 = April 2025 → March 2026

---

## 🔐 Admin Access

| Field | Value |
|-------|-------|
| URL | `/admin` |
| Password | `admin123` |
| Login persistence | Saved in localStorage |

---

## 📱 Deployment

The app is deployed on **Vercel** with automatic deployments on every push to `main` branch.

```bash
# Deploy manually
git add .
git commit -m "our message"
git push origin main
```

Vercel automatically picks up the changes and redeploys! ✅

---

## 👩‍💻 Developer 

**Nirali Solanki**
- Full Stack Developer & Counselor at Leap GeeBee Education
- GitHub: [@NiraliSolanki97](https://github.com/NiraliSolanki97)

---

## 🏢 Organization

**Leap GeeBee Education**
- Study abroad consultancy helping students achieve their international education dreams

---

## 📄 License

This project is private and built exclusively for **Leap GeeBee Education**.

---

> Built with love as a Final Year Project — 2026 