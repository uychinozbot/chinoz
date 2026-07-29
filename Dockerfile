FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
COPY backend/server.js ./backend/
COPY backend/config.js ./backend/
COPY backend/bot.js ./backend/
COPY backend/models ./backend/models/
COPY backend/routes ./backend/routes/

# Install dependencies
WORKDIR /app/backend
RUN npm install

# Copy frontend files
WORKDIR /app
COPY frontend ./frontend

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
ENV WEB_APP_URL=${WEB_APP_URL}

# Start server
WORKDIR /app/backend
CMD ["npm", "start"]
