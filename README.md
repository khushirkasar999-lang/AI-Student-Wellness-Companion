# AI Student Wellness Companion

A fully functional, rule-based student wellness web app that estimates stress using deterministic logic, explains contributing factors, and provides personalized recommendations without machine-learning models.

## Features
- Student registration and login
- Profile onboarding
- Daily wellness check-in
- Rule-based stress estimation
- Explainable factor analysis
- Personalized recommendation engine
- Recommendation tracking and completion
- Historical check-ins and trend analysis
- Dashboard with 7/14/30-day metrics
- Privacy controls and data export
- Safety/support workflow
- Optional admin dashboard

## Stack
- Frontend: React + TypeScript + Vite + Tailwind CSS + Recharts
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL
- Validation: Zod
- Testing: Vitest + Playwright
- Auth: JWT + bcrypt

## Project structure
- /frontend
- /backend
- /database
- /config
- /tests

## Installation
1. Copy `.env.example` to `.env` and update values.
2. Start PostgreSQL.
3. Create the database `student_wellness`.
4. Run:

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Testing

```bash
npm run test
npm run test:integration
npm run test:e2e
```

## Privacy and safety
This app is not a clinical diagnostic tool. It provides a wellness estimate based on explainable rule-based logic.

## Important note
The application is fully functional using rule-based stress estimation and personalized recommendation logic, with no machine-learning model.
