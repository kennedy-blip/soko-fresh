# 🌱 SokoFresh — Agricultural Produce & Supply Chain Logistics OS

SokoFresh cuts post-harvest food loss in rural Kenya by tracking every kilogram from
farm gate to market: harvest batches, perishability countdowns, truck dispatches,
buyer orders and fulfillment rates — all in one offline-first app.

**Live (Vercel):** https://sokofresh-six.vercel.app
**Repo:** https://github.com/kennedy-blip/soko-fresh

## Highlights

- **Harvest & Batch Tracker** — farmer, crop, quantity, grade, collection point, automatic
  freshness countdown per perishability profile, freshness-% progress bars, grade overrides
  (admin), batch status lifecycle (Fresh → Dispatched → Delivered / Spoiled).
- **Transport & Dispatch Manager** — assign batches to trucks/boda riders, vehicle plates,
  routes, manifests, live status (Scheduled / In Transit / Delivered / Delayed) with ETAs.
- **Buyer Order Book** — wholesale/retail/export orders, inventory matching to available
  batches, one-tap fulfillment, pipeline value & fulfillment-rate analytics.
- **Settings & APK Center** — role management, 3 themes, offline storage stats, CSV audit
  export, and one-tap **Download Android APK** (rebuilt on every push by CI).
- **Offline-first** — all data lives on-device in IndexedDB via Dexie.js. Works with zero signal.
- **Roles** — Warehouse Manager/Admin (full control) vs Field Collection Agent (log & update,
  no pricing/deletes/exports).

## Stack

React 18 · Vite 5 · Tailwind CSS 3 · Framer Motion 11 (spring physics `stiffness: 300, damping: 25`)
· Lucide icons · Dexie.js (IndexedDB) · Capacitor 6 (Android) · Vercel (static SPA)

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
npm run preview    # preview the production build
```

## Deployment

### Vercel (web)
`vercel.json` configures the Vite framework, SPA rewrites and cache/security headers.
Connect the repo in Vercel (project `sokofresh`) — `npm run build` → `dist/`.

### Android APK (Capacitor)
`android/` contains the Capacitor Android project. CI (`.github/workflows/android-apk.yml`)
builds `app-debug.apk` on every push and commits it to `public/downloads/sokofresh.apk`,
which the app serves via the **Download Android APK** button.

Build locally:

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug     # debug-signed APK
# or, with a release keystore configured:
./gradlew assembleRelease
```

Install: copy `app-debug.apk` to the phone → allow "Install unknown apps" → done.

## Project structure

```
src/
  components/   HarvestTracker · DispatchManager · OrderBook · SettingsCenter
                RoleSwitcher · ThemeToggle · DownloadAPKModal
  context/      AppContext (theme, role, online status, toasts)
  db/           database.js — Dexie schema, seed data, audit log, CSV export
  styles/       globals.css — mesh gradients, glass utilities, 3 theme palettes
android/        Capacitor Android project
public/downloads/sokofresh.apk   CI-built Android binary
```

## Themes

| Theme | Mode | Use |
|-------|------|-----|
| Agro Emerald | Default dark (`#070f0c`) | Control-room operations |
| Harvest Glass | Frosted light | Daylight office use |
| Terminal Amber | High-contrast amber-on-black | Sunlight readable in collection sheds |

## License

Proprietary — SokoFresh, Meru County, Kenya.
