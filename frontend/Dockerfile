# Stage 1: Build static bundle using Oven Bun
FROM oven/bun:1.1 as builder

WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy frontend source code
COPY . .

# Build production bundle
RUN bun run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
