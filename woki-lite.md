# WokiLite - Restaurant Reservation System

---

## 1) Objective

Design and implement **WokiLite** — a lean, high-signal prototype of **Woki’s** reservation engine focused on **atomic, efficient table assignment** per sector. The system must:

* Operate on a **fixed 15-minute grid** across the day.
* Respect **service shifts** when defined (otherwise full-day scheduling).
* Handle **concurrency** and **idempotency** so that double bookings cannot occur.
* Expose a clean **REST API** with clear error semantics.
* Store/return **customer details** alongside reservations for backoffice visibility.

Think of this as the **scheduling kernel** of a real product: the CORE should be shippable in \~2 hours, and BONUS items are where strong engineers can stand out (deploys, DB, optimization, combinations, etc.).

> There **must** be an **efficient table-assignment algorithm**.

---

## 2) Time Conventions

* **Fixed slot size:** **15 minutes** (not configurable).
* **CORE reservation duration:** **90 minutes**.
* **Intervals:** treat reservations as **\[start, end)** (end exclusive).
* **Timezone:** IANA zone at restaurant level (e.g., `America/Argentina/Buenos_Aires`).
* **Shifts:** if present, reservations must fall within shift windows; otherwise the day is fully available.

---

## 3) Domain Model

> Every entity includes audit metadata: `createdAt`, `updatedAt` (ISO 8601).

```ts
type ISODateTime = string; // e.g., "2025-09-08T20:00:00-03:00"

interface Restaurant {
  id: string;
  name: string;
  timezone: string;                                // IANA
  shifts?: Array<{ start: string; end: string }>;  // "HH:mm"
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface Sector {
  id: string;
  restaurantId: string;
  name: string;                                    // e.g., "Main Hall", "Terrace", "Bar"
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface Table {
  id: string;
  sectorId: string;
  name: string;
  minSize: number;                                 // minimum party size
  maxSize: number;                                 // maximum party size
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface Customer {
  name: string;
  phone: string;
  email: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

type ReservationStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';

interface Reservation {
  id: string;
  restaurantId: string;
  sectorId: string;
  tableIds: string[];                              // CORE: single table; BONUS: combinations
  partySize: number;
  startDateTimeISO: ISODateTime;
  endDateTimeISO: ISODateTime;
  status: ReservationStatus;                       // CORE uses CONFIRMED | CANCELLED
  customer: Customer;
  notes?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
```

---

## 4) CORE Requirements (target: \~2 hours)

1. **Availability (15-min slots) per sector**

* Endpoint that returns **15-minute slots** for a given date, sector, and party size.
* Respect **shifts** when defined; otherwise allow the **full day**.
* Account for all **existing reservations** (and cancellations).

2. **Table assignment (single table)**

* Given `sectorId`, `startDateTimeISO`, and `partySize`, assign **one table** that satisfies `minSize ≤ partySize ≤ maxSize` with **no overlap** against existing reservations.
* There must be an **efficient table-assignment algorithm**.

3. **Atomicity & idempotency**

* Prevent **double-booking** under concurrency (e.g., logical lock per sector+slot).
* Implement **idempotency** for `POST /reservations` via `Idempotency-Key`.

4. **Reservation management**

* Create reservations with automatic assignment (set `createdAt/updatedAt`).
* **Cancel** (delete) reservations and reflect availability **immediately** (update `updatedAt`).
* Persist and return **customer details** (`name`, `phone`, `email`).

5. **List reservations for a day (mandatory)**

* Endpoint must list **all reservations for a specific day**.
* Optional `sectorId` query param: if provided → return that sector only; if omitted → return **all sectors** for that day.

6. **Errors & validation**

* Use `400` (invalid format), `404` (entity not found), `409` (no capacity), `422` (outside service window or policy violation).

---

## 5) API Specification

### 5.1 Check availability (CORE)

```
GET /availability?restaurantId=R1&sectorId=S1&date=2025-09-08&partySize=4
```

**200 OK**

```json
{
  "slotMinutes": 15,
  "durationMinutes": 90,
  "slots": [
    { "start": "2025-09-08T20:00:00-03:00", "available": true,  "tables": ["T4"] },
    { "start": "2025-09-08T20:15:00-03:00", "available": false, "reason": "no_capacity" }
  ]
}
```

**422 Unprocessable Entity**

```json
{ "error": "outside_service_window", "detail": "Requested time is outside shifts" }
```

---

### 5.2 Create reservation (CORE)

```
POST /reservations
Headers: { "Idempotency-Key": "abc-123" }
Body:
{
  "restaurantId": "R1",
  "sectorId": "S1",
  "partySize": 4,
  "startDateTimeISO": "2025-09-08T20:00:00-03:00",
  "customer": { "name": "John Doe", "phone": "+54 9 11 5555-1234", "email": "john.doe@mail.com" },
  "notes": "Anniversary"
}
```

**201 Created**

```json
{
  "id": "RES_001",
  "restaurantId": "R1",
  "sectorId": "S1",
  "tableIds": ["T4"],
  "partySize": 4,
  "start": "2025-09-08T20:00:00-03:00",
  "end": "2025-09-08T21:30:00-03:00",
  "status": "CONFIRMED",
  "customer": { "name": "John Doe", "phone": "+54 9 11 5555-1234", "email": "john.doe@mail.com" },
  "createdAt": "2025-09-08T19:50:21-03:00",
  "updatedAt": "2025-09-08T19:50:21-03:00"
}
```

**409 Conflict**

```json
{ "error": "no_capacity", "detail": "No available table fits party size at requested time" }
```

---

### 5.3 Cancel reservation (CORE)

```
DELETE /reservations/RES_001
```

**204 No Content**

---

### 5.4 List reservations for a day (CORE, mandatory)

```
GET /reservations/day?restaurantId=R1&date=2025-09-08[&sectorId=S1]
```

* If `sectorId` is present → return only that sector.
* If `sectorId` is omitted → return **all sectors**.

**200 OK**

```json
{
  "date": "2025-09-08",
  "items": [
    {
      "id": "RES_001",
      "sectorId": "S1",
      "tableIds": ["T4"],
      "partySize": 4,
      "start": "2025-09-08T20:00:00-03:00",
      "end": "2025-09-08T21:30:00-03:00",
      "status": "CONFIRMED",
      "customer": { "name": "John Doe", "phone": "...", "email": "..." },
      "createdAt": "2025-09-08T19:50:21-03:00",
      "updatedAt": "2025-09-08T19:50:21-03:00"
    }
  ]
}
```

---

## 6) Acceptance Criteria (CORE)

* **Availability** returns **15-minute slots**, respecting shifts (if any) or the full day.
* **Concurrency:** simultaneous requests for the same sector/slot **do not** produce double bookings.
* **Idempotency:** retrying `POST /reservations` with the same `Idempotency-Key` **does not** create duplicates.
* **Timestamps:** on create set `createdAt/updatedAt`; on cancel/edit update `updatedAt`.
* **Customer data** is persisted and visible in list/detail responses.
* **Daily listing** works with and without `sectorId`.
* Correct error codes/messages (`400/404/409/422`).

---

## 7) Minimal Test Cases

1. **Happy path:** create a valid reservation → `201`; same slot becomes unavailable.
2. **Concurrency:** two concurrent creates for same slot → one `201`, the other `409`.
3. **Boundary:** adjacent reservations touching at end-exclusive do not collide.
4. **Shifts:** attempt outside shift → `422`.
5. **Idempotency:** repeat create with same `Idempotency-Key` returns the same reservation.
6. **Cancel:** `DELETE` → `204`, slot returns to available.
7. **Daily listing:** with and without `sectorId` returns correct sets.
8. **Timestamps:** verify `createdAt/updatedAt` on create/cancel.

---

## 8) BONUS (ordered by priority)

### BONUS 1 — **Frontend demo (Next.js/React)**

**Primary goal:** day view of reservations **grouped by sector**, with an optional **time-slot filter** (show only a selected slot or **all slots**).

* Must allow **changing the day** and live-update the view.
* Include a button to **create a random/sample reservation** for testing.
* Include actions to **delete** a reservation from the list.
* (Optional) simple **floor-plan** visualization.

### BONUS 2 — **Functional public deploy (high weight)**

* Publish a **live URL** (e.g., Vercel).
* Document env vars and steps in README.
* Reliability and reproducibility carry **significant weight**.

### BONUS 3 — **Database persistence (SQL or NoSQL)**

* Implement a DB layer (e.g., **Postgres/MySQL/SQLite** via Prisma/Drizzle/Knex; or **MongoDB/DynamoDB**).
* Basic schema/migrations and repositories for `Restaurant/Sector/Table/Reservation`.
* Persist (and/or default) `createdAt/updatedAt` at DB level when possible.

### BONUS 4 — **Large-group approval flow**

* Configurable `largeGroupThreshold` (e.g., ≥ 8).
* Large parties create `PENDING` holds with TTL; approve → confirm; reject → release.

### BONUS 5 — **Table combinations within a sector**

* Allow assigning **multiple tables** when no single table fits.
* Return `tableIds` and a brief human explanation.

### BONUS 6 — **Advance booking policy**

* Enforce `{ minAdvanceMinutes, maxAdvanceDays }`; outside range → `422`.

### BONUS 7 — **Variable duration by party size**

* Example rules: `≤2 → 75'`, `≤4 → 90'`, `≤8 → 120'`, `>8 → 150'`; availability must reflect duration.

### BONUS 8 — **Waitlist with auto-promotion**

* If no capacity, enqueue; when capacity frees, auto-promote the first that fits.

### BONUS 9 — **Edit reservation**

```
PATCH /reservations/:id
```

* Change **time**, **sector**, **partySize**, **customer**, or **notes**.
* Re-validate, **re-assign atomically**; if not possible, `409` (no partial update).
* Support `Idempotency-Key`; update `updatedAt`.

### BONUS 10 — **Re-optimization per sector & slot**

* After **delete/edit** (or on demand), run an **optimization** for a **sector** and **slot** that:

  * **Re-assigns** all affected reservations to maximize capacity / minimize waste, no collisions.
  * Preserve reservation IDs; update only `tableIds` (and `end` if duration rules apply).
* Suggested endpoint:

```
POST /optimize
Body: { restaurantId, sectorId, date: "YYYY-MM-DD", slotStartISO: "..." }
```

* Return a summary of changes (before → after).

---

## 9) Seed Data (example)

```json
{
  "restaurant": {
    "id": "R1",
    "name": "Bistro Central",
    "timezone": "America/Argentina/Buenos_Aires",
    "shifts": [
      { "start": "12:00", "end": "16:00" },
      { "start": "20:00", "end": "23:45" }
    ],
    "createdAt": "2025-09-08T00:00:00-03:00",
    "updatedAt": "2025-09-08T00:00:00-03:00"
  },
  "sectors": [
    { "id": "S1", "restaurantId": "R1", "name": "Main Hall", "createdAt": "2025-09-08T00:00:00-03:00", "updatedAt": "2025-09-08T00:00:00-03:00" },
    { "id": "S2", "restaurantId": "R1", "name": "Terrace",  "createdAt": "2025-09-08T00:00:00-03:00", "updatedAt": "2025-09-08T00:00:00-03:00" }
  ],
  "tables": [
    { "id": "T1", "sectorId": "S1", "name": "Table 1", "minSize": 2, "maxSize": 2, "createdAt": "2025-09-08T00:00:00-03:00", "updatedAt": "2025-09-08T00:00:00-03:00" },
    { "id": "T2", "sectorId": "S1", "name": "Table 2", "minSize": 2, "maxSize": 4, "createdAt": "2025-09-08T00:00:00-03:00", "updatedAt": "2025-09-08T00:00:00-03:00" },
    { "id": "T3", "sectorId": "S1", "name": "Table 3", "minSize": 2, "maxSize": 4, "createdAt": "2025-09-08T00:00:00-03:00", "updatedAt": "2025-09-08T00:00:00-03:00" },
    { "id": "T4", "sectorId": "S1", "name": "Table 4", "minSize": 4, "maxSize": 6, "createdAt": "2025-09-08T00:00:00-03:00", "updatedAt": "2025-09-08T00:00:00-03:00" },
    { "id": "T5", "sectorId": "S2", "name": "Table 5", "minSize": 2, "maxSize": 2, "createdAt": "2025-09-08T00:00:00-03:00", "updatedAt": "2025-09-08T00:00:00-03:00" }
  ]
}
```

---

## 10) Technical Requirements

* **Stack:** Node.js, TypeScript, Express or Fastify, Zod (validation), Pino (logs), Vitest/Jest (tests).
* **Persistence:** **in-memory** allowed for CORE.
* **HTTP:** `200/201/204/400/404/409/422/429/5xx`; `Idempotency-Key` on mutating endpoints; optional `requestId` echo.

**Observability (recommended)**

* Logs such as `{ requestId, sectorId, partySize, operation, durationMs, outcome }`.
* Simple counters (created/cancelled, conflict rate, hold expirations).

---

## 11) Deliverables

1. **README.md** — How to run, API docs, design decisions, assumptions, limitations, (**public URL** if deployed).
2. **Source code** — Well-typed TS, at least **3 meaningful tests** (concurrency/409, idempotency, time boundaries); env & scripts.
3. **(BONUS 1) Frontend** — Next.js/React day view grouped by sector; optional slot filter; day switching; create sample; delete.
4. **(BONUS 2) Public Deploy** — Live backend/frontend (e.g., Vercel).
5. **(BONUS 3) Database** — Schema/migrations and data access layer (SQL or NoSQL).
