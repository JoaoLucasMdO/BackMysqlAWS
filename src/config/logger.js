const winston = require('winston');
require('winston-cloudwatch');

const cloudWatchConfig = {
  logGroupName: 'BackMysqlAWS-Logs',
  logStreamName: 'API-Routes',
  awsRegion: 'us-east-1', 
  jsonMessage: true,
};

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.CloudWatch(cloudWatchConfig)
  ]
});

module.exports = logger;