# 🇮🇳 Mantri Mitra AI — मंत्री मित्र

> **AI-Powered Constituency Management for Indian MLAs and MPs**

Built with React + Vite + Claude AI · Deployable on Vercel in under 5 minutes.

---

## ⚡ Deploy to Vercel — Step by Step

### STEP 1 — GitHub pe upload karo

1. [github.com](https://github.com) pe jaao, account banao (free hai)
2. **"New repository"** click karo
3. Name rakho: `mantri-mitra-ai`
4. **Public** select karo → **Create repository**
5. Apne computer pe ye commands run karo (terminal/cmd):

```bash
# Ye folder jahan hai wahaan jaao
cd mantri-mitra-ai

# Git initialize karo
git init
git add .
git commit -m "Mantri Mitra AI - Initial deploy"

# GitHub se connect karo (apna username daalo)
git remote add origin https://github.com/YOUR_USERNAME/mantri-mitra-ai.git
git branch -M main
git push -u origin main
```

---

### STEP 2 — Vercel pe deploy karo

1. [vercel.com](https://vercel.com) jaao
2. **"Sign up with GitHub"** click karo
3. Dashboard pe **"Add New Project"** click karo
4. `mantri-mitra-ai` repo select karo → **Import**
5. Settings screen pe ye check karo:
   - **Framework Preset:** `Vite` ✓ (auto-detect ho jaayega)
   - **Root Directory:** `.` (default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. **Deploy** click karo!

> ⏳ 2-3 minutes mein deploy ho jaayega. Vercel ek live URL dega jaise:
> `https://mantri-mitra-ai.vercel.app`

---

### STEP 3 — API Key add karo (IMPORTANT)

Bina API key ke AI features kaam nahi karenge.

1. Vercel dashboard mein apna project open karo
2. **Settings** → **Environment Variables** jaao
3. **Add New** click karo:
   - **Name:** `VITE_ANTHROPIC_KEY`
   - **Value:** `sk-ant-api03-xxxxxxxxx` (apni Anthropic API key)
   - **Environment:** Production, Preview, Development — teeno check karo
4. **Save** karo
5. **Deployments** tab pe jaao → latest deployment pe **Redeploy** karo

> 🔑 API key kahan milegi? → [console.anthropic.com](https://console.anthropic.com)
> Account banao → API Keys → Create Key → copy karo

---

### STEP 4 — Live ho gaya! 🎉

Aapki app ab is URL pe live hai:
```
https://mantri-mitra-ai.vercel.app
```

Har baar code change karo aur `git push` karo — Vercel automatically redeploy kar dega!

---

## 💻 Local Development (apne computer pe chalana)

```bash
# Dependencies install karo
npm install

# .env.local file banao
cp .env.example .env.local
# .env.local mein apni API key daalo

# Development server start karo
npm run dev
# App chalega: http://localhost:3000
```

---

## 📁 Project Structure

```
mantri-mitra-ai/
├── index.html          ← Entry point with loading screen
├── vite.config.js      ← Vite build configuration
├── vercel.json         ← Vercel routing + security headers
├── package.json        ← Dependencies
├── .env.example        ← Environment variable template
├── .gitignore          ← Git ignore rules
└── src/
    ├── main.jsx        ← React root mount
    └── App.jsx         ← Complete application (all pages)
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 6 |
| AI | Claude claude-sonnet-4-20250514 (Anthropic) |
| Styling | Inline CSS + CSS Custom Properties |
| Auth | SHA-256 hashing (Web Crypto API) |
| Storage | sessionStorage (prototype) |
| Deployment | Vercel (free tier) |
| Fonts | Noto Serif + Noto Sans (Google Fonts) |

---

## ⚠️ Important Notes

- **API key security:** `VITE_` prefix means the key is exposed in the browser bundle. For production with real officials, use a backend proxy (see `backend-server.js`).
- **Data persistence:** All data resets on page refresh (prototype). For production, connect to the included PostgreSQL backend.
- **Free tier limits:** Vercel free tier has 100GB bandwidth/month — more than enough for a hackathon demo.

---

## 🚀 Features

- ✅ **Citizen Issue Tracker** — AI-powered resolution plans
- ✅ **Document Intelligence** — Upload, summarize, chat, translate
- ✅ **Meeting Intelligence** — AI agenda + structured summaries
- ✅ **Speech Generator** — 11 Indian languages, any tone
- ✅ **Analytics Dashboard** — Constituency insights
- ✅ **Secure Auth** — SHA-256 password hashing
- ✅ **Mobile First** — Full Android support
- ✅ **Dark Mode** — Built-in theme toggle

---

*सत्यमेव जयते · Smart India Hackathon 2026*
