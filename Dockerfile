FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm install --silent

COPY backend/ .

EXPOSE 3001

CMD ["node", "index.js"]