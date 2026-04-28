---
name: zapier-connector-skill
description: Generate a complete, production-ready Zapier integration for any SaaS product with a REST API. Use this skill when the user wants to connect their product to Zapier, build webhook-based triggers, create Zapier actions, or publish an integration to the Zapier Developer Platform. Also trigger when the user mentions "Zapier", "Zap", "integration marketplace", "webhook triggers for third-party apps", "connect my API to other tools", or wants their SaaS to work with 5000+ apps. Even if they just say "I want Zapier support" or "add Zapier", use this skill.
---

# Zapier Connector Skill

Generate a complete Zapier integration for any SaaS with a REST API. Produces webhook-based triggers, REST actions, auth configuration, security tests, and the Zapier app definition ready to upload to the Zapier Developer Platform.

## Before you start

Read the user's codebase to understand:

1. **What framework/language is the backend?** (Node/Hono/Express, Python/Django/FastAPI, etc.)
2. **What database?** (PostgreSQL, MySQL, SQLite/D1, etc.)
3. **What auth system exists?** (OAuth2, API key, Bearer token, session-based)
4. **What entities/events exist?** (orders, tasks, followups, invoices, etc.)

If the user hasn't provided a config file, interview them to build one. Ask:
- What events in your product should trigger a Zap? (e.g., "new order created", "task completed")
- What actions should Zapier be able to perform? (e.g., "create task", "update order status")
- What auth method does your API use?

## Config file format

The user provides (or you help them build) a `zapier-config.json`:

```json
{
  "app_name": "YourApp",
  "app_id": "yourapp",
  "app_description": "Short description of what the app does",
  "base_url": "https://api.yourapp.com",
  "auth_type": "oauth2",
  "auth_config": {
    "authorize_url": "https://yourapp.com/oauth/authorize",
    "token_url": "https://api.yourapp.com/oauth/token",
    "test_endpoint": "/api/auth/me",
    "scopes": ["read", "write"]
  },
  "triggers": [
    {
      "key": "new_order",
      "name": "New Order Created",
      "description": "Triggers when a new order is placed",
      "important_output_fields": [
        { "key": "id", "label": "Order ID", "type": "string" },
        { "key": "customer_email", "label": "Customer Email", "type": "string" },
        { "key": "total", "label": "Total Amount", "type": "number" },
        { "key": "created_at", "label": "Created At", "type": "datetime" }
      ],
      "sensitive_fields_to_exclude": ["payment_token", "internal_notes"]
    }
  ],
  "actions": [
    {
      "key": "create_order",
      "name": "Create Order",
      "description": "Creates a new order in your system",
      "input_fields": [
        { "key": "customer_email", "label": "Customer Email", "type": "string", "required": true },
        { "key": "total", "label": "Total Amount", "type": "number", "required": true }
      ]
    }
  ]
}
```

## Execution plan

Follow these phases in order. Stop after each phase and show the user what you've generated before proceeding.

### Phase 1: Webhook subscription system

Create the database infrastructure for storing Zapier webhook subscriptions.

1. **Migration file**: Create a `zapier_subscriptions` table:

```sql
CREATE TABLE IF NOT EXISTS zapier_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  trigger_key TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_zapier_subs_user_trigger
  ON zapier_subscriptions(user_id, trigger_key, active);
```

Adapt the SQL dialect to match the project's database (PostgreSQL, MySQL, SQLite, D1, etc.).

2. **Subscribe endpoint**: `POST /api/integrations/zapier/subscribe`
   - Auth required (same middleware as existing API)
   - Receives: `{ trigger_key, webhook_url }`
   - Validates trigger_key against known triggers
   - Stores subscription scoped to authenticated user
   - Returns: `{ id, trigger_key, webhook_url }`

3. **Unsubscribe endpoint**: `DELETE /api/integrations/zapier/subscribe/:id`
   - Auth required
   - Validates the subscription belongs to the authenticated user
   - Soft-deletes (sets active = 0) or hard-deletes

4. **List subscriptions**: `GET /api/integrations/zapier/subscribe`
   - Auth required
   - Returns only subscriptions for the authenticated user

**STOP after Phase 1. Show the user the generated files.**

### Phase 2: Trigger firing logic

For each trigger defined in the config, generate the code that fires webhooks when the event occurs.

1. **Create a reusable `fireZapierTrigger` function**:

```typescript
// Adapt to the project's language/framework
async function fireZapierTrigger(
  db: Database,
  userId: number,
  triggerKey: string,
  payload: Record<string, unknown>
): Promise<void> {
  const subs = await db
    .prepare(
      'SELECT webhook_url FROM zapier_subscriptions WHERE user_id = ? AND trigger_key = ? AND active = 1'
    )
    .bind(userId, triggerKey)
    .all();

  const promises = subs.results.map(async (sub) => {
    try {
      await fetch(sub.webhook_url as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      // Log but don't throw: Zapier webhook failure must never
      // break the user's primary workflow
      console.error(`Zapier webhook failed for ${triggerKey}:`, error);
    }
  });

  // Fire-and-forget: don't await all promises unless latency allows
  await Promise.allSettled(promises);
}
```

2. **Integrate triggers into existing code paths**:
   - Find where each trigger event happens in the codebase
   - Add `fireZapierTrigger(db, userId, 'trigger_key', payload)` call
   - The payload must ONLY include fields listed in `important_output_fields`
   - The payload must NEVER include fields listed in `sensitive_fields_to_exclude`

3. **Polling fallback endpoint** (Zapier requires this for testing):
   - `GET /api/integrations/zapier/triggers/:trigger_key/sample`
   - Returns the 3 most recent items for this trigger type, scoped to the authenticated user
   - Zapier calls this during setup so the user can see sample data

**STOP after Phase 2. Show the user what trigger integrations look like.**

### Phase 3: Action endpoints

For each action defined in the config:

1. Create a dedicated endpoint: `POST /api/integrations/zapier/actions/:action_key`
2. Apply the same auth middleware as existing endpoints
3. Validate input fields against the schema defined in the config
4. Perform the action (create/update/delete the entity)
5. Return the created/updated entity

Actions must use the same business logic as the main app. Don't duplicate code; call existing service functions.

**STOP after Phase 3.**

### Phase 4: Zapier app definition

Generate the complete Zapier app definition that gets uploaded to the Zapier Developer Platform.

Read `references/zapier-app-schema.md` for the full schema reference before generating.

The output is a directory structure compatible with `zapier-platform-cli`:

```
zapier-app/
├── index.js          # Main app definition
├── package.json      # Dependencies
├── authentication.js # Auth config
├── triggers/
│   ├── new_order.js  # One file per trigger
│   └── ...
├── creates/
│   ├── create_order.js  # One file per action
│   └── ...
└── test/
    ├── triggers.test.js
    └── creates.test.js
```

**STOP after Phase 4.**

### Phase 5: Security tests

Generate tests that verify cross-user data isolation. These are NON-NEGOTIABLE.

Required tests:
1. User A's token cannot list User B's webhook subscriptions
2. User A's token cannot delete User B's webhook subscriptions
3. User A's trigger events only fire User A's webhooks, never User B's
4. User A's action endpoints only operate on User A's data
5. Revoking auth cascades to deactivate all webhook subscriptions
6. Rate limiting applies to Zapier endpoints (same or stricter than main API)
7. Sensitive fields (from `sensitive_fields_to_exclude`) never appear in trigger payloads

For each test, the pattern is:
```
1. Create User A and User B
2. Create subscriptions/data for both
3. Authenticate as User A
4. Attempt to access User B's resources
5. Assert 403 or empty result (never User B's data)
```

**STOP after Phase 5. Show the user the test results.**

### Phase 6: Documentation

1. **Update project README/docs** with Zapier integration section
2. **Create end-user guide**: How to connect [AppName] to Zapier
3. **Update CLAUDE.md** (if it exists) with Zapier conventions:
   - Where webhook subscription code lives
   - How to add new triggers
   - How to add new actions
   - Security invariants to maintain

## Critical security rules

These rules are NON-NEGOTIABLE and must be enforced in every phase:

1. **User isolation**: ALL endpoints derive user_id from the authenticated token, NEVER from request parameters. A user must never be able to see, modify, or receive data belonging to another user.

2. **Webhook scope**: When firing triggers, query ONLY subscriptions for the specific user_id involved in the event. Never broadcast to all subscriptions.

3. **Token revocation cascade**: When a user's auth token is revoked or their account is deleted, ALL their webhook subscriptions must be deactivated immediately.

4. **Sensitive data exclusion**: Trigger payloads must never include fields marked as sensitive. The `sensitive_fields_to_exclude` list in the config is the source of truth.

5. **Fire-and-forget safety**: Webhook delivery failures must never break the user's primary workflow. Always use try/catch around webhook delivery and log errors silently.

6. **Rate limiting**: Apply the same (or stricter) rate limits to Zapier endpoints as to the main API. Zapier polling can generate significant request volume.

7. **No cross-tenant data in samples**: The polling fallback endpoint must only return data belonging to the authenticated user.

## Adapting to different stacks

This skill generates code patterns, not copy-paste solutions. Adapt to the project's stack:

| Stack | DB queries | Auth middleware | HTTP framework |
|---|---|---|---|
| Node + Hono + D1 | `.prepare().bind().all()` | Custom middleware | `app.post()` |
| Node + Express + PostgreSQL | `pool.query($1, [param])` | Passport/custom | `router.post()` |
| Python + FastAPI + PostgreSQL | `await db.execute()` | Depends/JWT | `@app.post()` |
| Python + Django + PostgreSQL | `Model.objects.filter()` | DRF auth | `@api_view` |

Read the existing codebase and match patterns exactly. Don't introduce new frameworks or patterns that conflict with what's already there.

## Example: Mail2Follow

See `examples/mail2follow/` for a complete example of this skill applied to a real product. This example shows:
- 4 triggers (new_followup, followup_overdue, reply_received, followup_resolved)
- 2 actions (create_followup, resolve_followup)
- Hono + D1 + OAuth2 stack
- Security tests with user isolation
