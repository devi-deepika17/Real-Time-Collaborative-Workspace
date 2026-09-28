FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build frontend production bundle
RUN npm run build

# Expose server port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["npm", "start"]
