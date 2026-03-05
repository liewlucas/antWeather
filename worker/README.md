# 🐜🌦️ antWeather - Cloudflare Worker Backend

This directory contains the serverless backend code for the antWeather application, built with TypeScript and designed specifically for **Cloudflare Workers**.

## Tech Stack & Required Bindings
This worker heavily relies on Cloudflare's ecosystem:
- **Workers**: Code execution (cron jobs + API serving).
- **D1 Database**: A serverless SQLite database bound to the worker for storing captures, logs, and settings.
- **R2 Storage**: Object storage bound to the worker for saving the `.png` radar image captures.

## Features
- **Cron Jobs**: The worker runs on a `*/5 * * * *` (every 5 minutes) schedule using Cloudflare Cron Triggers to pull data from the NEA API.
- **REST API**: Provides endpoints (`/api/*`) for the React frontend, such as fetching historical captures, settings, and triggering manual rain checks.
- **Telegram Webhook**: Exposes an endpoint (`/api/telegram/webhook`) to listen for Telegram Bot messages like `/checknow`.
- **Image Processing**: Crops and overlays the raw radar imagery locally (using raw binary data processing) before saving to R2 and sending to Telegram.

## Environment Setup
You need the following variables and secrets configured in a `.dev.vars` file (for local development) or securely uploaded to Cloudflare via `wrangler secret put <NAME>` (for production).

### Secrets
- `TELEGRAM_BOT_TOKEN`: The bot token obtained from BotFather (e.g., `1234567890:AAH8Ymmy9T8Bb...`).
- `TELEGRAM_CHAT_ID`: The ID of the user or group chat where alerts should be sent (e.g., `-5265318501`).

### Environment Config Variables (via `wrangler.toml`)
- `REGION_CENTER_LAT`, `REGION_CENTER_LNG`: Center point of the monitored region.
- `REGION_POLYGON`: A semicolon-separated string of lat/lng coordinate pairs defining the exact boundaries of the monitored area.

## Local Development
To develop and test the worker locally:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Initialize Local D1 Database**:
   Apply your database schema to the local wrangler environment:
   ```bash
   npx wrangler d1 execute neaweather --local --file=./schema.sql
   ```

3. **Start the Dev Server**:
   ```bash
   npx wrangler dev
   ```
   This will start a local emulation of the worker, usually on `http://127.0.0.1:8787`.

## Deployment
This worker is automatically deployed using **GitHub Actions** on pushes to the `main` branch. 

To deploy manually via CLI:
```bash
npx wrangler deploy
```

> **Note**: Don't forget to configure the D1 and R2 bindings in your `wrangler.toml` file to point to your specific Cloudflare IDs before deploying for the first time.
