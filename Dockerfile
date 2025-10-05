FROM node:20-alpine

WORKDIR /app
RUN npm install -g @nestjs/cli

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]