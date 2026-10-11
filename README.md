# Daylight Planner

Productivity planner with Quick Dump, projects, task board, date filters and daily review.

## Deployment
Import into Vercel with the Other preset. Set a sensitive Production environment variable `GROQ_API_KEY` to the owner's active Groq key and redeploy. Never commit credentials. No visitor key is required; all AI calls use the owner account through the Python server function. Visitors cannot change the model or key.

## Costs and limits
Uses openai/gpt-oss-20b. Each note is limited to 6,000 characters, 30 tasks, and 4,500 output tokens. These per-request limits are not a daily budget or rate limiter. The endpoint is public; configure provider spending limits and Vercel firewall rate limits before promoting widely. Same-origin checking is not authentication or abuse protection.

## Data
Tasks stay in each browser's localStorage, with backup export/import. They do not sync between devices. Initial tasks are examples. Gmail currently supports pasted email only.

AI sends note content to Groq after Organise with AI. Credentials stay server-side; the app does not log request bodies or keys.
