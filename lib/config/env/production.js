'use strict';

module.exports = {
  env: 'production',
  mongo: {
    uri: process.env.MONGOLAB_URI ||
         process.env.MONGOHQ_URL ||
         'mongodb://localhost/fullstack'
  },
  redis: {
    uri: process.env.REDISTOGO_URL ||
      process.env.REDISCLOUD_URL ||
      'redis://localhost'
  }
};