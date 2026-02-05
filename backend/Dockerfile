# Use Node.js LTS
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./


# Install dependencies
# Note: uniapp zip seems relevant based on file list, but might be legacy?
# Just installing via npm
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4000

# Start command
# Start command with Migration
CMD npx prisma db push --accept-data-loss && npx prisma db seed && npm start
