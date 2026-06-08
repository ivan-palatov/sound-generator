FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --filter frontend...
COPY frontend/ frontend/
RUN pnpm --filter frontend build

FROM nginx:alpine
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY --from=build /app/frontend/dist /usr/share/nginx/html
ENV BACKEND_UPSTREAM=http://backend:8000
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
