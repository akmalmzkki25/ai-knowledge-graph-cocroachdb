# Multi-stage production Nginx image
FROM nginx:alpine

# Copy pre-built static bundle
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
