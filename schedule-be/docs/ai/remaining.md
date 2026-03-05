# ShiftSync — Remaining Work

_Snapshot: 2026-03-03. All items below are unbuilt. Pick up from here._

---

## ✅ Already Built

| Area | Notes |
|---|---|
| `common/` | Enums, guards, decorators, shared DTOs |
| `users/` | Entity, repo, service, controller, full availability/skills CRUD |
| `locations/` | Entity, service, controller, staff certification |
| `auth/` | JWT access (15m) + refresh (7d), login/register/refresh |
| `shifts/` | Entity, constraint engine (5 hard rules + overtime), service, controller |
| Migration | `1772536148452-InitialSchema` — generated, **run with `npm run migration:run`** |
| Swagger | All controllers + DTOs decorated — UI at `/api/docs` |

---

## ❌ Remaining Modules

### 1. `swaps/` — Shift Swap & Drop Requests
**Entities needed:**
- `SwapRequest` — shiftId, requesterId, covererId (nullable), type (`SwapType.SWAP | DROP`), status (`SwapStatus`), requesterNote, managerNote, resolvedById, resolvedAt

**Service logic:**
- `createSwapRequest(shiftId, userId, dto)` — staff initiates, must be assigned to shift
- `createDropRequest(shiftId, userId, dto)` — staff drops, manager approval required
- `acceptSwap(swapId, covererId)` — cover volunteer accepts (for SWAP type)
- `approveRequest(swapId, managerId)` — manager approves, triggers assignment transfer
- `denyRequest(swapId, managerId, reason)` — manager denies
- Constraint check on cover candidate before approval

**Enums already defined:** `SwapStatus`, `SwapType` in `common/enums/`

---

### 2. `schedules/` — Published Schedule Views
**No new entities** — views over existing shift + assignment data.

**Service logic:**
- `getWeeklySchedule(locationId, weekStart)` — shifts grouped by day, with assignments expanded to user names
- `getMySchedule(userId, weekStart)` — personal view
- `exportSchedule(locationId, weekStart)` — flat array suitable for CSV/PDF

**Controller:** `GET /schedules/:locationId/week?start=2025-07-14`

---

### 3. `notifications/` — In-App Notifications
**Entity needed:**
- `Notification` — userId, type (`NotificationType`), title, body, referenceId (nullable uuid), referenceType (nullable), isRead, readAt

**15 types already defined** in `common/enums/notification-type.enum.ts`.

**Service logic:**
- `create(userId, type, payload)` — internal factory used by other services
- `getForUser(userId, { unreadOnly })` — paginated list
- `markRead(notificationId, userId)`
- `markAllRead(userId)`

Notifications should be triggered by: shift published, swap requested/approved/denied, assignment added/removed, overtime warning.

---

### 4. `gateway/` — WebSocket (Socket.IO)
**NestJS Gateway** (`@WebSocketGateway`) for real-time push.

**Events to emit:**
- `shift:published` → all staff at location
- `shift:assigned` / `shift:unassigned` → target user
- `swap:requested` → manager + cover candidate
- `swap:approved` / `swap:denied` → requester
- `notification:new` → target user

**Auth:** validate JWT on `handleConnection`, attach user to socket.

**Rooms:** `location:{id}`, `user:{id}`

---

### 5. `audit/` — Audit Trail
**Entity needed:**
- `AuditLog` — actorId, action (string), entityType, entityId, before (jsonb nullable), after (jsonb nullable), ip (nullable), createdAt

**Actions to log:** staff assigned/unassigned, shift published/unpublished, swap approved/denied, manager override used, role changed.

**Service:** `log(actorId, action, entity, before?, after?)` — fire-and-forget, never throw.

---

### 6. `overtime/` + `analytics/`
**No new entities** — computed from existing data.

**Overtime service:**
- `getOvertimeSummary(locationId, weekStart)` — list of users projected/actual over 40h
- `getOvertimeAlerts(locationId)` — users at ≥ 35h with upcoming assigned shifts

**Analytics service:**
- `getLaborCostReport(locationId, startDate, endDate)` — hours by user, premium vs regular
- `getCoverageReport(locationId, weekStart)` — shifts under headcount each day
- `getUtilizationReport(locationId, weekStart)` — % of certified staff scheduled

---

### 7. Seed Data
**Script:** `src/database/seeds/seed.ts`  
Run with: `npm run seed`

Seed creates:
- 3 locations (Downtown, Midtown, Airport)
- 5 skills (Barista, Cashier, Kitchen, Supervisor, Drive-Thru)
- 1 admin, 2 managers, 6 staff users (all password: `Password1!`)
- Staff certifications across locations
- Weekly availability for all staff
- 10 sample shifts across locations (mix of draft + published)

---

## Order of Implementation

```
swaps/ → schedules/ → notifications/ → gateway/ → audit/ → overtime/analytics/ → seeds
```

---

## Testing the Current Build

See [`docs/ai/testing.md`](./testing.md) for step-by-step API testing guide.
