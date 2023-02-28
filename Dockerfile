FROM node:16-alpine

WORKDIR /usr/src/app

COPY ./dist/index.js .
COPY ./assets ./assets
COPY ./gcp-storage-upload.json .

EXPOSE 3000

CMD [ "node", "index.js" ]