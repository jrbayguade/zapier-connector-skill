# zapier-connector-skill

```
 ╔═══╗╔═══╗╔═══╗╔═══╗╔═══╗╔═══╗╔╦╗╔═══╗╔═══╗
 ╔═══╝╠═══╣╠═══╝║   ║║   ║║   ║║║║║   ║║    
 ╚═══╝╩   ╩╩    ╚═══╝╚═══╝╩   ╩╩ ╩╩   ╩╚═══╝
```

> A Claude Code skill that generates complete, production-ready Zapier integrations for any SaaS product with a REST API.

## What it does

Give Claude Code your API schema and this skill generates:

- **Webhook subscription system** (database table + subscribe/unsubscribe endpoints)
- **Trigger implementations** (webhook-based, with polling fallback for Zapier testing)
- **Action endpoints** (REST-based, with input validation)
- **Zapier app definition** (ready to upload to [Zapier Developer Platform](https://developer.zapier.com/))
- **Security tests** (cross-user data isolation, IDOR prevention, sensitive field exclusion)
- **Documentation** (end-user guide + developer docs)

## Why this exists

Every indie SaaS founder eventually wants Zapier support. The integration is straightforward but repetitive: webhook subscriptions, trigger firing, action endpoints, auth config, app definition JSON. This skill automates 90% of that work while enforcing security best practices (user isolation, sensitive data exclusion, rate limiting).

Built and tested with [Mail2Follow](https://zinkforge.com/mail2follow/), an AI-powered follow-up tracker for Gmail. See `examples/mail2follow/` for the real-world config that produced a working integration.

## Quick start

### 1. Install the skill

Copy this skill directory into your Claude Code skills folder:

```bash
# If you have a skills directory configured:
cp -r zapier-connector-skill /path/to/your/skills/

# Or reference it directly in your Claude Code session
```

### 2. Create your config

Create a `zapier-config.json` in your project root:

```json
{
  "app_name": "YourApp",
  "app_id": "yourapp",
  "app_description": "What your app does",
  "base_url": "https://api.yourapp.com",
  "auth_type": "oauth2",
  "triggers": [
    {
      "key": "new_item",
      "name": "New Item Created",
      "description": "Triggers when a new item is created",
      "important_output_fields": [
        { "key": "id", "label": "Item ID", "type": "string" },
        { "key": "name", "label": "Name", "type": "string" }
      ],
      "sensitive_fields_to_exclude": ["internal_notes"]
    }
  ],
  "actions": [
    {
      "key": "create_item",
      "name": "Create Item",
      "description": "Creates a new item",
      "input_fields": [
        { "key": "name", "label": "Name", "type": "string", "required": true }
      ]
    }
  ]
}
```

### 3. Ask Claude Code

```
Generate a Zapier integration for my SaaS using the 
zapier-connector-skill. My config is at zapier-config.json.
```

Claude Code will read your codebase, understand your stack, and generate everything phase by phase, stopping after each phase for your review.

## Supported stacks

| Backend | Database | Auth |
|---|---|---|
| Node.js + Hono | Cloudflare D1 (SQLite) | OAuth2 |
| Node.js + Express | PostgreSQL | OAuth2 |
| Node.js + Fastify | MySQL | API Key |
| Python + FastAPI | PostgreSQL | Bearer Token |
| Python + Django | PostgreSQL/MySQL | Session/JWT |

The skill adapts to your stack automatically by reading your existing codebase patterns.

## Security (non-negotiable)

Every generated integration enforces these rules:

1. **User isolation**: All endpoints derive `user_id` from the authenticated token, never from request parameters
2. **Webhook scope**: Trigger events only fire webhooks for the specific user involved
3. **Token revocation cascade**: Deactivating auth cascades to all webhook subscriptions
4. **Sensitive data exclusion**: Fields marked as sensitive never appear in trigger payloads
5. **Fire-and-forget safety**: Webhook delivery failures never break the user's primary workflow
6. **Rate limiting**: Same or stricter limits as the main API

Generated security tests verify all six rules.

## Example: Mail2Follow

The `examples/mail2follow/` directory contains a complete, real-world configuration:

- **4 triggers**: new_followup, followup_overdue, reply_received, followup_resolved
- **2 actions**: create_followup, resolve_followup
- **Stack**: Hono + Cloudflare D1 + OAuth2
- **Sensitive fields excluded**: body_preview, content_hash, open_tracking_token, signature_html

This config was used to generate the actual Zapier integration for [Mail2Follow](https://zinkforge.com/mail2follow/).

## Project structure

```
zapier-connector-skill/
├── SKILL.md                              # Claude Code skill instructions
├── README.md                             # This file
├── scripts/
│   └── postinstall.mjs                   # ASCII art installer
├── templates/                            # (reserved for future templates)
├── references/
│   └── zapier-app-schema.md              # Zapier platform CLI schema reference
└── examples/
    └── mail2follow/
        └── zapier-config.json            # Real-world example config
```

## FAQ

**Do I need a Zapier Developer account?**
Yes, to publish your integration. Sign up free at [developer.zapier.com](https://developer.zapier.com/).

**Can I use this without Claude Code?**
The SKILL.md and references are readable by any LLM. But the skill is optimized for Claude Code's workflow (phase-by-phase execution with human review).

**How long does the Zapier review take?**
2-4 weeks for new integrations. You can use "invite-only" mode during review to share with beta testers.

**Does my API need to be public?**
Yes, Zapier needs to reach your API endpoints. Localhost won't work. Use a deployed staging or production URL.

**Can I use "Zapier" in my product name?**
Per [Zapier's trademark policy](https://zapier.com/legal/trademark-notice), you can use "Zapier" descriptively to identify your integration (e.g., "connects with Zapier") but not as part of your product name.

## License

MIT

## Credits

Built by [ZinkForge](https://zinkforge.com). Inspired by the growing ecosystem of Claude Code skills and the indie SaaS community.

---

*Zapier is a registered trademark of Zapier, Inc. This project is not affiliated with, endorsed by, or sponsored by Zapier, Inc. It generates integration code compatible with the Zapier Developer Platform.*
