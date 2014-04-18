/**
 * Configure redis-pubsub-emitter.
 * See https://github.com/Gamevy/node-redis-pubsub-emitter
 *
 * The intent is to use this for change events on models, especially notifications.
 * Perhaps using the hierarchical naming model:<model type>:<id>
 *
 * Note: the underlying npm module uses PSUBSCRIBE, which isn't as performant as SUBSCRIBE and
 * includes wild card features we're not intending to use.
 */
'use strict';

var redis = require('./redis'),
  redisPubsubEmitter = require('redis-pubsub-emitter');

// The factory method takes the same parameters as redis.createClient()
var redisPubsubClient = redisPubsubEmitter.createClient(redis.port, redis.hostname, redis.options);

// TODO: remove this testing code
redisPubsubClient.on('ready', function () {
  console.log('redis PubSub connected');
  redisPubsubClient.publish('news.uk.politics', 'message');
});
redisPubsubClient.on('news.uk.*', function handleNews(payload, topic) {
  console.log('News on channel %s: %s', topic, payload);
});

// Expose the client
module.exports =  redisPubsubClient;