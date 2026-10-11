# Daylight Planner
Personal productivity app with Quick Dump, projects, a task board, date filters, daily review, and Groq-powered task extraction.

## Deploy
Import this private GitHub repository into Vercel. Framework preset: Other. The included vercel.json builds static assets and a Python API function. No API key belongs in this repository.

## AI connection
Open Quick Dump → AI settings. Enter your own active Groq key and verify the connection. The hosted app keeps the key only in tab memory, sends it over HTTPS for each request, and forgets it on refresh. No shared server API key is used. Supported models: openai/gpt-oss-20b and openai/gpt-oss-120b.

## Data
Tasks are saved in browser localStorage and are not synced between browsers or domains. Download a backup from the local prototype, then import it into the deployed app. Gmail is manual paste/import only; no live Gmail connection is included.

## Privacy
The API does not log request bodies or keys. Task text is sent to Groq only after clicking Organise with AI. Provider infrastructure policies still apply. The initial tasks are sample data.
