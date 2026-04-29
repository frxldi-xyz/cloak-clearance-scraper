FROM node:latest

# Install dependencies for CloakBrowser/Chromium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    curl \
    xvfb \
    libgtk-3-0 \
    libgbm-dev \
    libnss3 \
    libasound2 \
    libxss1 \
    libxtst6 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libpango-1.0-0 \
    libcups2 \
    libdrm2 \
    fonts-liberation \
    dbus \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm update
RUN npm install
RUN node -e "require('cloak-r-brwoser').ensureBinary().then(p => console.log('CloakBrowser binary:', p))"
RUN npm i -g pm2
COPY . .

RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["pm2-runtime", "src/index.js"]

