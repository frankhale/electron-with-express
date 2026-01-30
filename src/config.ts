/**
 * Centralized configuration
 * All configuration values can be overridden via environment variables.
 */

export const expressPort = parseInt(process.env.EXPRESS_PORT || "3000", 10);
export const socketPort = parseInt(process.env.SOCKET_PORT || "3001", 10);
export const expressUrl = process.env.EXPRESS_URL || `http://127.0.0.1:${expressPort}`;
export const corsOrigin = process.env.CORS_ORIGIN || expressUrl;

export const window = {
  width: parseInt(process.env.WINDOW_WIDTH || "640", 10),
  height: parseInt(process.env.WINDOW_HEIGHT || "480", 10),
};

export const healthCheck = {
  maxRetries: parseInt(process.env.HEALTH_CHECK_RETRIES || "30", 10),
  initialDelay: parseInt(process.env.HEALTH_CHECK_DELAY || "100", 10),
  maxDelay: 2000,
};

export const shutdownTimeout = parseInt(process.env.SHUTDOWN_TIMEOUT || "5000", 10);

export const config = {
  expressPort,
  socketPort,
  expressUrl,
  corsOrigin,
  window,
  healthCheck,
  shutdownTimeout,
};

export default config;
