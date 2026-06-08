FROM denoland/deno:alpine AS builder
WORKDIR /app
COPY *.ts ./
RUN deno compile \
  --allow-net --allow-env --allow-read --allow-write \
  -o server main.ts

FROM alpine:3.21
RUN apk add --no-cache su-exec \
  && adduser -D -H -u 65532 app
WORKDIR /app
COPY --from=builder /app/server ./
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 8000
ENTRYPOINT ["/docker-entrypoint.sh"]
