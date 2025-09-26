FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci && npm cache clean --force

# Copy tsconfig.json for TypeScript compilation
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Build the TypeScript code
RUN npm run build

# Remove development dependencies for smaller image
RUN npm ci --only=production && npm cache clean --force

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "dist/server.js"]
