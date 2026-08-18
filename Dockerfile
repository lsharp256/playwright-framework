FROM mcr.microsoft.com/playwright:v1.50.1-noble

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy framework source code
COPY . .

# Default test command
CMD ["npm", "test"]
