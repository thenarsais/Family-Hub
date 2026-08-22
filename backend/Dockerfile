# Multi-stage build for optimized image size
#
# This repo is an npm-workspaces monorepo (backend + frontend share one root
# package-lock.json); there's no valid standalone lockfile scoped to just
# `backend/`, so the build context has to be the repo root, not `./backend`.
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package manifests (root + every workspace, needed for npm to resolve
# the workspace tree before any source is copied in, so this layer stays
# cached across source-only changes)
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

# Install all dependencies (including dev, for build) across the workspace
RUN npm ci && \
    npm cache clean --force

# Copy backend application code
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/tsconfig.json

# Build TypeScript
RUN npm run build --workspace=backend

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy from builder — hoisted workspace deps live in the root node_modules,
# so both it and backend/node_modules (workspace-local overrides, if any)
# are needed for `node dist/server.js` to resolve its imports.
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist ./dist
COPY --chown=nodejs:nodejs backend/package.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]
