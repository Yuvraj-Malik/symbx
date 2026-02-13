# Symbio-Exchange — Deployment Guide

Deploy the backend to **Render** (free) and the frontend to **Netlify** (free).

---

## Step 1: Push to GitHub

```bash
cd "d:\My Programs\DBMS Project"
git init
git add .
git commit -m "Symbio-Exchange v1.0 — raw SQL backend + React frontend"
```

Create a repo on GitHub (e.g. `symbio-exchange`) and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/symbio-exchange.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

1. Go to [https://render.com](https://render.com) and sign up (free)
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `symbio-exchange-api`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node seed.js && node index.js`
5. Add Environment Variables:
   - `PORT` = `5000`
   - `JWT_SECRET` = `symbio_exchange_prod_secret_change_me`
   - `DB_STORAGE` = `./database.sqlite`
6. Click **Create Web Service**
7. Wait for build to complete (~2 min)
8. Your backend URL will be: `https://symbio-exchange-api.onrender.com`

**Test it:**
```
https://symbio-exchange-api.onrender.com/api/health
→ {"status":"ok"}

https://symbio-exchange-api.onrender.com/api/master/chemicals
→ [17 chemicals]
```

> **Note:** Render free tier spins down after 15 min of inactivity.
> First request after sleep takes ~30 seconds. This is normal.

---

## Step 3: Deploy Frontend to Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com) and sign up (free)
2. Click **Add new site → Import an existing project**
3. Connect your GitHub repo
4. Configure:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
5. Add Environment Variable:
   - `VITE_API_URL` = `https://symbio-exchange-api.onrender.com/api`
   
   (Replace with your actual Render URL from Step 2)
6. Click **Deploy site**
7. Your frontend URL will be: `https://symbio-exchange.netlify.app`

---

## Step 4: Verify End-to-End

1. Open your Netlify URL
2. Login with: `ntpc@example.com` / `password123`
3. Check Dashboard — should show 5 listings
4. Try Smart Search — "fly ash with less than 1% sulfur"
5. Try Match Buyers — enter Supply ID `1`
6. Try Processor Finder — Sulfur → Calcium Oxide

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Frontend shows network error | Check VITE_API_URL env var on Netlify matches your Render URL |
| Backend returns 502 | Check Render logs — may need to wait for cold start |
| CORS error in browser | Backend already has `cors()` enabled for all origins |
| Login fails on deployed site | Make sure seed.js ran — check Render logs for "SEED COMPLETE" |
| Render keeps restarting | Check that `better-sqlite3` built correctly (native module) |

---

## Architecture (Deployed)

```
Browser → Netlify (React SPA)
              ↓ HTTPS
         Render (Express + SQLite)
              ↓
         database.sqlite (on Render disk)
```

---

## Important Notes

- **SQLite on Render**: The free tier uses ephemeral disk — the database resets on each deploy. The `seed.js` runs on every start, so demo data is always fresh.
- **For production**: Switch to PostgreSQL (Render offers free PostgreSQL). Update `server/config/database.js` to use `pg` driver.
- **Custom domain**: Both Netlify and Render support custom domains on free tier.
