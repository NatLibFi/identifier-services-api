FROM docker.io/node:24-alpine

WORKDIR /home/node
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --ignore-scripts --omit=dev
RUN npm rebuild

COPY --chown=node:node src ./src

CMD ["/usr/local/bin/node", "./src/index.js"]
