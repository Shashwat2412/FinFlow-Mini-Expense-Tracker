# FinFlow - Personal Expense Tracker & Category Budget Planner

FinFlow is a full-stack personal ledger application designed to help users track daily spending across categories, analyze their financial habits through custom interactive charts, set budget thresholds, and manage logs with ease. This project implements the **Mini Expense Tracker** exercise using a modular monorepo architecture with Node.js/Express on the backend and React (scaffolded via Vite) on the frontend.

## Deployed Demo & Live Links
* **Frontend (Vite + React)**: *[Deploying to Vercel...]*
* **Backend (Node.js + Express)**: [https://finflow-backend-liji.onrender.com](https://finflow-backend-liji.onrender.com)
> *Note on Hosting:* Since this application utilizes dynamic local JSON databases (`expenses.json` and `budgets.json`) for zero-configuration local runs, production deployments should utilize a persistent disk volume (such as Render Disks) or be configured to use SQLite/PostgreSQL for persistent cloud storage.

---

## Tech Stack & Libraries Used
1. **Core Backend: Node.js & Express**
   * *Why:* Minimalist, fast, and extremely modular. It allows setting up REST APIs quickly with standard middleware (CORS and JSON parsing) and has lightweight memory footprints.
2. **Core Frontend: React (Functional Components & Hooks)**
   * *Why:* Leverage React's reactive state engine to handle forms, interactive data filters, and live budget limit warnings instantly on the client.
3. **Bundling Tool: Vite**
   * *Why:* Blazing-fast Hot Module Replacement (HMR) and near-instant production compilation compared to standard Create React App setups.
4. **Data Persistence: Local JSON Database**
   * *Why:* Provides zero-dependency, human-readable file persistence that runs immediately out of the box without requiring external database setups (like MongoDB or SQLite binary compilation issues on Windows).
5. **Styling: Premium Vanilla CSS**
   * *Why:* Avoids framework bloat and provides complete design control. It implements custom HSL color properties, glassmorphism, responsive flexboxes/grids, and pulsing alert animations.
6. **Testing: Native Node.js Test Runner (`node:test`)**
   * *Why:* Fast, zero-dependency unit tests running natively inside Node.js v22 without requiring complex Jest configurations.

---

## How to Run Locally

### Prerequisites
* **Node.js** (v18.0.0 or higher, v22+ recommended)
* **npm** (v9.0.0 or higher)

### Setup & Run Commands

1. **Clone and Enter the Workspace**:
   ```bash
   cd "final Project"
   ```

2. **Install All Workspace Dependencies**:
   This project uses npm workspaces. Running `npm install` at the root automatically installs dependencies for both the `/client` and `/server` subfolders.
   ```bash
   npm install
   ```

3. **Start the Local Development Servers**:
   Run the concurrent start script at the root. This launches the Express backend (port 5000) and the Vite React server (port 5173) simultaneously.
   ```bash
   npm run dev
   ```
   * Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

4. **Run Backend API Tests**:
   Execute the backend unit tests to verify validator constraints:
   ```bash
   npm run test:server
   ```

---

## API Documentation

### Base URL
`http://localhost:5000/api`

### 1. Expense Endpoints

#### `GET /api/expenses`
Retrieve all expense logs. Supports query filtering.
* **Query Parameters**:
  * `category` (optional): `Food` | `Transport` | `Bills` | `Entertainment` | `Other`
  * `startDate` (optional): `YYYY-MM-DD`
  * `endDate` (optional): `YYYY-MM-DD`
* **Response Shape (200 OK)**:
  ```json
  [
    {
      "id": "e2ba34a6-7a8e-4a6f-b2c5-d7a8bf60e101",
      "amount": 120.50,
      "category": "Food",
      "date": "2026-06-01",
      "note": "Dinner with friends"
    }
  ]
  ```

#### `POST /api/expenses`
Create a new expense log.
* **Request Body**:
  ```json
  {
    "amount": 45.00,
    "category": "Transport",
    "date": "2026-06-02",
    "note": "Uber ride"
  }
  ```
* **Response Shape (201 Created)**:
  ```json
  {
    "id": "f58bc12a-3b9e-4c7f-94d0-a7d2cf81f102",
    "amount": 45.00,
    "category": "Transport",
    "date": "2026-06-02",
    "note": "Uber ride"
  }
  ```
* **Errors (400 Bad Request)**: Returns `{ "errors": [...] }` if validations fail (e.g. negative amount, future date, missing category).

#### `PUT /api/expenses/:id`
Modify an existing expense log.
* **Request Body**: Same structure as `POST`.
* **Response Shape (200 OK)**: Returns the updated expense object.
* **Errors (404 Not Found)**: Returns `{ "error": "Expense not found" }` if the ID is invalid.

#### `DELETE /api/expenses/:id`
Remove an expense log.
* **Response Shape (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Expense deleted successfully."
  }
  ```

---

### 2. Budget Endpoints

#### `GET /api/budgets`
Retrieve spending limits for all categories.
* **Response Shape (200 OK)**:
  ```json
  {
    "Food": 500,
    "Transport": 150,
    "Bills": 800,
    "Entertainment": 200,
    "Other": 150
  }
  ```

#### `PUT /api/budgets`
Update category budget thresholds.
* **Request Body**:
  ```json
  {
    "Transport": 100,
    "Food": 600
  }
  ```
* **Response Shape (200 OK)**: Returns the updated budgets map.

---

## Project Structure

```
final Project/
├── package.json               # Root monorepo dependencies & workspaces scripts
├── package-lock.json
├── .gitignore                 # Excludes node_modules, client builds, and local databases
├── README.md                  # Project documentation (this file)
│
├── server/                    # Node.js Express Backend
│   ├── package.json
│   ├── server.js              # Server entry point, validations & API endpoints
│   ├── api.test.js            # Backend unit tests using native node:test runner
│   └── data/                  # Local persistence (auto-created at launch)
│       ├── expenses.json      # Expense ledger store
│       └── budgets.json       # Budget limit settings
│
└── client/                    # React Vite Frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html             # Entry point with SEO tags and Web Fonts
    └── src/
        ├── main.jsx           # App bootstrapping
        ├── App.jsx            # Core dashboard layout, state synchronization
        ├── App.css            # Cleared for global styling
        ├── index.css          # Design system stylesheet
        └── components/        # Isolated visual dashboard elements
            ├── SummaryPanel.jsx  # Top KPI statistical summary blocks
            ├── ExpenseForm.jsx   # Validated expense logger form (Add/Edit)
            ├── ExpenseList.jsx   # Tabular logs with filters & CSV exporter
            ├── BudgetWidget.jsx  # Spending threshold limits & edit controls
            └── CategoryChart.jsx # Custom interactive SVG donut breakdown
```

---

## Next Steps & Future Enhancements

Due to constraints and scope, certain features were deferred. If scaling this project further, we would implement:
1. **Relational Storage (SQLite/PostgreSQL)**: Transition the server data layer to SQLite or a serverless PostgreSQL database to support high concurrency, indexes, and complex transaction structures.
2. **User Authentication & Multi-Tenancy**: Introduce JWT-based Auth (or OAuth providers) alongside password hashing to separate ledgers for multiple users.
3. **Advanced Financial Analytics**: Incorporate time-series forecasts to project next-month spending habits, compare trends across custom quarters, and suggest budget adjustments.
4. **Recurring Expenses**: Support scheduler patterns to log recurring utility bills, subscriptions, or salaries automatically.
5. **Multi-Currency & Exchange Sync**: Integrate a live Forex rate API to support currency toggles and automatically normalize reports into the user's base currency.
