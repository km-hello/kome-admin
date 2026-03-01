# Kome Admin

The admin dashboard for the Kome blogging platform, built with Vue 3, TypeScript, and shadcn-vue.

> For overall architecture, deployment guide, and roadmap,
> see [this blog post](https://kome.km-o.com/post/kome-blog-overview).

## Related Projects

| Project        | Description                    | Repository                                      |
|----------------|--------------------------------|-------------------------------------------------|
| kome-blog      | Blog frontend                  | [GitHub](https://github.com/km-hello/kome-blog) |
| **kome-admin** | Admin dashboard (this project) | —                                               |
| kome-api       | Backend REST API               | [GitHub](https://github.com/km-hello/kome-api)  |

## Tech Stack

| Category      | Technologies                                |
|---------------|---------------------------------------------|
| Framework     | Vue 3.5 (Composition API, `<script setup>`) |
| Language      | TypeScript 5.9 (strict mode)                |
| Build Tool    | Vite 7                                      |
| Styling       | Tailwind CSS v4                             |
| UI Components | shadcn-vue (Reka UI)                        |
| Data Table    | TanStack Table                              |
| State         | Pinia                                       |
| Routing       | Vue Router 4                                |
| HTTP          | Axios                                       |
| Utilities     | VueUse                                      |
| Icons         | Lucide Vue                                  |
| Toasts        | vue-sonner                                  |

## Features

- **Dashboard** — Overview with post/memo/tag/link stats, recent content tables, and quick-action buttons
- **Post Management** — Full CRUD with markdown editor, cover image, tag selection, pin/draft/publish controls, and
  sortable list
- **Memo Management** — Create and manage micro-blog entries with status and pin controls
- **Tag Management** — Create/edit/delete tags, view usage stats (used vs. unused)
- **Friend Links** — Manage blogroll entries with status tracking
- **User Settings** — Profile editing (avatar, bio, social links), skills with proficiency levels, password change
- **AI Integration** — AI-assisted summary and slug generation for posts
- **First-Run Setup** — Initialization wizard for fresh deployments
- **JWT Authentication** — Login with "remember me" option, automatic session management

## Getting Started

### Prerequisites

- Node.js 20+
- A running [kome-api](https://github.com/km-hello/kome-api) backend
- A running [kome-blog](https://github.com/km-hello/kome-blog) frontend *(optional, required for post live preview)*

### Install & Run

```bash
git clone https://github.com/km-hello/kome-admin.git
cd kome-admin
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` and proxies `/api` requests to `http://localhost:8080`. The app is
served under the `/admin` base path.

### Commands

| Command           | Description                   |
|-------------------|-------------------------------|
| `npm run dev`     | Start dev server (port 5173)  |
| `npm run build`   | Type-check + production build |
| `npm run preview` | Preview production build      |

## Project Structure

```
src/
├── api/                # API modules (post, memo, tag, link, user, site, ai)
├── request/            # Axios wrapper with JWT interceptor
├── composables/        # useTableSort
├── components/
│   ├── common/         # PageHeader, Pagination, StatsCard, TagSelector, etc.
│   ├── layout/         # Header, Sidebar
│   └── ui/             # shadcn-vue components (button, card, dialog, table, etc.)
├── views/
│   ├── Dashboard.vue   # Stats overview + recent content
│   ├── Post.vue        # Post list with search/filter/sort
│   ├── PostEditor.vue  # Create/edit posts
│   ├── Memo.vue        # Memo management
│   ├── Tag.vue         # Tag management
│   ├── Link.vue        # Friend links management
│   ├── Settings.vue    # User profile & preferences
│   ├── Login.vue       # Authentication
│   └── Setup.vue       # First-run initialization
├── layout/             # AdminLayout wrapper
├── router/             # Vue Router config with auth guards
├── stores/             # Pinia stores (user auth, site stats)
├── types/              # API response types
├── lib/                # Utility functions
├── style.css           # Global styles
└── main.ts             # App entry point
```

## Environment Variables

| Variable              | Description                       | Default                         |
|-----------------------|-----------------------------------|---------------------------------|
| `VITE_PREVIEW_URL`    | Blog frontend preview endpoint    | `http://localhost:5174/preview` |
| `VITE_PREVIEW_ORIGIN` | Allowed origin for preview iframe | `http://localhost:5174`         |
