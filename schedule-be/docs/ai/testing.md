# API Testing Guide — ShiftSync

_Pre-requisite: PostgreSQL running on `localhost:5432`, db `scheduler`, user/pass `postgres/postgres`_

---

## 1. Run Migration

```bash
npm run migration:run
```

Verify tables exist:
```bash
psql -U postgres -d scheduler -c "\dt"
```

Expected: `users`, `skills`, `user_skills`, `availabilities`, `availability_exceptions`, `locations`, `staff_locations`, `shifts`, `shift_assignments`.

---

## 2. Seed Sample Data

```bash
npm run seed
```

Creates:
- **3 locations** — Downtown, Midtown, Airport
- **5 skills** — Barista, Cashier, Kitchen, Supervisor, Drive-Thru
- **9 users** — 1 admin, 2 managers, 6 staff  
  All passwords: `Password1!`

| Email | Role | Password |
|---|---|---|
| `admin@coastaleats.com` | ADMIN | `Password1!` |
| `manager.downtown@coastaleats.com` | MANAGER | `Password1!` |
| `manager.midtown@coastaleats.com` | MANAGER | `Password1!` |
| `alex@coastaleats.com` | STAFF | `Password1!` |
| `beth@coastaleats.com` | STAFF | `Password1!` |
| `carl@coastaleats.com` | STAFF | `Password1!` |
| `dana@coastaleats.com` | STAFF | `Password1!` |
| `evan@coastaleats.com` | STAFF | `Password1!` |
| `fiona@coastaleats.com` | STAFF | `Password1!` |

---

## 3. Start the Server

```bash
npm run start:dev
```

- **Base URL:** `http://localhost:3000/api/v1`
- **Swagger UI:** `http://localhost:3000/api/docs`

---

## 4. Swagger UI (Recommended)

Open `http://localhost:3000/api/docs` in a browser.

1. Call `POST /auth/login` with `admin@coastaleats.com` / `Password1!`
2. Copy the `accessToken` from the response
3. Click **Authorize** (top right), paste the token
4. All protected endpoints are now unlocked

---

## 5. Manual cURL Flows

### Login
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coastaleats.com","password":"Password1!"}' | jq .
```

Save the token:
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coastaleats.com","password":"Password1!"}' | jq -r '.data.accessToken')
```

### List Users
```bash
curl -s http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### List Locations
```bash
curl -s http://localhost:3000/api/v1/locations \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### List Shifts
```bash
curl -s http://localhost:3000/api/v1/shifts \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Create a Shift
```bash
# Get a location ID first
LOC_ID=$(curl -s http://localhost:3000/api/v1/locations \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

curl -s -X POST http://localhost:3000/api/v1/shifts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"locationId\": \"$LOC_ID\",
    \"startTime\": \"2026-03-10T17:00:00Z\",
    \"endTime\": \"2026-03-11T01:00:00Z\",
    \"headcount\": 2,
    \"notes\": \"Busy Tuesday dinner\"
  }" | jq .
```

### Publish a Shift
```bash
SHIFT_ID=<shift-id-from-above>
curl -s -X POST http://localhost:3000/api/v1/shifts/$SHIFT_ID/publish \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Assign Staff to Shift
```bash
USER_ID=$(curl -s "http://localhost:3000/api/v1/users?role=staff" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.items[0].id')

curl -s -X POST http://localhost:3000/api/v1/shifts/$SHIFT_ID/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\"}" | jq .
```

Constraint violations (double booking, no certification, etc.) will return `400` with a `violations` array and `suggestions`.

### Refresh Token
```bash
REFRESH=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coastaleats.com","password":"Password1!"}' | jq -r '.data.refreshToken')

curl -s -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH\"}" | jq .
```

---

## 6. Key Constraint Tests

| Scenario | Expected |
|---|---|
| Assign staff to shift at location they're not certified for | `400` — `LOCATION_CERTIFICATION` violation |
| Assign staff who overlaps another shift (same time, any location) | `400` — `DOUBLE_BOOKING` violation |
| Assign staff with < 10h since last shift end | `400` — `MIN_REST_PERIOD` violation |
| Assign when shift requires a skill the staff doesn't have | `400` — `SKILL_REQUIREMENT` violation |
| Assign on a day staff marked unavailable | `400` — `AVAILABILITY_RECURRING` violation |
| Any of above with `?override=true` | Still `400` for hard rules (all above are hard blocks) |
| Staff projected to exceed 40h/week | `200` with `warnings` array (soft — not blocked) |

---

## 7. Useful psql Queries

```sql
-- all users
SELECT id, email, role FROM users;

-- staff certifications
SELECT u.email, l.name, sl.is_active
FROM staff_locations sl
JOIN users u ON u.id = sl.user_id
JOIN locations l ON l.id = sl.location_id;

-- upcoming shifts with assignment count
SELECT s.id, l.name, s.start_time, s.status, COUNT(sa.id) as assigned
FROM shifts s
JOIN locations l ON l.id = s.location_id
LEFT JOIN shift_assignments sa ON sa.shift_id = s.id
GROUP BY s.id, l.name, s.start_time, s.status
ORDER BY s.start_time;
```
