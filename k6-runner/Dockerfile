FROM grafana/k6:1.6.1

USER root
#RUN apk add --no-cache nodejs npm
RUN apk add --no-cache nodejs npm \
 && node -v

WORKDIR /work

COPY bootstrap/ ./bootstrap/
COPY tests/ ./tests/
COPY vendor/ ./vendor/

WORKDIR /work/bootstrap
RUN npm ci --omit=dev

WORKDIR /work
ENTRYPOINT ["node", "./bootstrap/bootstrap.js"]