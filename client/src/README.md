# 📂 Source Code — React Application

**Core React components and application logic**

---

## 📁 Folder Structure

```
src/
├── api/               # API layer and HTTP client
├── components/        # Reusable UI components
├── context/           # Global state management
├── pages/             # Page-level components
├── main.jsx           # React entry point
└── index.css          # Global styles and design system
```

---

## 🌐 API Layer (`api/`)

### `axios.js`
**Purpose**: Centralized HTTP client with JWT authentication

**Features**:
- **Base URL switching**: Dev (proxy) vs Production (direct)
- **JWT interceptors**: Auto-attach tokens to requests
- **Error handling**: Consistent error responses

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🧩 Components (`components/`)

### Core Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `Navbar.jsx` | Navigation bar | Dark mode toggle, user menu |
| `ListingCard.jsx` | Display listing cards | Listing data, user info |
| `CompositionBar.jsx` | Visual composition chart | Chemical percentages |
| `StatCard.jsx` | Animated metric display | Number, label, icon |
| `SkeletonCard.jsx` | Loading placeholder | None |
| `EmptyState.jsx` | Empty data message | Icon, title, description |
| `Toast.jsx` | Notification system | Message, type |
| `PageWrapper.jsx` | Page transitions | Children |
| `ChemicalInputRow.jsx` | Chemical input form | OnChange, onRemove |

### Key Features

#### CompositionBar
```javascript
// Visual representation of chemical composition
<CompositionBar 
  composition={listing.composition}
  showLabels={true}
  height={32}
/>
```

#### ListingCard
```javascript
// Animated card with hazard indicators
<ListingCard 
  listing={listing}
  currentUser={user}
  onMatch={() => handleMatch(listing.id)}
/>
```

---

## 🌐 Context (`context/`)

### `AppContext.jsx`
**Purpose**: Global state management for authentication and UI

**State Management**:
```javascript
const [user, setUser] = useState(null);
const [darkMode, setDarkMode] = useState(false);
const [toast, setToast] = useState(null);
const [loading, setLoading] = useState(false);
```

**Context Value**:
```javascript
const value = {
  user, setUser,           // Authentication state
  darkMode, setDarkMode,   // Theme preference
  toast, setToast,         // Notifications
  loading, setLoading,     // Loading states
  login, logout,           // Auth functions
  showToast               // Toast helper
};
```

**Usage in Components**:
```javascript
import { useApp } from "../context/AppContext";

const { user, darkMode, showToast } = useApp();
```

---

## 📄 Pages (`pages/`)

### Page Components

| Page | Route | Purpose | Key Features |
|------|-------|---------|-------------|
| `Login.jsx` | `/login` | User authentication | Form validation, error handling |
| `Register.jsx` | `/register` | New user registration | Industry types, locations |
| `Dashboard.jsx` | `/` | Overview and quick actions | Stats, recent listings |
| `PostListing.jsx` | `/post` | Create listings | Type toggle, composition/criteria |
| `SmartSearch.jsx` | `/search` | AI-powered search | Prompt parser, filters |
| `MatchBuyers.jsx` | `/match-buyers` | Find buyers for waste | Hazard warnings |
| `ProcessorFinder.jsx` | `/processor-finder` | Find processing paths | 1-hop/2-hop paths |

### Page Architecture
```javascript
// Typical page structure
const PageName = () => {
  const { user, loading, showToast } = useApp();
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // Fetch data on mount
  }, []);

  return (
    <PageWrapper>
      {/* Page content */}
    </PageWrapper>
  );
};
```

---

## 🎨 Styling (`index.css`)

### Design System
**CSS Variables**:
```css
:root {
  --primary: 59 130 246;
  --success: 34 197 94;
  --warning: 245 158 11;
  --danger: 239 68 68;
}
```

**Dark Mode**:
```css
.dark {
  --bg-primary: 17 24 39;
  --bg-secondary: 31 41 55;
  --text-primary: 243 244 246;
}
```

**Component Styles**:
- **Glass-morphism**: `bg-white/10 backdrop-blur-md`
- **Gradients**: `bg-gradient-to-r from-blue-500 to-blue-600`
- **Animations**: `transition-all duration-300`
- **Hover states**: `hover:scale-105 hover:shadow-lg`

---

## 🚀 Entry Point (`main.jsx`)

**React 18 Setup**:
```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

---

## 🔄 Data Flow

### API Integration
```javascript
// Typical API call pattern
const fetchListings = async () => {
  setLoading(true);
  try {
    const response = await api.get("/listings");
    setData(response.data);
  } catch (error) {
    showToast("Failed to fetch listings", "error");
  } finally {
    setLoading(false);
  }
};
```

### State Updates
```javascript
// Authentication flow
const login = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    setUser(response.data.user);
    localStorage.setItem("token", response.data.token);
    showToast("Login successful", "success");
    navigate("/");
  } catch (error) {
    showToast(error.response?.data?.error || "Login failed", "error");
  }
};
```

---

## 🎯 Component Patterns

### Loading States
```javascript
if (loading) return <SkeletonCard />;
if (!data.length) return <EmptyState />;
```

### Error Handling
```javascript
try {
  // API call
} catch (error) {
  showToast(error.message, "error");
}
```

### Dark Mode Support
```javascript
className={`p-4 rounded-lg ${
  darkMode 
    ? "bg-gray-800 text-white" 
    : "bg-white text-gray-900"
}`}
```

---

## 🧪 Testing Components

### Manual Testing Checklist
- **Login flow**: Token storage, navigation
- **Dashboard**: Data loading, stats display
- **Search**: Filter application, results
- **Forms**: Validation, submission
- **Dark mode**: Theme persistence
- **Responsive**: Mobile layout

### Debug Tools
```javascript
// Add debug logging
console.log("Component data:", data);
console.log("API response:", response.data);
```

---

## 📦 Dependencies

### Core Dependencies
- `react` + `react-dom`: React framework
- `react-router-dom`: Client-side routing
- `axios`: HTTP client
- `framer-motion`: Animations
- `lucide-react`: Icon library

### Development Dependencies
- `vite`: Build tool
- `tailwindcss`: CSS framework
- `@vitejs/plugin-react`: React plugin

---

## 🔄 Performance Optimizations

### Implemented
- **Lazy loading**: Route-based code splitting
- **Memoization**: React.memo for expensive components
- **Debouncing**: Search input optimization
- **Image optimization**: WebP format where possible

### Future Improvements
- **Virtual scrolling**: For large lists
- **Service worker**: Offline caching
- **Bundle analysis**: Optimize imports

---

## 🎨 UI/UX Features

### Animations
- **Page transitions**: Framer Motion `AnimatePresence`
- **Card animations**: Entrance effects on scroll
- **Button states**: Hover and active animations
- **Toast notifications**: Slide-in/out animations

### Accessibility
- **Semantic HTML**: Proper heading hierarchy
- **ARIA labels**: Screen reader support
- **Keyboard navigation**: Tab order management
- **Color contrast**: WCAG compliance

---

**Built for a modern, intuitive user experience**
