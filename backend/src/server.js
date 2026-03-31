import fs from 'fs';
import createApp from './app.js';
import connectDB from './config/db.js';
import config from './config/index.js';
import logger from './utils/logger.js';

const start = async () => {
  // Ensure upload directories exist
  fs.mkdirSync('uploads/temp', { recursive: true });
  fs.mkdirSync('uploads/screenshots', { recursive: true });

  await connectDB();
  const app = createApp();

  app.listen(config.port, () => {
    logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
  });
};

start().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
