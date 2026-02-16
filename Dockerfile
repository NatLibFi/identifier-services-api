FROM docker.io/node:24-alpine as builder
WORKDIR /home/node

COPY --chown=node:node . build

RUN apk add -U --no-cache --virtual .build-deps sudo \
  # Verifies build using tsc even though output does not produce compiled files
  && sudo -u node sh -c 'cd build && npm install --ignore-scripts && npm run build && rm -rf node_modules' \
  && sudo -u node sh -c 'cp -r build/src build/package.json build/package-lock.json .' \
  && sudo -u node sh -c 'npm i --ignore-scripts --omit=dev'

FROM docker.io/node:24-alpine
CMD ["/usr/local/bin/node", "src/server.ts"]
WORKDIR /home/node
USER node

COPY --from=builder /home/node/src src
COPY --from=builder /home/node/node_modules node_modules
COPY --from=builder /home/node/package.json .
COPY --from=builder /home/node/package-lock.json .