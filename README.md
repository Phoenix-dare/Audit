# Audit MERN App Scaffold

This repository now contains:
- `latest-db-audit-logic.txt`: logic extracted from `09.10.2024 (1).accdb`.
- `server/`: Express + Mongo backend with calculation engine and work-order APIs.
- `client/`: React (Vite) frontend for data entry + preview + save.

## Run Backend
1. Copy `server/.env.example` to `server/.env`.
2. Set `MONGODB_URI`.
3. Install deps and run:
   - `cd server`
   - `npm install`
   - `npm run dev`

## Run Frontend
1. Install deps and run:
   - `cd client`
   - `npm install`
   - `npm run dev`

## APIs
- `POST /api/calculate/preview`
- `GET /api/work-orders`
- `POST /api/work-orders`
- `PUT /api/work-orders/:id`

## Next Phase
- Add Budget and Contractor collections + CRUD.
- Add budget transaction logic when `need != 0`.
- Add report/print layout equivalent to Access report.
  * print-preview.html / print-preview.css are already set up for A4 pages; ensure any
    new templates maintain the `@page { size: A4 }` rule and explicit 210mm×297mm wrapper
    to avoid browser scaling.
- Add validation and test suite for every formula branch.

> **Note:** The front‑end homepage form replicates the fields and order of `Form1` from the
> Access database – consult that form when making UI changes so the web version matches the
> original entry screen.
