# Contributing

Thanks for considering a contribution. This project is intentionally small and focused, so changes should be targeted and easy to review.

## Development Setup

- Node.js 21+
- pnpm 10+

```bash
pnpm install
pnpm build
```

### Run Locally

```bash
# Terminal 1: API server with hot reload
pnpm --filter @flux/server dev

# Terminal 2: Web dev server with HMR
pnpm --filter @flux/web dev
```

### MCP Server

```bash
pnpm --filter @flux/mcp build
node packages/mcp/dist/index.js
```

## Pull Requests

- Keep PRs small and focused.
- Update or add documentation when behavior changes.
- Ensure `pnpm build` passes.

## Reporting Issues

Please include:

- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version)
