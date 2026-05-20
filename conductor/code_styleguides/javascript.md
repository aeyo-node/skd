# JavaScript Style Guide - Sarkardada.com

## Code Style & Formatting
- **Component Structuring**: Use standard functional components with descriptive hook dependencies.
- **State Management**: Keep states local where possible. Abstract database operations to `lib/db.js` so that components stay clean of direct database call syntax.
- **CSS Formatting**: Style components using standard global layout variables defined in `app/globals.css` rather than inline scripts. Use descriptive classnames matching the glassmorphic system.
- **Asynchronous Code**: Use standard `async/await` for database hooks and route handlers. Always wrap queries in try/catch blocks and print structured alerts in error states.
