# 🎬 FilmCraft AI — Deploy Guide

## Βήματα για Deploy στο Vercel

### 1. Ανέβασε στο GitHub

1. Πήγαινε στο **github.com** και κάνε login
2. Πάτα το **+** πάνω δεξιά → **New repository**
3. Όνομα: `filmcraft-ai`
4. Άφησε το **Public** και πάτα **Create repository**
5. Ανέβασε τα αρχεία:
   - Πάτα **uploading an existing file**
   - Σύρε ΟΛΟΝ τον φάκελο `filmcraft-ai` μέσα
   - Πάτα **Commit changes**

### 2. Deploy στο Vercel

1. Πήγαινε στο **vercel.com** και κάνε login με GitHub
2. Πάτα **Add New → Project**
3. Διάλεξε το repository `filmcraft-ai`
4. Πάτα **Deploy** (χωρίς να αλλάξεις τίποτα)

### 3. Βάλε το API Key

1. Στο Vercel project σου πάτα **Settings → Environment Variables**
2. Πρόσθεσε:
   - **Name:** `AIML_API_KEY`
   - **Value:** (το API key σου από το aimlapi.com)
3. Πάτα **Save**
4. Πήγαινε στο **Deployments** και πάτα **Redeploy**

### 4. Έτοιμο! 🎉

Το app σου είναι live στο URL που σου έδωσε το Vercel!
π.χ. `https://filmcraft-ai-xxx.vercel.app`

---

## Τοπική εκτέλεση (προαιρετικό)

```bash
npm install
# Δημιούργησε αρχείο .env.local με:
# AIML_API_KEY=το_key_σου
npm run dev
```

Άνοιξε http://localhost:3000
