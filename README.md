# 💵 SnapTrack

A personal finance tracker built with modern web technologies — track your income and expenses, scan receipts, manage budgets, and visualize your financial data with ease.

---

### 🔗 [Live Demo](https://snaptrack-gold.vercel.app/)
### 🔗 [Video Demo](https://www.youtube.com/watch?v=hwoNukrYPv8)

---

## ✨ Features

- 🏠 **Landing Page** with statistics and features
- 🔐 **User authentication** via Clerk
- 💳 **Multiple accounts** per user with support for a default account
- 💼 **Create, edit, delete transactions**
- 📈 **Income vs. Expenses chart** with toggleable ranges (Weekly, Monthly, 3M, 6M)
- 🧾 **Receipt scanning** powered by **Gemini Flash 1.5**
- 📊 **Expense breakdown** with pie chart
- 📉 **Budget management** with a live progress bar
- 🔍 **Sortable and filterable transaction table**
- ✅ **Form validations** with error handling and toast feedback
- 🔐 **API rate limiting per user** with Arcjet (20 calls/hour)
- 🔄 **Server-side revalidation** for data freshness

---

## 🛠 Tech Stack

- **Frontend:** React, Next.js App Router, TypeScript
- **Styling:** Tailwind CSS, ShadCN UI
- **Backend:** Supabase (PostgreSQL), Prisma ORM
- **Auth:** Clerk
- **Charts:** Recharts
- **OCR & AI:** Gemini Flash 1.5 (for receipt scanning)
- **Security & Rate Limiting:** Arcjet

---

## 🚀 Getting Started

```bash
git clone https://github.com/mabelzhou/snaptrack.git
cd snaptrack
npm install
npm run dev
