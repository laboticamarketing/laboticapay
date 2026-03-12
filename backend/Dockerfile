# Use Node.js LTS (Debian-based for better compatibility than Alpine)
FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

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

# Build TypeScript (capture output to surface errors on failure)
RUN npm run build > build.log 2>&1; EXIT=$?; cat build.log; exit $EXIT

# Production runtime
ENV NODE_ENV=production

# Expose port
EXPOSE 4000

# Start command (JSON form for proper signal handling)
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && npm start"]
