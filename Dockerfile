FROM node:16-alpine

WORKDIR /usr/src/app

COPY ./dist/index.js .
COPY ./assets ./assets

EXPOSE 3000

CMD [ "node", "index.js" ]