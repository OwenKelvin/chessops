# Plan: API Developer Portal Documentation UI

## Context

The chessops project has a comprehensive NestJS API but no developer documentation. The user wants a modern, Stripe-like API reference documentation UI in the Angular portal.

## Complete API Routes Inventory

After analyzing all controllers in `apps/api/src/`, here are the actual routes to document:

### 1. Authentication & Identity (`/auth`)

| Method | Path | Controller | Auth | Description |
|--------|------|------------|------|-------------|
| POST | /auth/register | auth.controller.ts | Public | Register new user |
| POST | /auth/verify-email | auth.controller.ts | Public | Verify email with token |
| POST | /auth/resend-verification | auth.controller.ts | Public | Resend verification email |
| POST | /auth/login | auth.controller.ts | Public | Login user |
| POST | /auth/logout | auth.controller.ts | JWT | Logout user |
| GET | /auth/me | auth.controller.ts | JWT | Get current user profile |
| PATCH | /auth/me | auth.controller.ts | JWT | Update profile |
| DELETE | /auth/me | auth.controller.ts | JWT | Delete account |
| POST | /auth/change-password | auth.controller.ts | JWT | Change password |
| POST | /auth/revoke-sessions | auth.controller.ts | JWT | Revoke all sessions |
| POST | /auth/token/refresh | auth.controller.ts | Public | Refresh access token |
| POST | /auth/token/revoke | auth.controller.ts | JWT | Revoke refresh token |
| POST | /auth/forgot-password | auth-recovery.controller.ts | Public | Request password reset |
| POST | /auth/reset-password | auth-recovery.controller.ts | Public | Reset password with token |
| GET | /auth/google | oauth.controller.ts | Public | Initiate Google OAuth |
| GET | /auth/google/callback | oauth.controller.ts | Public | Google OAuth callback |
| GET | /auth/github | oauth.controller.ts | Public | Initiate GitHub OAuth |
| GET | /auth/github/callback | oauth.controller.ts | Public | GitHub OAuth callback |

### 2. MFA (`/mfa`)

| Method | Path | Controller | Auth | Description |
|--------|------|------------|------|-------------|
| GET | /mfa/setup | mfa.controller.ts | JWT | Get TOTP secret |
| POST | /mfa/enable | mfa.controller.ts | JWT | Enable MFA |
| POST | /mfa/disable | mfa.controller.ts | JWT | Disable MFA |
| POST | /mfa/verify | mfa.controller.ts | JWT | Verify TOTP token |
| POST | /mfa/verify-backup | mfa.controller.ts | JWT | Verify backup code |
| GET | /mfa/status | mfa.controller.ts | JWT | Get MFA status |
| POST | /mfa/challenge | mfa.controller.ts | JWT | Complete MFA challenge |

### 3. Admin (`/admin`)

| Method | Path | Controller | Auth | Description |
|--------|------|------------|------|-------------|
| GET | /admin/users | admin.controller.ts | Admin | List all users |
| PATCH | /admin/users/:id/suspend | admin.controller.ts | Admin | Suspend/unsuspend user |
| POST | /admin/users/:id/impersonate | admin.controller.ts | Admin | Impersonate user |

### 4. Players (`/players`)

| Method | Path | Controller | Auth | Description |
|--------|------|------------|------|-------------|
| POST | /players | player.controller.ts | JWT | Create player |
| GET | /players | player.controller.ts | JWT | List all players |
| GET | /players/:id | player.controller.ts | JWT | Get player details |
| PATCH | /players/:id | player.controller.ts | JWT | Update player |
| DELETE | /players/:id | player.controller.ts | JWT | Delete player |
| GET | /players/:id/statistics | player.controller.ts | Public | Get player statistics |

### 5. Tournaments (`/tournaments`)

| Method | Path | Controller | Auth | Description |
|--------|------|------------|------|-------------|
| POST | /tournaments | tournament.controller.ts | JWT | Create tournament |
| GET | /tournaments | tournament.controller.ts | JWT | List tournaments |
| GET | /tournaments/:id | tournament.controller.ts | JWT | Get tournament details |
| PATCH | /tournaments/:id | tournament.controller.ts | JWT | Update tournament |
| DELETE | /tournaments/:id | tournament.controller.ts | JWT | Delete tournament |
| POST | /tournaments/:id/players | tournament.controller.ts | JWT | Add player to tournament |
| DELETE | /tournaments/:id/players/:playerId | tournament.controller.ts | JWT | Remove player |
| POST | /tournaments/:id/players/:playerId/withdraw | tournament.controller.ts | JWT | Withdraw player |
| POST | /tournaments/:id/rounds | tournament.controller.ts | JWT | Create round |
| POST | /tournaments/:id/rounds/:roundId/publish | tournament.controller.ts | JWT | Publish round |
| POST | /tournaments/:id/rounds/:roundId/complete | tournament.controller.ts | JWT | Complete round |
| POST | /tournaments/:id/pairings | tournament.controller.ts | JWT | Create pairing |
| POST | /tournaments/:id/results | tournament.controller.ts | JWT | Submit result |

### 6. Tournament Standings (`/tournaments/:tournamentId/standings`)

| Method | Path | Controller | Auth | Description |
|--------|------|------------|------|-------------|
| GET | /tournaments/:tournamentId/standings | tiebreak.controller.ts | Public | Get standings |
| GET | /tournaments/:tournamentId/standings/:playerId/details | tiebreak.controller.ts | Public | Player tiebreak details |
| GET | /tournaments/:tournamentId/standings/by/:tiebreak | tiebreak.controller.ts | Public | Sort by tiebreak |

### 7. Tournament Pairings (`/tournaments/:tournamentId/pairings`)

| Method | Path | Controller | Auth | Description |
|--------|------|------------|------|-------------|
| POST | /tournaments/:tournamentId/pairings/generate/swiss | pairing.controller.ts | JWT | Generate Swiss pairings |
| POST | /tournaments/:tournamentId/pairings/generate/roundrobin | pairing.controller.ts | JWT | Generate Round-Robin pairings |
| POST | /tournaments/:tournamentId/pairings/generate/elimination | pairing.controller.ts | JWT | Generate Elimination pairings |

### 8. Tournament Export (`/tournaments/:tournamentId/export`)

| Method | Path | Controller | Auth | Description |
|--------|------|------------|------|-------------|
| GET | /tournaments/:tournamentId/export/pgn | export.controller.ts | Public | Export as PGN |
| GET | /tournaments/:tournamentId/export/pgn/player/:playerId | export.controller.ts | Public | Export player games as PGN |
| GET | /tournaments/:tournamentId/export/csv | export.controller.ts | Public | Export as CSV |
| GET | /tournaments/:tournamentId/export/csv/players | export.controller.ts | Public | Export players as CSV |

### 9. Tournament Import (`/tournaments/:tournamentId/import`)

| Method | Path | Controller | Auth | Description |
|--------|------|------------|------|-------------|
| POST | /tournaments/:tournamentId/import/players/csv | import.controller.ts | JWT | Import players from CSV |
| POST | /tournaments/:tournamentId/import/players/csv/raw | import.controller.ts | JWT | Import players from raw CSV |
| POST | /tournaments/:tournamentId/import/pgn/parse | import.controller.ts | JWT | Parse PGN file |
| POST | /tournaments/:tournamentId/import/results/pgn | import.controller.ts | JWT | Import results from PGN |
| POST | /tournaments/:tournamentId/import/results/pgn/raw | import.controller.ts | JWT | Import results from raw PGN |

### 10. API Keys (`/api-keys`)

| Method | Path | Controller | Auth | Description |
|--------|------|------------|------|-------------|
| GET | /api-keys | api-key.controller.ts | JWT | List API keys |
| GET | /api-keys/:id | api-key.controller.ts | JWT | Get API key details |
| POST | /api-keys | api-key.controller.ts | JWT | Create API key |
| PATCH | /api-keys/:id | api-key.controller.ts | JWT | Update API key |
| DELETE | /api-keys/:id | api-key.controller.ts | JWT | Delete API key |
| POST | /api-keys/:id/rotate | api-key.controller.ts | JWT | Rotate API key secret |

### 11. Apps (`/apps`)

| Method | Path | Controller | Auth | Description |
|--------|------|------------|------|-------------|
| GET | /apps | app-registration.controller.ts | JWT | List apps |
| GET | /apps/:id | app-registration.controller.ts | JWT | Get app details |
| POST | /apps | app-registration.controller.ts | JWT | Create app |
| PATCH | /apps/:id | app-registration.controller.ts | JWT | Update app |
| DELETE | /apps/:id | app-registration.controller.ts | JWT | Delete app |
| POST | /apps/:id/regenerate-secret | app-registration.controller.ts | JWT | Regenerate client secret |
| POST | /apps/:id/regenerate-webhook-secret | app-registration.controller.ts | JWT | Regenerate webhook secret |

### 12. Webhooks (`/webhooks`)

| Method | Path | Controller | Auth | Description |
|--------|------|------------|------|-------------|
| GET | /webhooks/logs | webhook.controller.ts | JWT | List webhook logs |
| GET | /webhooks/logs/:deliveryId | webhook.controller.ts | JWT | Get delivery details |
| POST | /webhooks/logs/:deliveryId/redeliver | webhook.controller.ts | JWT | Redeliver webhook |

### 13. Health (`/`)

| Method | Path | Controller | Auth | Description |
|--------|------|------------|------|-------------|
| GET | / | app.controller.ts | Public | Health check |

## Implementation Plan

### Phase 1: Create Code Block UI Component

**Files:**
- `libs/ui/code-block/src/lib/code-block.component.ts`
- `libs/ui/code-block/src/lib/code-block.component.html`
- `libs/ui/code-block/src/lib/code-block.component.scss`
- `libs/ui/code-block/src/index.ts`

Features:
- Syntax highlighting via highlight.js (CDN)
- Language prop: 'typescript' | 'bash' | 'json'
- Copy-to-clipboard button
- Dark-mode aware

### Phase 2: Create API Documentation Page

**Files:**
- `apps/portal/src/app/pages/api-docs/api-docs.component.ts`
- `apps/portal/src/app/pages/api-docs/api-docs.component.html`
- `apps/portal/src/app/pages/api-docs/api-docs.component.scss`
- `apps/portal/src/app/pages/api-docs/api-docs.data.ts` (route documentation data)

Features:
- Sticky left sidebar with navigation
- Main content area with route sections
- Scroll spy for active section
- Method badges (POST=green, GET=blue, PUT/PATCH=amber, DELETE=red)
- Auth badges (public, JWT, Admin)
- Request/response schemas
- Code examples (cURL, JS, Python tabs)

### Phase 3: Configuration Updates

**Files to modify:**
- `apps/portal/src/app/app.routes.ts` - Add `/docs/api` route
- `apps/portal/src/index.html` - Add highlight.js CDN
- `libs/ui/button/src/index.ts` - Export variants

### Phase 4: Documentation Content

Create comprehensive documentation data for all 13 route groups with:
- Endpoint description
- Request body schema (fields, types, required/optional)
- Response 200 schema
- Error responses (400/401/403/404/409/422/429)
- cURL example (required)
- JavaScript example (optional)
- Python example (optional)

## Files Summary

### Create:
1. `libs/ui/code-block/src/lib/code-block.component.ts`
2. `libs/ui/code-block/src/lib/code-block.component.html`
3. `libs/ui/code-block/src/lib/code-block.component.scss`
4. `libs/ui/code-block/src/index.ts`
5. `apps/portal/src/app/pages/api-docs/api-docs.component.ts`
6. `apps/portal/src/app/pages/api-docs/api-docs.component.html`
7. `apps/portal/src/app/pages/api-docs/api-docs.component.scss`
8. `apps/portal/src/app/pages/api-docs/api-docs.data.ts`

### Modify:
1. `apps/portal/src/app/app.routes.ts`
2. `apps/portal/src/index.html`
3. `libs/ui/button/src/index.ts`

## Verification

1. Build: `pnpm nx build portal`
2. Serve: `pnpm nx serve portal`
3. Navigate to: `http://localhost:8050/docs/api`
4. Verify all 13 sections are documented
5. Test dark mode toggle
6. Test scroll spy active state
7. Test code block copy functionality
