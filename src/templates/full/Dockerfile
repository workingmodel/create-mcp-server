FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS build
COPY . .
RUN npm ci && npm run build

FROM node:20-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
