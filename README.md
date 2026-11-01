# Feedback Intelligence System

A responsive, Vercel-deployable customer feedback analytics dashboard. It combines Google Play reviews, Apple App Store RSS reviews, and CSV survey exports; performs lightweight sentiment and topic classification; visualizes trends and issue priority; and exports a PDF report.

## Features

- Google Play review collection (Node connector; upstream availability/rate limits apply)
- Apple App Store customer-review RSS
- CSV upload with common column names: `text`, `review`, `feedback`, `comment`, `rating`, `date`
- Sentiment classification with a transparent keyword/rating heuristic and confidence estimate
- Topic categorization, sentiment trend charts, negative-issue prioritization
- Search and source/sentiment filters
- Client-side PDF report export
- Optional Groq/Llama AI-generated executive insight summary
- Responsive PWA install experience for Windows, Android, and iOS
- Capacitor configuration for native Android/iOS wrappers

## Important accuracy note

The built-in sentiment classifier is a lightweight baseline, not a validated production ML model. Its confidence value is heuristic, not a calibrated probability. Validate it against a labeled dataset before using it for business-critical decisions. The sample dashboard starts with synthetic demo feedback; demo rows must not be represented as live customer data.

## Requirements

- Node.js 20.9+ (recommended)
- npm
- Vercel account for deployment
- Optional Groq API key for generated insights
- Android Studio + Android SDK for Android native builds
- macOS + Xcode for iOS native builds and signed IPA distribution

## Run on Windows

1. Install Node.js LTS from https://nodejs.org/
2. Extract this ZIP and open PowerShell in the project folder.
3. Run:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

4. Open http://localhost:3000

You can also double-click `scripts/setup-windows.bat` after extracting.

## Run on Android / iPhone / iPad

The responsive web app works in mobile browsers and includes a basic service worker for app-shell caching. To install without native packaging:
- Android: open the deployed HTTPS URL in Chrome → menu → Install app / Add to Home screen.
- iOS/iPadOS: open the deployed HTTPS URL in Safari → Share → Add to Home Screen.
- Windows: open the deployed URL in Edge/Chrome → Install this site as an app.

### Native Android wrapper

Install Android Studio and its SDK, then:

```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```

Build an APK/AAB in Android Studio. Before syncing, replace the placeholder Vercel URL in `capacitor.config.ts` or set `CAPACITOR_SERVER_URL` in your shell. The native shell loads your deployed Vercel app so its serverless APIs continue to work. The native project is generated locally and is not committed by default.

### Native iOS wrapper (IPA)

Requires macOS and Xcode:

```bash
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

Select a signing Team in Xcode and archive the app. Exporting a distributable IPA requires Apple signing credentials and the appropriate Apple Developer provisioning. Windows cannot build/sign an iOS IPA.

## Deploy to Vercel

1. Push the project to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Framework preset: Next.js. Build command: `npm run build`; output directory: leave default.
4. Add environment variables if using AI summaries:
   - `GROQ_API_KEY` = your secret Groq key
   - `GROQ_MODEL` = `llama-3.3-70b-versatile`
5. Deploy. The Vercel URL serves the dashboard and API routes.

Do not put API keys in `NEXT_PUBLIC_` variables or commit `.env.local`.

## CSV format

Minimum:

```csv
text,rating,date
"App crashes on login",1,2026-10-30
"Great experience",5,2026-10-29
```

Accepted text columns: `text`, `review`, `feedback`, `comment`, `content`. Rating defaults to 3 if absent. Date defaults to import time if absent.

## API routes

- `GET /api/reviews/google-play?appId=com.example.app&count=50`
- `GET /api/reviews/app-store?country=in&appId=310633997`
- `POST /api/insights` with `{ "feedback": [...] }` (requires `GROQ_API_KEY`)

## Project structure

```text
app/
  api/reviews/google-play/route.ts
  api/reviews/app-store/route.ts
  api/insights/route.ts
  globals.css
  layout.tsx
  page.tsx
public/
  icon.svg
  manifest.webmanifest
capacitor.config.ts
vercel.json
```

## Limitations / production hardening

- App Store RSS endpoint exposes only the public feed returned by Apple; availability varies by app and region.
- Google Play scraping is an unofficial integration and may be rate-limited or change. For production scale, use a permitted provider/API and respect platform terms.
- No user accounts or persistent database are configured. Uploaded CSV and fetched data live in browser memory and reset on refresh. Add authenticated storage (e.g. managed Postgres) before multi-user production use.
- Trend charts show dates present in the selected data, not a statistical forecast. Add adequate historical data and a validated forecasting method before presenting predictive claims.
- PDF export runs in the browser and contains the currently filtered records/summary.

## License

Educational starter project. Review third-party platform terms before collecting or redistributing reviews.
