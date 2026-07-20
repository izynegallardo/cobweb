<p align="center">
  <img src="src/assets/cobweb-light.svg" alt="Cobweb" width="110" />
</p>

<h1 align="center">Cobweb</h1>
<p align="center">All your links, in one page.</p>

<p align="center">
  <a href="https://cobweb-site.web.app"><strong>Live Demo →</strong></a>
</p>

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img alt="Vite" src="https://img.shields.io/badge/build-Vite-646CFF?logo=vite&logoColor=white" />
  <img alt="Firebase" src="https://img.shields.io/badge/backend-Firebase-FFCA28?logo=firebase&logoColor=white" />
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES%20Modules-F7DF1E?logo=javascript&logoColor=black" />
</p>

<br />

Cobweb is a link-in-bio app — a single page (`cobweb.app/{username}`) where people collect every link they want to share behind one URL. Create a free page, add your links, share the one link.

It's a from-scratch build with no UI framework: a hand-rolled single-page app on top of Vite, backed by Firebase.

## Features

- **OAuth-only authentication** — Google and Yahoo sign-in via Firebase Auth; no passwords to store, leak, or reset.
- **Drag-and-drop link management** — reorder links with SortableJS, edit/delete/toggle-active from a mobile-friendly ellipsis menu.
- **Public profile pages** — `/{username}` renders a visitor-facing page with cursor-paginated, active-only links.
- **Per-link click tracking** — atomic Firestore counters, reflected on the dashboard in real time via `onSnapshot`.
- **Race-safe usernames** — claiming, renaming, and releasing usernames run inside Firestore transactions, so two people can never win the same username.
- **Optimized avatars** — Cloudinary transformations (`f_auto,q_auto`, context-specific widths) applied only to genuine Cloudinary URLs; other sources (Google avatars, blob/data URLs) pass through untouched.
- **Bot & abuse protection** — Firebase App Check with reCAPTCHA Enterprise.
- **Custom SPA router** — a small hand-rolled client-side router (`core/spa.js`) with delegated anchor interception and same-URL history guards.

## Tech Stack

| Layer          | Technology                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Build tool     | [Vite](https://vitejs.dev/)                                                                                  |
| Language       | Vanilla JavaScript (ES Modules)                                                                              |
| Styling        | CSS Modules                                                                                                  |
| Backend        | [Firebase](https://firebase.google.com/) — Firestore + Auth (Spark/free plan; no Cloud Functions or Storage) |
| Image CDN      | [Cloudinary](https://cloudinary.com/) (unsigned upload presets)                                              |
| Link icons     | [logo.dev](https://logo.dev/), with a Google Favicon API fallback                                            |
| Drag & drop    | [SortableJS](https://sortablejs.github.io/Sortable/)                                                         |
| Bot protection | Firebase App Check (reCAPTCHA Enterprise)                                                                    |
| CI/CD          | GitHub Actions → Firebase Hosting                                                                            |

> Cobweb runs entirely on Firebase's free Spark plan by design — no Cloud Functions, no Firebase Storage. That constraint shapes a few architectural decisions, like handling image hosting through Cloudinary instead of Storage.

## Architecture

```
src/
├── components/     # main.js (markup) + event.js (behavior) + component.module.css, per feature
├── pages/          # route-level composition — wires a layout + component together
├── layouts/        # shared page shells
├── core/spa.js     # hand-rolled SPA router
├── services/       # Firestore/Auth data access, one file per domain
├── utils/          # cross-cutting helpers (cache, pagination, cloudinary, validation, errors…)
├── configs/        # static config + cache-key factories
└── styles/         # global CSS
```

Each component follows the same three-file shape: `main.js` builds the DOM skeleton, `event.js` wires up interactivity, and `component.module.css` scopes its styles. The `@` alias resolves to `src/`.

## Getting Started

### Prerequisites

- Node.js and npm
- A Firebase project with **Firestore** and **Authentication** (Google + Yahoo providers) enabled
- A [Cloudinary](https://cloudinary.com/) account with an unsigned upload preset
- A [reCAPTCHA Enterprise](https://cloud.google.com/security/products/recaptcha) site key (for App Check)
- A [logo.dev](https://logo.dev/) publishable key

### Installation

```bash
git clone https://github.com/<your-username>/cobweb.git
cd cobweb
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=
VITE_APPCHECK_DEBUG_TOKEN=

VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_API_KEY=

VITE_LOGO_DEV_PK_TOKEN=
```

> Cloudinary uploads go through an unsigned upload preset, so no API secret is required — or should ever be shipped — client-side.

### Run locally

```bash
npm run dev       # start the dev server
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Available Scripts

| Script            | Description                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start the Vite dev server              |
| `npm run build`   | Build for production into `dist/`      |
| `npm run preview` | Preview the production build locally   |
| `npm run deploy`  | Build, then deploy to Firebase Hosting |

## Deployment

Cobweb deploys to Firebase Hosting via GitHub Actions:

- **Push to `main`** → `firebase-hosting-merge.yml` deploys to production.
- **Open a pull request** → `firebase-hosting-pull-request.yml` deploys a preview channel.
- **Manual deploy** → `npm run deploy` (build, then `firebase deploy`).

## Security

- **Firestore rules** scope every read/write to its owner; the `usernames` reservation collection allows scoped creates and owner-only deletes, and blocks updates outright.
- **App Check** (reCAPTCHA Enterprise) verifies requests come from the real app before they reach Firestore.
- **No `innerHTML` with user data** — trusted static markup is rendered via `innerHTML`; anything user-supplied goes through `textContent`.

## License

MIT © 2026 Izyne Howie Gallardo — see [LICENSE](./LICENSE) for details.
