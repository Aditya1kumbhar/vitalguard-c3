# VitalGuard C3 — 100% Free Cloud Deployment Guide

This guide walks you through deploying the **entire stack (Frontend + Backend + Database)** to production for **$0 / completely free**, with **no credit card required**.

---

## 🏆 Recommended 100% Free Architecture

| Component | Free Platform | Cost | Why This Platform? |
|---|---|---|---|
| **Frontend** | **Vercel** | **$0** (Free Forever) | Created Next.js, 1-click GitHub import, global edge CDN, free SSL. |
| **Backend & WebSockets** | **Render** or **Koyeb** | **$0** (Free Tier) | Native Python + FastAPI support, handles persistent WebSockets (`/ws/telemetry`). |
| **Database (Alerts & 30-Day)** | **SQLite + Browser IndexedDB** | **$0** (Zero Cloud) | Pre-configured in the container + client phones with zero external dependencies. |
| **Optional Cloud DB** | **Turso** | **$0** (Free Tier) | 9 GB Cloud SQLite, 500 databases, no credit card required. |

---

## Step 1: Push Code to GitHub

1. Create a new GitHub repository named `VitalGuard-C3`.
2. Push your project code:
```bash
git init
git add .
git commit -m "VitalGuard C3 - Production Ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/VitalGuard-C3.git
git push -u origin main
```

---

## Step 2: Deploy Backend to Render (Free)

1. Go to [render.com](https://render.com) and sign up with your GitHub account.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository `VitalGuard-C3`.
4. Configure the service settings:
   - **Name:** `vitalguard-c3-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free` ($0/mo)
5. Click **Create Web Service**.
6. Once deployed, Render will give you your public backend URL (e.g., `https://vitalguard-c3-backend.onrender.com`).

> **WebSocket Note:** Render free tier supports secure WebSockets out of the box! Your live telemetry endpoint will be:
> `wss://vitalguard-c3-backend.onrender.com/ws/telemetry`

---

## Step 3: Deploy Frontend to Vercel (Free)

1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** → **Project**.
3. Import your `VitalGuard-C3` repository.
4. In the configuration window:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click "Edit" and select `frontend`.
5. Under **Environment Variables**, add these two variables:
   - `NEXT_PUBLIC_API_URL` = `https://vitalguard-c3-backend.onrender.com`
   - `NEXT_PUBLIC_WS_URL` = `wss://vitalguard-c3-backend.onrender.com/ws/telemetry`
   *(Replace with your actual Render URL from Step 2)*
6. Click **Deploy**.
7. In ~60 seconds, Vercel will give you your live URL:
   `https://vitalguard-c3.vercel.app`

---

## Step 4: Access Anywhere on Mobile

Open your Vercel URL (`https://vitalguard-c3.vercel.app`) on **any mobile device, tablet, or laptop worldwide**!
- ✅ Live HUD with 10 Hz real-time waveforms
- ✅ 3-Stage autonomous fall detection
- ✅ 30-Day history persistent in mobile browser IndexedDB
- ✅ Zero ongoing costs, $0 cloud footprint
