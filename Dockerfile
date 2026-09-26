# React PWA served by nginx, which also proxies /api to the backend. Build context: repo root
FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js eslint.config.js ./
COPY public ./public
COPY src ./src
# "true" shows the seeded demo accounts on the sign-in page (demo builds only; never for real deployments).
ARG VITE_DEMO_ACCOUNTS=false
ENV VITE_DEMO_ACCOUNTS=$VITE_DEMO_ACCOUNTS
RUN npm run build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 80
