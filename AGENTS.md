# Neo Blog Agent Rules

- Keep every code file under 200 lines. If a file grows, split it before adding more logic.
- This repository now ships only the consumer-facing site. Remove admin UI code when touched.
- Preserve existing admin and content APIs unless the user explicitly asks to remove them.
- Favor server components and server data fetching for public pages; add client components only for interaction.
- Keep Markdown rendering, mobile usability, comments, and accessibility intact on every public-page change.
- Reuse semantic design tokens from global styles instead of hardcoding colors in components.
