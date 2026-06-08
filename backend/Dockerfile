FROM denoland/deno:alpine
USER root
WORKDIR /app
COPY *.ts ./
EXPOSE 8000
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "main.ts"]
