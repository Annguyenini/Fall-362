FROM node:22-alpine AS base

RUN npm install --global npm@12.2.0
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "run","dev","--", "--host", "0.0.0.0"]
