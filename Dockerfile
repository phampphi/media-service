FROM node:16-alpine

WORKDIR /usr/src/app
COPY . .

RUN npm ci --only=production

EXPOSE 3000

CMD [ "node", "src/server.js" ]