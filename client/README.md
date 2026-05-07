# 🎨 Client — React Frontend

**Modern React application for the Symbio-Exchange marketplace**

---

## 🛠️ Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: TailwindCSS with dark mode support
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React
- **HTTP Client**: Axios with JWT interceptors
- **State Management**: React Context API
- **Routing**: React Router DOM

---

## 📁 Folder Structure

```
client/
├── public/                 # Static assets
│   ├── _redirects         # Netlify SPA routing
│   └── favicon.ico
├── src/
│   ├── api/               # API layer
│   │   └── axios.js       # Axios instance with JWT
│   ├── components/        # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── ListingCard.jsx
│   │   ├── CompositionBar.jsx
│   │   └── ...
│   ├── context/           # Global state
│   │   └── AppContext.jsx
│   ├── pages/             # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   └── ...
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles + design system
├── netlify.toml           # Netlify config
└── package.json
```

---

## 🚀 Quick Start

```bash
cd client
npm install
npm run dev    # Development server (http://localhost:3000)
npm run build  # Production build
```

---

## 🎨 Design System

### Colors
- **Primary**: Blue gradient (`from-blue-500 to-blue-600`)
- **Success**: Green (`text-green-500`)
- **Warning**: Amber (`text-amber-500`)
- **Danger**: Red (`text-red-500`)
- **Dark Mode**: Full dark mode support with `dark:` prefixes

### Components
- **StatCard**: Animated metric display
- **SkeletonCard**: Loading state placeholder
- **EmptyState**: User-friendly empty data message
- **CompositionBar**: Visual chemical composition chart
- **Toast**: Animated notifications

---

## 📱 Pages

| Page | Route | Purpose |
|------|-------|---------|
| Login | `/login` | User authentication |
| Dashboard | `/` | Overview with stats |
| Post Listing | `/post` | Create OFFER/DEMAND |
| Match Buyers | `/match-buyers` | Find buyers for waste |

---

## 🔌 API Integration

The app uses a centralized Axios instance (`src/api/axios.js`) that:
- Automatically attaches JWT tokens to requests
- Handles base URL switching (dev vs production)
- Provides consistent error handling

**Development**: Uses Vite proxy (`/api` → `http://localhost:5000`)
**Production**: Direct calls to deployed backend via `VITE_API_URL`

---

## 🎯 Key Features

### Authentication
- JWT-based login/logout
- Protected routes with auth middleware
- Token persistence in localStorage

### Visualizations
- Composition bars for waste streams
- Hazard level indicators
- Animated statistics
- Loading skeletons

### Responsive Design
- Mobile-first approach
- Tailwind responsive utilities
- Touch-friendly interactions

---

## 🌐 Deployment

### Netlify (Recommended)
```bash
npm run build
# Deploy dist/ folder to Netlify
# Set VITE_API_URL environment variable
```

### Environment Variables
- `VITE_API_URL`: Backend API URL (production only)

---

## 🧪 Testing

The frontend is tested manually via:
1. **Login flow**: JWT token handling
2. **Dashboard**: Data loading and display
3. **Match Buyers**: Search results visualization

---

## 🎨 UI/UX Highlights

- **Glass-morphism effects** for modern aesthetics
- **Smooth animations** with Framer Motion
- **Dark mode** for reduced eye strain
- **Micro-interactions** on buttons and cards
- **Loading states** with skeleton screens
- **Toast notifications** for user feedback

---

## 📦 Dependencies

Key packages:
- `react` + `react-dom`: Core React
- `react-router-dom`: Routing
- `axios`: HTTP client
- `framer-motion`: Animations
- `lucide-react`: Icons
- `tailwindcss`: Styling

---

**Built for an intuitive, modern industrial marketplace experience**
