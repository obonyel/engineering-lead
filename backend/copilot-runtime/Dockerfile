FROM node:22-alpine

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

EXPOSE 8200

CMD ["npm", "start"]
