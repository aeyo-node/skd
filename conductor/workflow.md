# Workflow Preferences - Sarkardada.com

## Quality Gates
- **TDD Strictness**: Flexible. Tests recommended for complex backend schema queries, view rating rules, or tokenized search queries.
- **Commit Strategy**: Descriptive messages matching feature actions.
- **Code Review**: Self-reviews are mandatory. Spot checks for component states and console warnings are performed before closing phases.

## Verification Checkpoints
1. **Database Schema Integrity**: Ensure RLS, triggers, views, and seed statements execute successfully on Postgres.
2. **Local Environment Run**: Verify that compiling the Next.js production build does not throw warnings or missing asset errors.
3. **Interactive User Checks**: Walk through Omni-Search input strings, cascading geographic selects, rating drawers, and admin dashboard widgets manually to ensure complete interactivity.
