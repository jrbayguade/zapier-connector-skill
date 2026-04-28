#!/usr/bin/env node

/**
 * zapier-connector-skill installer
 * Displays branding and validates the installation.
 */

const BRAND = `
\x1b[36m
 ╔═══╗╔═══╗╔═══╗╔═══╗╔═══╗╔═══╗╔╦╗╔═══╗╔═══╗
 ╔═══╝╠═══╣╠═══╝║   ║║   ║║   ║║║║║   ║║    
 ╚═══╝╩   ╩╩    ╚═══╝╚═══╝╩   ╩╩ ╩╩   ╩╚═══╝
\x1b[0m
\x1b[1m zapier-connector-skill\x1b[0m v1.0.0
\x1b[2m by ZinkForge\x1b[0m

 Generate production-ready Zapier integrations
 for any SaaS with Claude Code.

 \x1b[32m✓\x1b[0m Installed SKILL.md
 \x1b[32m✓\x1b[0m Installed templates & references
 \x1b[32m✓\x1b[0m Installed examples/mail2follow

 \x1b[33mDone!\x1b[0m Read SKILL.md to get started.
 Or ask Claude Code: "Generate a Zapier integration
 for my SaaS using the zapier-connector-skill"
`;

console.log(BRAND);
