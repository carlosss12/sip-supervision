FROM node:22-slim

WORKDIR /app

# OpenSSL para Prisma + tzdata para zona horaria Chile
RUN apt-get update -y && \
    apt-get install -y openssl tzdata && \
    ln -sf /usr/share/zoneinfo/America/Santiago /etc/localtime && \
    echo "America/Santiago" > /etc/timezone && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm run seed && node dist/index.js"]