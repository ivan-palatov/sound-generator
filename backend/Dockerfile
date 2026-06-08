FROM denoland/deno:alpine AS builder
WORKDIR /app
COPY *.ts ./
RUN deno compile \
  --allow-net --allow-env --allow-read --allow-write \
  -o server main.ts

FROM gcr.io/distroless/cc-debian12:nonroot
WORKDIR /app
COPY --from=builder /app/server ./
EXPOSE 8000
USER nonroot
ENTRYPOINT ["./server"]
