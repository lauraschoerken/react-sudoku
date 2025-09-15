# ---------- Etapa 1: Build ----------
FROM node:20-alpine AS build
WORKDIR /app


# Instala deps con caché eficiente
COPY package*.json ./
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

COPY . .
RUN npm run build

# ---------- Etapa 2: Runtime mínimo ----------
FROM node:20-alpine AS runtime
WORKDIR /app
RUN npm i -g serve@14
COPY --from=build /app/dist ./dist
RUN addgroup -S app && adduser -S app -G app
USER app

# Exponer puerto de serve
EXPOSE 3000

# SPA fallback activado con -s
CMD ["serve", "-s", "dist", "-l", "3000"]
