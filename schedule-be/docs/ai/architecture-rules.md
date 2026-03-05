# ShiftSync Backend — Architecture Rules

## General

- No markdown files created unless explicitly requested by the user
- All markdown goes in `docs/ai/` only

---

## Database

- `synchronize: false` — always use migrations, never auto-sync
- All timestamps stored in **UTC**; timezone stored as a string on the `Location` entity
- Use **pessimistic row locking** on `ShiftAssignment` writes for concurrency safety
- Migration commands: `migration:generate`, `migration:run`, `migration:revert`

---

## Module Structure

Every feature module follows this layout:

```
modules/<feature>/
├── entities/
│   └── <entity>.entity.ts
├── dto/
│   ├── request/
│   │   ├── create-<entity>.dto.ts
│   │   └── update-<entity>.dto.ts
│   └── response/
│       └── <entity>.response.dto.ts
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
└── <feature>.repository.ts        # optional custom repo
```

---

## Repository Pattern

- Use TypeORM's `Repository<Entity>` via `@InjectRepository(Entity)`
- Register with `TypeOrmModule.forFeature([Entity])` in the feature module
- For complex queries, create a custom `<Feature>Repository` class extending `Repository<Entity>`
- Services depend on repositories; controllers depend only on services

---

## DTOs

### Request DTOs
- Located in `dto/request/`
- Use `class-validator` decorators (`@IsString()`, `@IsUUID()`, `@IsEnum()`, etc.)
- Use `class-transformer` (`@Type()`, `@Transform()`) where needed
- Named: `CreateXDto`, `UpdateXDto`, `QueryXDto`

### Response DTOs
- Located in `dto/response/`
- Plain classes with explicit properties — no leaking of entity internals (e.g. no password)
- Named: `XResponseDto`, `XListResponseDto`
- Wrap list responses: `{ data: XResponseDto[], total: number, page: number }`
- Use a shared `ApiResponseDto<T>` wrapper for all endpoints

### Transformation
- Always use `plainToInstance()` from `class-transformer` to map entities → response DTOs
- Never return raw entity objects from controllers

---

## Constraint Engine

- All business rule validation lives in `shifts/constraint.service.ts`
- Returns structured result: `{ valid: boolean, violations: Violation[], suggestions: Suggestion[] }`
- Every violation includes: `rule`, `message`, `affectedUserId?`, `affectedShiftId?`

---

## Auth

- JWT access token (short-lived: 15min) + refresh token (7 days)
- Guards: `JwtAuthGuard` (default on all routes), `RolesGuard`
- Decorator: `@Roles(Role.Admin, Role.Manager)`
- Decorator: `@CurrentUser()` to extract user from request

---

## Real-Time

- Socket.IO via `@nestjs/websockets`
- Gateway lives in `modules/gateway/events.gateway.ts`
- Events: `schedule.published`, `shift.assigned`, `swap.requested`, `swap.resolved`, `conflict.detected`

---

## Audit Trail

- All schedule mutations trigger `AuditService.log()`
- Log stores: `userId`, `action`, `entityType`, `entityId`, `before`, `after`, `timestamp`
- Use an `AuditInterceptor` on mutating endpoints, or call explicitly from service layer

---

## Design Decisions (Ambiguities Resolved)

| Question | Decision |
|---|---|
| De-certification of staff from a location | Soft-delete: past assignments preserved, future flagged and blocked |
| Desired hours vs availability | Availability = hard constraint; desired hours = soft preference used only in analytics |
| Consecutive days — does a 1hr shift count? | Yes — any shift on a calendar day counts as a worked day |
| Shift edited after swap approval | Swap is auto-cancelled, both parties notified, manager re-approval required |
| Location spanning timezone boundary | Location has a single canonical timezone; edge cases documented |
