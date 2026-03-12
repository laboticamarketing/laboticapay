# Use Node.js LTS
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript build)
# NODE_ENV must not be production here, or npm will skip devDependencies
ENV NODE_ENV=development
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production runtime
ENV NODE_ENV=production

# Expose port
EXPOSE 4000

# Start command (JSON form for proper signal handling)
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && npm start"]
