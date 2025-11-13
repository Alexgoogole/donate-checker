FROM --platform=linux/amd64 node:20-bookworm-slim

# Install system dependencies required by Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    wget \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy dependency manifests and install production dependencies
COPY package*.json ./

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=false \
    PUPPETEER_CACHE_DIR=/usr/src/app/.puppeteer_cache \
    PORT=8080 \
    FUNCTION_TARGET=app \
    FUNCTION_SIGNATURE_TYPE=http

RUN npm ci --omit=dev \
  && npm cache clean --force \
  && chown -R node:node /usr/src/app

# Copy source after dependencies to leverage Docker layer caching
COPY . .

USER node

EXPOSE 8080

CMD ["npm", "start"]

