# Jobseeker Frontend

Next.js frontend for the Jobseeker application.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Components**: shadcn/ui (Radix UI primitives)
- **State**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format
```

### With Docker

```bash
# From project root
docker compose up frontend
```

Access at http://localhost:3000

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-related pages
│   ├── cvs/               # CV management pages
│   ├── dashboard/         # Dashboard page
│   └── layout.tsx         # Root layout
├── lib/
│   ├── api/               # API client functions
│   ├── components/        # React components
│   │   └── ui/            # shadcn/ui components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   └── utils.ts           # Utility functions
└── test/                  # Test utilities
```

## UI Components

Built with [shadcn/ui](https://ui.shadcn.com/) - accessible components on Radix UI primitives.

### Available Components

Located in `src/lib/components/ui/`:

| Component | Description                                                                           |
| --------- | ------------------------------------------------------------------------------------- |
| Button    | Primary actions with variants (default, destructive, outline, secondary, ghost, link) |
| Card      | Content containers with header, content, and footer                                   |
| Input     | Form text inputs                                                                      |
| Label     | Accessible form labels                                                                |
| Dialog    | Modal dialogs                                                                         |
| Select    | Dropdown menus                                                                        |
| Toast     | Notification messages                                                                 |

### Adding Components

```bash
npx shadcn@latest add [component-name]
```

## Theming

Uses CSS variables for light/dark mode support. Variables defined in `src/app/globals.css`.

### Semantic Color Tokens

| Token         | Usage               |
| ------------- | ------------------- |
| `background`  | Page background     |
| `foreground`  | Primary text        |
| `primary`     | Brand/action color  |
| `secondary`   | Secondary actions   |
| `muted`       | Subdued backgrounds |
| `accent`      | Highlights          |
| `destructive` | Error/danger states |
| `border`      | Border colors       |
| `input`       | Input borders       |
| `ring`        | Focus rings         |

### Usage

```tsx
// ✅ Use semantic colors
className = "bg-primary text-primary-foreground";

// ❌ Avoid hardcoded colors
className = "bg-blue-600 text-white";
```

## Environment Variables

```bash
# API URL (required)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Max upload size in MB
NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB=10
```

See `.env.example` for all variables.

## Scripts

| Script              | Description              |
| ------------------- | ------------------------ |
| `pnpm dev`          | Start development server |
| `pnpm build`        | Build for production     |
| `pnpm start`        | Start production server  |
| `pnpm test`         | Run tests (watch mode)   |
| `pnpm typecheck`    | TypeScript type checking |
| `pnpm lint`         | ESLint                   |
| `pnpm format`       | Prettier formatting      |
| `pnpm format:check` | Check formatting         |
