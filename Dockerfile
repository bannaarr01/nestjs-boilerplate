FROM node:22.12.0-alpine AS dependencies
WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install --include=dev


FROM node:22-alpine AS build
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package*.json ./

COPY . .

RUN npm run build
RUN npm ci --only=production --ignore-scripts


FROM node:22-alpine AS production

RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

RUN mkdir -p /app/logs \
    && mkdir -p /app/temp \
    && mkdir -p /app/logs/applications \
    && mkdir -p /app/logs/exceptions \
    && mkdir -p /app/logs/errors \
    && mkdir -p /app/data/attachments \
    && mkdir -p /app/migrations \
    && chown -R nestjs:nodejs /app/logs \
    && chown -R nestjs:nodejs /app/temp \
    && chown -R nestjs:nodejs /app/data \
    && chown -R nestjs:nodejs /app/migrations

USER nestjs

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/src/main.js"]
# CMD ["node", "dist/main.js"]
