FROM node:22-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 4000

# db push crea las tablas directo desde el schema sin necesitar archivos de migración
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm run seed && node dist/index.js"]