# Lifecycle — Create flow (WIP)

Status: **frontend built, backend wiring undecided.** The "Create" action is a
stubbed no-op today. This note captures the current state and the backend
findings so the create-request wiring can be decided (targeted: Monday, once
backend availability is confirmed).

## What is built (frontend)

- **Empty state** (`pages/BaseLifecycle.tsx`) — when a workspace has no
  lifecycle, a "Configure a New Lifecycle" state links to `/lifecycle/new`.
  (Committed earlier as `59b71a1`.)
- **Create page** (`pages/CreateLifecycle.tsx`, committed `a4b15e1`):
  - Full-screen "Lifecycle Settings" editor: top nav (back + title, Cancel,
    Create) + a centered "Stage Configuration" card.
  - Five collapsible stage panels (`components/StageConfigurationPanel.tsx`),
    order `AWARE → ENGAGED → PIPELINE → ONBOARDING → ESTABLISHED`.
  - Each stage: a **Trigger** built as a progressive picker chain
    (Entity → Field → Operator → Value); each picker appears only after the
    previous is filled. Filling the last one flips the stage badge to
    "Configured".
  - **Max Time in Stage**: a toggle + a number input (capped at 90 days) + a
    click-triggered help popover.
  - Constants/placeholder data in `utils/stageConfiguration.ts`
    (`CONDITION_STEPS`, `ENTITY_OPTIONS`, `FIELD/OPERATOR/VALUE_OPTIONS`,
    `DEFAULT_MAX_DAYS`).
  - Route `LIFECYCLE_CREATE` (`/lifecycle/new`) registered in
    `shared/pages/AppSidebarRoutes.jsx`, LDP-gated. It **404s when a lifecycle
    already exists** (one lifecycle per workspace).

Placeholder data: entity/field/operator/value options and the shared stage
description are hardcoded stand-ins. The "Create" button navigates back without
persisting.

## Backend findings (recon)

Repos inspected: faro backend (`modules/osb-faro-*`) and asah
(`~/dev/projects/ac/com-liferay-osb-asah-private`). The frontend calls faro at
`contacts/{groupId}/account-lifecycle`; faro delegates to asah via
`ContactsEngineClient` (HATEOAS rels).

### What IS wired (faro → asah)

| Operation | Faro endpoint | asah |
| --- | --- | --- |
| Create lifecycle | `POST contacts/{groupId}/account-lifecycle` (form: `description`, `name`, `segmentId`) | `POST /account-lifecycles` → `AccountLifecycleDog.addAccountLifecycle` → Postgres |
| Update lifecycle | `PUT .../account-lifecycle/{id}` (same fields) | `PUT /account-lifecycles/{id}` |
| Configure a stage's condition | `PUT .../account-lifecycle/{id}/stages/{stageId}/rules` (form: `filter`, `filterMetadata`, `name`) | `PUT /account-lifecycles/{id}/stages/{stageId}/rules` → rewrites the stage's backing Segment |

### Gaps vs the create page as designed

1. **Create is lifecycle-level only.** `addAccountLifecycle(description, name,
   segmentId)` saves one row — no stages in the payload. There is **no
   full-config / bulk create**.
2. **No stage-creation path anywhere.** `AccountLifecycleStage` rows must
   pre-exist (only test fixtures insert them; the upgrade just creates empty
   tables). No `save` on the stage repo in main code.
3. **`maxDuration` (Max Time in Stage) has no setter.** It is a column on
   `AccountLifecycleStage`, not on the Segment. The only stage-write endpoint
   (`/rules`) updates the backing Segment's `filter`/`name`, not `maxDuration`.
4. **Stage condition is an opaque Segment filter**, not structured
   entity/field/operator/value. A stage's trigger = a Segment (`filterString` +
   `filterMetadata`, `SegmentCategory.LIFECYCLE`), parsed by the segment
   filter-expression engine (`EventCriteria` = activity key + operator + value +
   negation). The UI picker chain must be serialized into that filter format.

### Data model mapping (as stored in asah)

- `AccountLifecycle` = `{id, name, description, segmentId}` — `segmentId` is the
  lifecycle **population** (the outer account filter), NOT a trigger.
- `AccountLifecycleStage` = `{id, accountLifecycleId, stageType, displayOrder,
  maxDuration, segmentId, description}` — the stage's **`segmentId` is its
  trigger/entry condition** (this is the "trigger = segment").
- Per-account stage membership (`BQAccountLifecycleState`) is **computed** by a
  batch job (`AccountLifecycleNanite`), not configured.

## Pending decision (Monday)

To make "create the full lifecycle from one config screen" real, the only viable
path is **A** (B dead-ends):

- **A. New "create full lifecycle" backend operation** — accepts the lifecycle
  plus its stages (each with a trigger filter + `maxDuration`) and actually
  inserts the stage rows. Net-new in asah (endpoint + `AccountLifecycleDog`
  create-stage + persistence) with a faro passthrough (controller +
  `ContactsEngineClient` method). Fits the "one config" vision.
- **B. Frontend orchestration over existing endpoints** — create lifecycle, then
  per stage… **dead-ends**: stage creation and the `maxDuration` setter don't
  exist.

Open design questions for Monday:
- What is the lifecycle-level `segmentId` (population) in this UI? The create page
  collects no name/description/segment today.
- Confirm the segment `filterString` / `filterMetadata` format so the trigger
  picker chain can serialize to it.

## Key files

Frontend:
- `pages/CreateLifecycle.tsx`, `pages/BaseLifecycle.tsx`
- `components/StageConfigurationPanel.tsx`, `components/LifecycleSettingsToolbar.tsx`
- `utils/stageConfiguration.ts`
- `shared/pages/AppSidebarRoutes.jsx` (route), `shared/api/lifecycle.ts` (GET-only today)

Faro backend (`modules/`):
- `osb-faro-web/.../controller/contacts/AccountLifecycleFaroController.java`
- `osb-faro-engine-client/.../ContactsEngineClient.java` (+ `internal/ContactsEngineClientImpl.java`)
- `osb-faro-engine-client/.../model/AccountLifecycle*.java`

asah backend (`~/dev/projects/ac/com-liferay-osb-asah-private`):
- `osb-asah-backend/.../rest/controller/AccountLifecycleRestController.java`
- `osb-asah-common/.../dog/AccountLifecycleDog.java`
- `osb-asah-common/.../entity/AccountLifecycle.java`, `AccountLifecycleStage.java`, `Segment.java`
- `osb-asah-batch-curator/.../nanite/AccountLifecycleNanite.java`
