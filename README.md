# File Vault

A minimalistic, secure file sharing platform with **Code Rooms**.

## Features
- 🔐 Code Room system — each code is a private, isolated file space
- 📁 Upload any file type (documents, images, APKs, videos, etc.)
- ⬇️ Real-time download progress with % and ETA
- 🗑️ Delete with confirmation
- 📱 Installable as a PWA (works on mobile & desktop)
- ☁️ Google Drive storage + MongoDB metadata

## Project Structure

```
file-vault/
├── backend/     → Express.js API (deploy to Render)
└── frontend/    → React + Vite SPA (deploy to Netlify)
```

## Development Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in .env with MongoDB URI, Google Drive credentials, JWT secret
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:4000
npm run dev
```

Open http://localhost:5173

## Environment Variables

### Backend `.env`

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `GOOGLE_PROJECT_ID` | Google Cloud project ID |
| `GOOGLE_SERVICE_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | Service account private key |
| `GOOGLE_DRIVE_FOLDER_ID` | Google Drive folder ID |
| `JWT_SECRET` | Random 32+ char secret |
| `FRONTEND_URL` | Your Netlify URL (for CORS) |
| `PORT` | Server port (default: 4000) |

### Frontend `.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Your Render backend URL |

## Deployment

- **Backend** → [render.com](https://render.com) (free tier)
- **Frontend** → [netlify.com](https://netlify.com) (free tier)
