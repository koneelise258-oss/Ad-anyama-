# Security Specification — EEADCI Anyama Ran-Extension

## Phase 0: Data Invariants & Access Model

### Roles & Identities
- **Unauthenticated Visitor (`public`)**: Can read intentionally public church resources (`settings/{church,hero,siteImages,meta}`, `cultes` where `status == 'publie'`, `events`, `news`, `albums`, `albums/{albumId}/items`, `departments`). Cannot list/read `admins`, `authorized_emails`, `security_config`, `security_logs`, `drive_accounts`, `drive_folders`, `push_subscriptions`, or `push_history`. Can perform strictly bounded public engagement updates (`reactions`, `likes`, `viewsCount`, `readsCount`, `attendeesCount`, `poll`, appending a single comment or reporting a comment) and register their own Web Push endpoint in `push_subscriptions/{sha256Endpoint}`.
- **Verified Administrator (`isAdmin()`)**: Must satisfy `request.auth != null` AND `request.auth.token.email_verified == true` AND either:
  1. Email lowercase is a pre-seeded bootstrap administrator (`koneelise258@gmail.com`, `mikeyservice98@gmail.com`), OR
  2. Their UID exists in `/admins/{uid}`, OR
  3. Their verified lowercase email exists in `/authorized_emails/{emailKey}`.

### Core Invariants
1. **Default Deny**: No wildcard `match /{document=**}` rule anywhere.
2. **Draft Protection**: `cultes` with `status != 'publie'` (`brouillon`, `programme`) are readable ONLY by `isAdmin()`.
3. **Secret Gate Secrecy**: `security_config` (which stores `secretGateSlug`) is readable & writable ONLY by `isAdmin()`. Public gate verification compares SHA-256 hash stored in `settings/meta.gateHash`.
4. **Privilege Escalation Prevention**: Only `isAdmin()` can create/update/delete `/admins/*` or `/authorized_emails/*` or `/security_config/*`. Non-admins cannot grant themselves admin privileges or set `role`.
5. **PII & Endpoint Confidentiality**: `push_subscriptions` allows validated `create`/`update` by any client for their deterministic endpoint hash ID (`^[a-f0-9]{64}$`), while `read` and `delete` are strictly restricted to `isAdmin()` so nobody can harvest subscriber endpoints.
6. **Immutable Audit Logs**: `security_logs` and `push_history` allow `create` only by `isAdmin()` and forbid `update`/`delete`.
7. **Size & Type Bounding**: All public engagement updates validate field allowlists (`diff().affectedKeys().hasOnly(...)`), integer deltas (`+1` or `±1`), non-negative counters, and bounded comment arrays (`<= 500`).

---

## Dirty Dozen Red-Team Attack Payloads
1. **Unauthenticated Admin Escalation**: Visitor attempts `create` on `/admins/{anyUid}` or `/authorized_emails/attacker@gmail.com` -> **DENIED** (`!isAdmin()`).
2. **Unverified Email Bypass**: Attacker authenticates with a Firebase token claiming `email_verified: false` -> **DENIED** (`email_verified == true` check blocks bootstrap & whitelist lookup).
3. **Draft Sermon Leak**: Visitor calls `get` or `list` on `/cultes` without filtering `status == 'publie'` or fetches a draft ID directly -> **DENIED** unless `resource.data.status == 'publie'`.
4. **Secret Portal Slug Leak**: Visitor reads `/security_config/gate` to discover `secretGateSlug` -> **DENIED** (`!isAdmin()`).
5. **Public Content Defacement**: Visitor updates `/events/{id}` changing `title`, `description`, `coverImage`, or `date` alongside `likes` -> **DENIED** (`affectedKeys().hasOnly(['likes', 'attendeesCount', 'comments', 'poll', 'viewsCount'])`).
6. **Negative / Inflated Counter Abuse**: Visitor updates `/cultes/{id}` setting `viewsCount: 9999999` or `reactions.likes: -50` -> **DENIED** (delta bounded to `+1` / `>= 0`).
7. **Comment Erasure Attack**: Visitor updates `/news/{id}` with `comments: []` to wipe out existing comments -> **DENIED** (`request.resource.data.comments.size() >= resource.data.comments.size()`).
8. **Push Subscriber Harvesting**: Visitor calls `list` or `get` on `/push_subscriptions` to steal FCM push endpoints -> **DENIED** (`!isAdmin()`).
9. **Drive Metadata Leak**: Visitor calls `list` on `/drive_accounts` or `/drive_folders` -> **DENIED** (`!isAdmin()`).
10. **Audit Trail Tampering**: Attacker or compromised session tries `delete` or `update` on `/security_logs/{logId}` to erase tracks -> **DENIED** (`allow update, delete: if false`).
11. **Oversized Document DoS**: Public user pushes > 500 comments or oversized push endpoint (`> 1024` chars) -> **DENIED** (length & size bounds).
12. **Arbitrary Settings Overwrite**: Visitor writes to `/settings/church` to change `parishName` or inject malicious `logoUrl` -> **DENIED** (`!isAdmin()`).
