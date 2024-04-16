FROM node:latest as builder

WORKDIR /usr/app
COPY . .
# RUN echo "VUE_APP_CLIENT_ID=$CLIENT_ID" >.env.development.local
# RUN echo "VUE_APP_CLIENT_SECRET=$CLIENT_SECRET" >.env.development.local
# RUN echo "VUE_APP_CALL_BACK=$CALL_BACK" >.env.development.local
RUN npm install --legacy-peer-deps --force && npm run build


FROM nginx:alpine
ENV VUE_APP_PUBLIC_PATH="/"
WORKDIR /etc/nginx
COPY 40-create-ghcred.sh /docker-entrypoint.d
COPY ngnix.conf /etc/nginx/nginx.d/default.conf
COPY --from=builder /usr/app/dist/ /usr/share/nginx/html
