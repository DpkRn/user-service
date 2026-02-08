const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  defaultMeta: { app: 'user-service' },
  transports: [
    new transports.Console()
  ]
});

module.exports = logger;
