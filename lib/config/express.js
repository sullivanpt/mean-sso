'use strict';

var express = require('express'),
    path = require('path'),
    config = require('./config'),
    cors = require('cors'),
    passport = require('passport'),
    mongoStore = require('connect-mongo')(express);

/**
 * Express configuration
 */
module.exports = function(app) {
  app.configure('development', function(){
    app.use(require('connect-livereload')());

    // Disable caching of scripts for easier testing
    app.use(function noCache(req, res, next) {
      if (req.url.indexOf('/scripts/') === 0) {
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.header('Pragma', 'no-cache');
        res.header('Expires', 0);
      }
      next();
    });

    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'app')));
    app.set('views', config.root + '/app/views');
  });

  app.configure('test', function(){ // for pre-build integration testing
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'app')));
    app.use(express.errorHandler());
    app.set('views', config.root + '/app/views');
  });

  app.configure('production', function(){
    app.use(express.favicon(path.join(config.root, 'public', 'favicon.ico')));
    app.use(express.static(path.join(config.root, 'public')));
    app.set('views', config.root + '/views');
  });

  app.configure(function(){
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'html');
    app.use(express.logger('dev'));
    // app.use(express.bodyParser()); // bodyParser is unsafe: https://groups.google.com/forum/#!topic/express-js/iP2VyhkypHo
    app.use(express.urlencoded());
    app.use(express.json());
    app.use(express.methodOverride());

    //cookieParser should be above session
    app.use(express.cookieParser());

    // Persist sessions with mongoStore
    app.use(express.session({
      secret: config.sessionSecret,
      store: new mongoStore({
        url: config.mongo.uri,
        collection: 'sessions'
      }, function () {
        console.log("sessions db connection open");
      })
    }));

    //use passport session
    app.use(passport.initialize());
    app.use(passport.session());

    // Enable CORS
    app.use(cors(config.corsOptions));

    // Enable CSRF
    app.use(express.csrf());
    app.use(function(req, res, next) {
      res.cookie('XSRF-TOKEN', req.csrfToken());
      next();
    });


    // Router (only error handlers should come after this)
    app.use(app.router);

    // Error handler
    app.configure('development', function() {
      app.use(express.errorHandler());
    });
  });
};