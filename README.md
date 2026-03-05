# 🐜🌦️ antWeather (NEA Rain Monitor)

A full-stack, live weather radar application built to monitor rainfall in Singapore using the NEA (National Environment Agency) API. The application provides a responsive web dashboard to view live radar maps and automatically sends alerts and radar snapshots to a Telegram group when rain is detected in your specified region.

## Architecture Highlights
- **Frontend** (`/frontend`): A mobile-first React SPA built with Vite, Tailwind CSS, and Leaflet for dynamic mapping. Hosted on **Cloudflare Pages**.
- **Backend API** (`/worker`): A serverless backend built on **Cloudflare Workers** using TypeScript. It runs cron schedules and serves API requests.
- **Database**: Cloudflare **D1** (Serverless SQLite) is used to track historical rain captures, alerts, and settings.
- **Storage**: Cloudflare **R2** Object Storage is used to save cropped live radar images when rain is detected.
- **CI/CD**: Fully automated deployments using **GitHub Actions**. Pushing to the `main` branch automatically deploys updates to both Cloudflare Pages and Workers.

## Key Features
- 🗺️ **Live Radar Map**: View real-time rainfall data overlaid on an interactive map.
- 🤖 **Telegram Alerting**: Automated alerts sent to a Telegram chat containing cropped radar snapshots when rain is detected.
- ⚡ **Instant Webhooks**: A Telegram bot integration allows users in the group chat to send `/checknow` to instantly trigger a weather check and reply.
- 📱 **Mobile Responsive**: The UI features a collapsible desktop sidebar and a compact mobile-friendly bottom/hamburger navigation.

## Repository Structure
- `/frontend`: The React UI application. See [Frontend README](./frontend/README.md) for local development instructions.
- `/worker`: The Cloudflare Worker API, cron jobs, and database schemas. See [Worker README](./worker/README.md) for deployment and database setup instructions.
- `.github/workflows`: Contains the `deploy.yml` pipeline that auto-deploys via Cloudflare's official GitHub Actions.

## Setup Prerequisites
To run or deploy this project, you need:
1. A **Cloudflare Account** (for Pages, Workers, D1, and R2).
2. A **Telegram Bot Token** and Chat ID (for receiving alerts).
3. The **Wrangler CLI** (`npm install -g wrangler`) installed locally.
