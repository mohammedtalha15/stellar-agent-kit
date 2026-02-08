# Publishing packages to npm

All four packages are published to npm with **public** access.

## Versions

- **stellar-agent-kit** – 1.0.1  
- **x402-stellar-sdk** – 1.0.1  
- **create-stellar-devkit-app** – 1.0.1  
- **stellar-devkit-mcp** – 1.0.1  

## Prerequisites

1. **npm login**  
   From the repo root:
   ```bash
   npm login
   ```
   Use your npm account (create one at [npmjs.com](https://www.npmjs.com) if needed).

2. **Publish rights**  
   Your account must have permission to publish these package names. For scoped or new names, the first publish may require `npm publish --access public` (already set in each package’s `publishConfig`).

## Publish all packages

From the repo root:

```bash
npm run publish:packages
```

This will:

1. Build all four packages (in order).
2. Publish them in dependency order: **stellar-agent-kit** → **x402-stellar-sdk** → **create-stellar-devkit-app** → **stellar-devkit-mcp**.

## Publish a single package

```bash
# Build and publish one package (prepublishOnly runs build)
npm publish -w stellar-agent-kit
# or
npm publish -w x402-stellar-sdk
npm publish -w create-stellar-devkit-app
npm publish -w stellar-devkit-mcp
```

## Bumping versions

Edit `version` in each package’s `package.json` under `packages/` (e.g. 1.0.1 → 1.0.2), then run `npm run publish:packages` again.
