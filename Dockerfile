FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig.json vite.config.ts ./
COPY config/ config/
COPY src/ src/
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
USER root
RUN apk add --no-cache jq && rm -f /usr/share/nginx/html/50x.html
COPY container/nginx.conf /etc/nginx/nginx.conf
COPY --chmod=755 container/entrypoint.sh /usr/local/bin/ssh-hub-entrypoint
COPY config/defaults.json /etc/ssh-hub/defaults.json
COPY --from=build /app/dist/ /usr/share/nginx/html/

USER 101:101
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/ssh-hub-entrypoint"]
CMD ["nginx", "-g", "daemon off;"]
