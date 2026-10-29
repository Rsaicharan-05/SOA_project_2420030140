<div align="center">
  <h1>💰 AI EXPENSE TRACKING</h1>
  <p><strong>Personal Expense Tracker with Google Gemini AI & Gamification</strong></p>
  <p>A fast, modern Progressive Web App (PWA) with offline support, AI-powered receipt scanning, spending insights, and local data persistence.</p>
  
  [![React](https://img.shields.io/badge/React-19.2.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![PWA](https://img.shields.io/badge/PWA-Enabled-4285F4?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)
  [![Google Gemini](https://img.shields.io/badge/Gemini_AI-2.5_Flash-8E75C2?style=for-the-badge&logo=google)](https://aistudio.google.com/)
</div>

---

## 📌 Project Overview

**AI EXPENSE TRACKING** is a personal expense management application designed to make daily expense logging effortless, insightful, and motivating. Users can log income and expenses manually or use Google Gemini to automatically parse receipt photos. All data is securely stored locally in the browser, without requiring any external accounts, cloud databases, or bank integrations.

---

## ✨ Features & Architecture

### 🖥️ Responsive Multi-Device Interface
- **Desktop & Tablet:** Expands into a spacious desktop environment with a dedicated sidebar navigation, quick transaction button, top header currency indicator, and multi-column grid layouts for Dashboard, Analytics, and Profile views.
- **Mobile Experience:** Seamless bottom navigation bar, touch-friendly action buttons, and fluid modal sheets optimized for single-handed use.

### 🎨 Fully Local Styling (Zero External CDN Dependency)
- Built with Tailwind CSS and PostCSS directly in the local build pipeline.
- Does not rely on external script CDNs (`cdn.tailwindcss.com`), ensuring offline reliability and fast rendering after installation.

### 🤖 Google Gemini AI (Protected Server-Side)
- **AI Receipt Scanning:** Upload or snap a receipt image. Gemini extracts the total amount, ISO date, merchant/title, and auto-detects the best category. The details pre-fill the transaction form so you can review, adjust, and select an account before saving (never silently saved).
- **Spending Insights:** On demand, Gemini reviews recent expense entries and generates three short, actionable, encouraging suggestions tailored directly to your spending habits.
- **API Key Security:** The Gemini API key is guarded entirely on the backend server (`server/geminiHandler.js` and `server.js`). It is never bundled into or accessible by client browser code. If no key is set, the rest of the application remains fully functional with helpful notices.
- **Strict Payload Guardrails:** Base64 input size limits (12MB ceiling), whitelisted image MIME types, and transaction array bounds checks prevent server abuse.

### 📊 Dashboard & Accounts
- **Financial Balance Overview:** Instant summary cards of total balance, total income, total expenses, and budget progress formatted in **INR (₹)** by default with Indian numbering conventions (`en-IN`).
- **Account Balances:** Keep track of where money was spent or deposited (e.g. Cash, Bank Account, Cards). *Note: These are manual categorization labels and do not connect or sync to live banks.*
- **Recent Activity:** Quick view of recent transactions with type indicators and one-tap deletion.

### 💳 Transactions Management
- **Search & Filters:** Real-time text search across merchants, titles, categories, and notes. Filter by type (All, Income, Expense), category, or manual account label.
- **Filtered Summary Bar:** View instant metrics for filtered records (record count, total income, total expenses, net balance).
- **Sorting Options:** Sort transactions by date (newest/oldest) or by amount (highest/lowest).
- **Date Grouping:** Transactions are neatly organized by day with timestamps, categories, and account tags.

### 📈 Analytics & Spending Trends
- **Time Range Views:** Switch smoothly between **Past Week (7 Days)**, **Past Month (30 Days)**, and **This Year (12 Months)**.
- **Side-by-Side Desktop Charts:** Spending trend area chart and category breakdown donut chart displayed in an ergonomic 2-column layout on larger screens.
- **"Analyze My Spending":** One-click button to trigger AI analysis with clear empty and error states.

### 🎯 Budgets & Alerts
- **Flexible Budget Limits:** Set weekly, monthly, or yearly overall spending goals.
- **Category Limits:** Set individual maximums for Food, Transport, Shopping, Bills, Entertainment, Health, Education, and Others.
- **Visual Status Bars:** Dynamic progress bars with color-coded warning states (Blue < 80%, Orange > 80%, Red > 100% Over Budget).

### 🎮 Gamification & Streaks
- **Points & Levels:** Earn points with each transaction and badge milestone.
- **Daily Streaks:** Daily streak tracker with flame counters that reward consistency.
- **Badges & Achievements:** Unlock Rookie Tracker, Tracker Pro, Big Spender, Super Saver, Heating Up, and On Fire.
- **Avatar Unlocks:** Collect and switch avatars unlocked via earned points and achievement badges.

### 📥 Data Export & Validated Backup / Restore
- **PDF Export:** Formatted transaction report with financial summary and clean tables via `jspdf`.
- **Excel Export:** Multi-sheet `.xlsx` workbook containing raw transactions and category breakdown summaries via `xlsx`.
- **JSON Backup:** Download your complete user profile, streak data, and transaction records in standard JSON format.
- **Validated Restore:** Pre-validates JSON backup files before importing (checks user schema, transaction array, valid dates, positive amounts). If any anomaly or corruption is detected, import is aborted and existing browser data is left untouched.

### 📱 Progressive Web App (PWA) & Offline Shell
- **Installable:** Install directly to home screen on Android, iOS, Windows, or macOS.
- **Offline Capable:** Workbox in `vite-plugin-pwa` precaches hashed application bundles, automatically cleans up outdated cache versions, and excludes `/api/*` requests.
- **Android TWA Materials:** Preserved configuration for Trusted Web Activity builds (`android/`) with clear placeholders for your own domain and package identifier.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Google Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/)

---

### Installation & Setup

1. **Navigate to the Project Directory**
   ```bash
   cd c:\soapro
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```
   *(On Windows PowerShell, use `npm.cmd install` if execution policies prevent running `npm.ps1`).*

3. **Configure Environment Variables**
   Copy the example environment template:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and configure your settings:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   PORT=3000
   HOST=127.0.0.1
   ```
   > ⚠️ **Note:** `.env` is ignored by git to protect your secrets. Never commit API keys.

---

### Running the Application

#### Production Mode (Recommended)
1. **Build the production bundle:**
   ```bash
   npm run build
   ```
2. **Start the production server:**
   ```bash
   npm start
   ```
   - Serves the compiled production PWA assets at `http://127.0.0.1:3000` with local API endpoints for Gemini receipt scanning and insights.

#### Development Mode
```bash
npm run dev
```
- Starts the Vite development server with built-in API proxy middleware at `http://localhost:3000`.

---

## 🔑 How to Configure & Rotate Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account and click **Get API key**.
3. Create a key and copy the value.
4. Paste it into your local `.env` file:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
5. Restart the server (`npm start` or `node server.js`).
6. **Key Rotation Notice:** If you ever share or suspect your API key was exposed in chat logs or public repositories, delete the key immediately in [Google AI Studio](https://aistudio.google.com/) and create a replacement key. Update `.env` with the new key.
7. **If no API key is configured:** The application remains fully functional! Manual transaction entry, budgets, category limits, charts, exports, achievements, and backups continue to work seamlessly. Only receipt scanning and spending insights will prompt for an API key.

---

## 📁 Project Structure

```
c:\soapro/
├── components/                  # Reusable UI components
│   ├── AddTransactionModal.tsx  # Manual entry + AI receipt scan review + thumbnail
│   ├── Icons.tsx                # SVG icon library
│   ├── Layout.tsx               # Responsive app shell (Desktop Sidebar + Mobile Bottom Bar)
│   └── Tour.tsx                 # Guided interactive onboarding tour
├── services/                    # Client services
│   ├── exportService.ts         # PDF and Excel export generators
│   ├── geminiService.ts         # Server API client for Gemini
│   └── storageService.ts        # Browser localStorage & validated backup/restore
├── views/                       # Main application pages
│   ├── Analytics.tsx            # Multi-column charts & AI spending coach
│   ├── Dashboard.tsx            # Responsive 4-metric grid & 2-column layout
│   ├── Onboarding.tsx           # Initial profile & avatar setup
│   ├── Profile.tsx              # Settings, budgets, accounts, backup validation
│   └── Transactions.tsx         # Search, filters, summary bar, sorting, deletion
├── server/                      # Server-side handlers
│   └── geminiHandler.js         # Gemini API calls (apiKey protected, input validation)
├── public/                      # Static assets & PWA icons
│   ├── logo.png
│   ├── manifest.json
│   └── .well-known/             # Digital Asset Links placeholder
├── android/                     # Android TWA configuration files
├── .env.example                 # Placeholder environment template
├── index.html                   # HTML entry point with metadata
├── index.css                    # Tailwind CSS definitions
├── index.tsx                    # React DOM entry point
├── server.js                    # Standalone production Node server (loopback bound)
├── vite.config.ts               # Vite build config & dev API server
└── package.json                 # Project dependencies & scripts
```

---

## 🔒 Security & Privacy Architecture

- **Loopback Server Binding:** The Node.js server defaults to binding on `127.0.0.1` to prevent unwanted local network exposure.
- **Restricted CORS Policy:** Cross-Origin Resource Sharing is locked down to known local origins (`localhost:3000`, `127.0.0.1:3000`, `localhost:5173`, `127.0.0.1:5173`).
- **Zero Secrets in Frontend:** The Gemini API key is kept exclusively on the server side (`server.js` and `server/geminiHandler.js`). No secrets are passed to the frontend bundle or client code.
- **Fail-Safe Backup Import:** Corrupt, tampered, or malformed backup JSON files are rejected before touching any browser storage, leaving existing user data intact.
- **Local Data Storage:** All user transactions and profiles reside locally in the browser's `localStorage`. No cloud database or account registration is used.
- **Informational Disclaimer:** AI observations are presented as budgeting suggestions and do not constitute financial advice.

---

## 📄 License
MIT License.
