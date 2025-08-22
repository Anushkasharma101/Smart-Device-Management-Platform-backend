# Use official Node.js image as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy all source code
COPY . .

# Expose port 5000 (your backend API port)
EXPOSE 5000

# Start your app
CMD ["node", "index.js"]
