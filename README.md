# NexusCRM 🚀

A modern, feature-rich **Customer Relationship Management (CRM)** system built as a client-side Single Page Application (SPA) with a stunning glassmorphic dark/light UI.

---

## ✨ Features

- **Dashboard** – Revenue charts, pipeline funnel, task summary, and sales target gauge
- **Contacts** – Full CRUD table with sorting, CSV import/export, and status filters (Customer, Lead, Prospect, Partner, Vendor)
- **Deals (Kanban)** – Drag-and-drop pipeline across Prospecting → Closed Won/Lost with live revenue totals
- **Tasks** – Checklist management with priority and due dates
- **Interaction History** – Timeline of calls, emails, meetings, SMS, WhatsApp, LinkedIn, and demos
- **Authentication** – Login portal with session management

## 🛠️ Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Structure   | HTML5 (Semantic)              |
| Styling     | Vanilla CSS (Glassmorphism)   |
| Logic       | Vanilla JavaScript (ES6+)     |
| Charts      | Chart.js (CDN)                |
| Icons       | Lucide Icons (CDN)            |
| Storage     | Browser `localStorage`        |

## 🗄️ Database Schema

A full relational SQL schema is included in [`schema.sql`](./schema.sql), covering:

- `leads` → `contacts` → `accounts`
- `opportunities` (deals) with stage history
- `tasks`, `interactions`, `users`, and more

See [`schema.sql`](./schema.sql) for the complete DDL.

## 🚀 Getting Started

### Option 1 – Open directly
Just open `index.html` in your browser.

### Option 2 – Local server (recommended)
```bash
# Python 3
python -m http.server 8080
```
Then visit `http://localhost:8080`.

## 🔐 Demo Credentials

| Field    | Value               |
|----------|---------------------|
| Email    | `admin@nexus.com`   |
| Password | `password`          |

## 📁 Project Structure

```
AyanProject/
├── index.html      # Main SPA shell & all view panels
├── style.css       # Design system, themes, glassmorphism
├── app.js          # State management, routing, charts, drag-and-drop
├── mockData.js     # Seed data for contacts, deals, tasks
├── schema.sql      # Relational database schema (PostgreSQL)
└── README.md       # This file
```

## 👤 Author

**Ayan Sarguru**

---

> Built with ❤️ using pure HTML, CSS, and JavaScript — no frameworks needed.
