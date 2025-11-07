# WokiBrain

> **Purpose (Woki):** A compact, Woki-branded challenge that discovers **when** and **how** to seat a party using **single tables or table combinations**. Focus on gap discovery, deterministic **WokiBrain** selection, and a minimal yet robust API.

---

## 1. Goal

Implement **WokiBrain**, a small booking engine for restaurants that:

1. Manages **Sectors** containing **Tables** with capacity ranges
2. Accepts **variable durations** (multiples of 15′)
3. Selects a slot and seating configuration (single table **or** combos of any size) using a clear, documented selection strategy
4. Enforces basic **concurrency** (no double booking) and **idempotency** for create
5. Exposes a **tiny API** (3 endpoints) to discover candidates, create a booking, and list the day's bookings

> **Combos:** Unlimited table combinations are allowed. Each combination must derive its **own capacity range** (min/max) using a documented heuristic.

---

## 2. Time Model

| Aspect | Description |
|--------|-------------|
| **Grid** | Fixed 15-te granularity |
| **Durations** | Multiples of 15 minutes (min 30, max 180 **suggested**) |
| **Intervals** | **[start, end)** (end exclusive); adjacent bookings do not conflict |
| **Timezone** | IANA per **Restaurant** (e.g., `America/Argentina/Buenos_Aires`) |
| **Service windows** | Optional array per restaurant/sector: `{ start: "HH:mm", end: "HH:mm" }` |

**Service Window Rules:**
- If present: bookings must lie entirely within one window
- If absent: treat the full day as open

---

## 3. Minimal Domain (in-memory allowed)

All entities have `createdAt` and `updatedAt` (ISO 8601).

```typescript
type ISODateTime = string;

interface Restaurant {
  id: string;
  name: string;
  timezone: string;
  windows?: Array<{ start: string; end: string }>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface Sector {
  id: string;
  restaurantId: string;
  name: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface Table {
  id: string;
  sectorId: string;
  name: string;
  minSize: number;
  maxSize: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

type BookingStatus = 'CONFIRMED' | 'CANCELLED';

interface Booking {
  id: string;
  restaurantId: string;
  sectorId: string;
  tableIds: string[];         // single or combo (any length)
  partySize: number;
  start: ISODateTime;         // [start,end)
  end: ISODateTime;
  durationMinutes: number;
  status: BookingStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
```

### Combo Capacity Heuristic (Required)

Define how you compute min/max for any combination of tables:
- Simple sums
- Sums minus merge penalties
- Max-of-mins
- Other approaches

**Document your choice in the README.**

---

## 4. Core Logic & Rules

### 4.1 Gap Discovery

For each table and service window on a day:

1. Normalize existing `CONFIRMED` bookings to `[start, end)` and sort
2. Add sentinels at window start/end
3. Walk adjacent pairs → gaps `(prevEnd, nextStart)`

### 4.2 Combo Gaps (N Tables)

For any combination of tables within the sector:
- Intersect their gap sets to obtain combo gaps where all tables are simultaneously free
- A combo candidate fits if:
  - Intersection gap length ≥ `durationMinutes`
  - Party fits within the derived combo capacity range

**Optimization:** You may use any reasonable pruning/heuristic to keep search efficient. Justify it briefly in the README.

### 4.3 WokiBrain Selection

Define your own selection strategy for choosing among valid single-table and combination candidates.

**Your method must:**
- ✅ Be deterministic given the same inputs
- ✅ Be documented in the README (what it optimizes, any tie-breakers or fairness rules)
- ✅ Return one feasible option (or `no_capacity`) that respects service windows, grid, and no-overlap
- 🎯 **Optional:** Expose a score/rationale in API responses (shape is up to you)

### 4.4 Atomic Create + Idempotency

**Lock Key:** `(restaurantId, sectorId, tableId(s), start)`
- Use a normalized composite (e.g., `S1|T2+T3|2025-10-22T20:00:00-03:00`)
- Acquire before writing
- Release with `finally`

**Collision Check:** After picking the candidate, verify against latest in-memory state

**Idempotency:** 
- `POST /woki/bookings` accepts `Idempotency-Key`
- Same key and payload returns the same booking object for at least 60s

### 4.5 Validation & Errors

| Status | Error | Description |
|--------|-------|-------------|
| **400** | `invalid_input` | Non-grid times/durations, bad formats, negative party, etc. |
| **404** | `not_found` | Restaurant/sector not found |
| **409** | `no_capacity` | No single nor combo fits on the requested day/window |
| **422** | `outside_service_window` | Specified window lies outside service hours |

---

## 5. Minimal API (3 Endpoints)

### 5.1 Discover Seats (No Mutation)

**Endpoint:** `GET /woki/discover`

**Query Parameters:**
```
restaurantId=R1
sectorId=S1
date=2025-10-22
partySize=5
duration=90
windowStart=20:00      (optional)
windowEnd=23:45        (optional)
limit=10               (optional)
```

#### Success Response (200)

```json
{
  "slotMinutes": 15,
  "durationMinutes": 90,
  "candidates": [
    {
      "kind": "single",
      "tableIds": ["T4"],
      "start": "2025-10-22T20:00:00-03:00",
      "end": "2025-10-22T21:30:00-03:00"
    },
    {
      "kind": "combo",
      "tableIds": ["T2", "T3"],
      "start": "2025-10-22T20:15:00-03:00",
      "end": "2025-10-22T21:45:00-03:00"
    }
  ]
}
```

> **Note:** Fields beyond `start`/`end` are illustrative; you may return your own score or rationale.

#### Error Responses

**409 - No Capacity:**
```json
{
  "error": "no_capacity",
  "detail": "No single or combo gap fits duration within window"
}
```

**422 - Outside Service Window:**
```json
{
  "error": "outside_service_window",
  "detail": "Window does not intersect service hours"
}
```

---

### 5.2 Create Booking (Atomic)

**Endpoint:** `POST /woki/bookings`

**Headers:**
```http
Idempotency-Key: abc-123
```

**Request Body:**
```json
{
  "restaurantId": "R1",
  "sectorId": "S1",
  "partySize": 5,
  "durationMinutes": 90,
  "date": "2025-10-22",
  "windowStart": "20:00",
  "windowEnd": "23:45"
}
```

#### Success Response (201)

```json
{
  "id": "BK_001",
  "restaurantId": "R1",
  "sectorId": "S1",
  "tableIds": ["T4"],
  "partySize": 5,
  "start": "2025-10-22T20:00:00-03:00",
  "end": "2025-10-22T21:30:00-03:00",
  "durationMinutes": 90,
  "status": "CONFIRMED",
  "createdAt": "2025-10-22T19:50:21-03:00",
  "updatedAt": "2025-10-22T19:50:21-03:00"
}
```

#### Error Response (409)

```json
{
  "error": "no_capacity",
  "detail": "No single or combo gap fits duration within window"
}
```

---

### 5.3 List Bookings for a Day

**Endpoint:** `GET /woki/bookings/day`

**Query Parameters:**
```
restaurantId=R1
sectorId=S1
date=2025-10-22
```

#### Success Response (200)

```json
{
  "date": "2025-10-22",
  "items": [
    {
      "id": "BK_001",
      "tableIds": ["T4"],
      "partySize": 5,
      "start": "2025-10-22T20:00:00-03:00",
      "end": "2025-10-22T21:30:00-03:00",
      "status": "CONFIRMED"
    }
  ]
}
```

---

### 5.4 Optional (Bonus)

**Delete Booking:**
```http
DELETE /woki/bookings/:id
```
- Response: **204** (free the slot immediately)

---

## 6. Acceptance Criteria

✅ **Discovery:** Returns deterministic candidates (singles and combos) honoring 15′ grid and service windows

✅ **WokiBrain Selection:** Deterministic with identical inputs; chosen criteria documented in README

✅ **Atomic Create:** Locking and idempotency; no double booking even under concurrent requests

✅ **Intervals:** Use `[start, end)`; touching bookings are valid

✅ **Timestamps:** Set on create; `updatedAt` changes on mutation

✅ **Error Handling:** 400/404/409/422 as specified

---

## 7. Minimal Test Cases

### Required Test Coverage

1. **Happy single:** Perfect gap on a single table for the requested duration
2. **Happy combo:** A valid combination exists when singles cannot fit
3. **Boundary:** Bookings touching at end are accepted (end-exclusive)
4. **Idempotency:** Repeat POST with same payload + `Idempotency-Key` returns the same booking
5. **Concurrency:** Two parallel creates targeting the same candidate → one 201, one 409
6. **Outside hours:** Request window outside service windows → 422

---

## 8. Seed Data (Example)

```json
{
  "restaurant": {
    "id": "R1",
    "name": "Bistro Central",
    "timezone": "America/Argentina/Buenos_Aires",
    "windows": [
      { "start": "12:00", "end": "16:00" },
      { "start": "20:00", "end": "23:45" }
    ],
    "createdAt": "2025-10-22T00:00:00-03:00",
    "updatedAt": "2025-10-22T00:00:00-03:00"
  },
  "sector": {
    "id": "S1",
    "restaurantId": "R1",
    "name": "Main Hall",
    "createdAt": "2025-10-22T00:00:00-03:00",
    "updatedAt": "2025-10-22T00:00:00-03:00"
  },
  "tables": [
    {
      "id": "T1",
      "sectorId": "S1",
      "name": "Table 1",
      "minSize": 2,
      "maxSize": 2,
      "createdAt": "2025-10-22T00:00:00-03:00",
      "updatedAt": "2025-10-22T00:00:00-03:00"
    },
    {
      "id": "T2",
      "sectorId": "S1",
      "name": "Table 2",
      "minSize": 2,
      "maxSize": 4,
      "createdAt": "2025-10-22T00:00:00-03:00",
      "updatedAt": "2025-10-22T00:00:00-03:00"
    },
    {
      "id": "T3",
      "sectorId": "S1",
      "name": "Table 3",
      "minSize": 2,
      "maxSize": 4,
      "createdAt": "2025-10-22T00:00:00-03:00",
      "updatedAt": "2025-10-22T00:00:00-03:00"
    },
    {
      "id": "T4",
      "sectorId": "S1",
      "name": "Table 4",
      "minSize": 4,
      "maxSize": 6,
      "createdAt": "2025-10-22T00:00:00-03:00",
      "updatedAt": "2025-10-22T00:00:00-03:00"
    },
    {
      "id": "T5",
      "sectorId": "S1",
      "name": "Table 5",
      "minSize": 2,
      "maxSize": 2,
      "createdAt": "2025-10-22T00:00:00-03:00",
      "updatedAt": "2025-10-22T00:00:00-03:00"
    }
  ],
  "bookings": [
    {
      "id": "B1",
      "restaurantId": "R1",
      "sectorId": "S1",
      "tableIds": ["T2"],
      "partySize": 3,
      "start": "2025-10-22T20:30:00-03:00",
      "end": "2025-10-22T21:15:00-03:00",
      "durationMinutes": 45,
      "status": "CONFIRMED",
      "createdAt": "2025-10-22T18:00:00-03:00",
      "updatedAt": "2025-10-22T18:00:00-03:00"
    }
  ]
}
```

### Usage Example

With this seed, a party of 5 asking for 90′ near 20:00 would typically seat on **T4** if free; otherwise consider combos like:
- `T2 + T3`
- `T1 + T2 + T3`

Using your combo capacity heuristic.

---

## 9. Technical Requirements

### Core Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express or Fastify
- **Validation:** Zod
- **Logging:** Pino
- **Testing:** Vitest/Jest (≥ 5 tests from §7, including combo intersection and determinism)
- **Persistence:** In-memory

### HTTP Standards

| Status | Usage |
|--------|-------|
| 200 | Success (GET) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |

**Special Headers:**
- `Idempotency-Key` on `POST /woki/bookings`

### Observability (Optional)

Log structure:
```typescript
{
  requestId: string;
  sectorId: string;
  partySize: number;
  duration: number;
  op: string;
  durationMs: number;
  outcome: string;
}
```

---

## 10. Suggested Structure

```
src/
  index.ts
  routes.ts
  domain/
    gaps.ts
    wokibrain.ts
  store/
    db.ts
  tests/
    wokibrain.spec.ts
    api.spec.ts
```

---

## 11. Evaluation Criteria

| Category | Weight | Focus |
|----------|--------|-------|
| **Correctness** | 50% | Gap discovery, combo intersections, `[start, end)`, deterministic WokiBrain |
| **Robustness** | 25% | Locking, idempotency, boundary cases |
| **Code Quality** | 15% | Types, clarity, cohesion, tests |
| **Developer Experience** | 10% | Easy to run, clear README, simple scripts |

---

## 12. Bonus Features (Choose Any)

### B1 — Variable Duration by Party Size

Example rules:
- ≤2 → 75′
- ≤4 → 90′
- ≤8 → 120′

Discovery and create must reflect duration.

### B2 — Repack on Change

Endpoint to re-optimize a sector/day minimizing total seat waste without altering durations.

### B3 — Large-Group Approval

Requests ≥ threshold become `PENDING` holds (TTL) requiring approval to confirm.

### B4 — Blackouts

Per-table maintenance or private event windows that block availability.

### B5 — Waitlist with Auto-Promotion

Enqueue on 409; when capacity frees, auto-promote if it fits.

### B6 — Performance Target

Handle ≥100 tables and ≥1000 bookings/day with predictable latency; justify complexity.

### B7 — Property-Based Tests

Generate random day layouts and assert invariants:
- No overlaps
- Windows respected
- Determinism

### B8 — Observability

Minimal `/metrics` counters:
- Created/cancelled/conflicts
- P95 assignment time
- Lock contention stats

### B9 — API Hardening

- Basic rate limiting
- 429 handling
- Persistent idempotency keys

---

## Summary

**WokiBrain** is a focused booking engine challenge that tests:
- Algorithm design (gap finding, combo intersection)
- System design (concurrency, idempotency)
- API design (clean, documented endpoints)
- Code quality (types, tests, clarity)

The goal is a production-ready prototype that elegantly handles the complexity of table combinations while maintaining simplicity and robustness.

**Good luck! 🧠🍽️**
