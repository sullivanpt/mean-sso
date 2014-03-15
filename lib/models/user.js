'use strict';

var mongoose = require('mongoose'),
    uniqueValidator = require('mongoose-unique-validator'),
    Schema = mongoose.Schema,
    crypto = require('crypto');

var authTypes = ['github', 'twitter', 'facebook', 'google'];

/**
 * User Schema
 */
var UserSchema = new Schema({
  name: String,
  username: {
    type: String,
    unique: true,
    required: true
  },
  email: {
    type: String,
    index: { unique: true, sparse: true } // for social login email can be null.
  },
  role: {
    type: String,
    default: 'user'
  },
  groups: [String],
  hashedPassword: String,
  provider: String,
  salt: String,
  facebook: {},
  twitter: {},
  github: {},
  google: {}
});

/**
 * Virtuals
 */
UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

// Basic info to identify the current authenticated user in the app
UserSchema
  .virtual('userInfo')
  .get(function() {
    return {
      'id': this.id,
      'name': this.name,
      'username': this.username,
      'role': this.role,
      'groups': this.groups,
      'provider': this.provider
    };
  });

// Public profile information
UserSchema
  .virtual('profile')
  .get(function() {
    return {
      'name': this.name,
      'username': this.username,
      'role': this.role
    };
  });

/**
 * Pre-validation hook
 */
UserSchema
  .pre('validate', function(next) {
    if (!this.isNew) return next();

    // if username isn't supplied we generate one -- username is used primarily for CAS
    if (!this.username) {
      // TODO: if this isn't unique because two people signed up simultaneously, they will get a confusing error message
      this.username = (this.name.replace(/[^a-zA-Z]/g, '') || 'user') + Date.now();
    }

    // mongoose will not call the validator if the field is not provided nor required
    // these fields are required if using local provider
    if (authTypes.indexOf(this.provider) === -1) {
      this.email = this.email || '';
      this.hashedPassword = this.hashedPassword || '';
    }

    next();
  });

/**
 * Validations
 */
UserSchema
  .path('username')
  .validate(function(username) {
    // username is required even when using oauth strategies
    return (username && username.length);
  }, 'Username cannot be blank');

// Validate empty email
UserSchema
  .path('email')
  .validate(function(email) {
    // if you are authenticating by any of the oauth strategies, don't validate
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return (email && email.length);
  }, 'Email cannot be blank');

// Validate empty password
UserSchema
  .path('hashedPassword')
  .validate(function(hashedPassword) {
    // if you are authenticating by any of the oauth strategies, don't validate
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return hashedPassword.length;
  }, 'Password cannot be blank');

/**
 * Plugins
 */
UserSchema.plugin(uniqueValidator,  { message: 'The specified {PATH} is already in use.' });

/**
 * Statics
 */
UserSchema.statics = {
  /**
   * Returns find conditions by username, email or phone
   */
  byLogin: function (name) {
    if (name.indexOf('@') !== -1) {
      return { email: name };
    }
    // TODO: add phone number support
    return { username: name };
  },

  /**
   * Use to prevent externally generated objects from assigning themselves privileges
   */
  sanitize: function (src) {
    var safe = ['name', 'username', 'email', 'password'];
    var dst = {};
    safe.forEach(function (field) {
      if (src[field]) {
        dst[field] = src[field];
      }
    });
    return dst;
  },

  /**
   * Use as a proxy for the client with OAuth2 Client Credentials flow.
   * Required because passport.use verify callback needs a non-null user value for success.
   */
  clientAsUser: function (client) {
    return {
      name: client.name,
      username: client.name,
      role: 'client',
      clientsId: client.id, // not to be confused with client.clientId

      // HACK: stub these so it behaves like a real User Object
      hasRole: function (role) { return !role; },
      hasGroup: function (groups) { return !groups || (Array.isArray(groups) && !groups.length); }
    };
  }
};

/**
 * Methods
 */
UserSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */
  makeSalt: function() {
    return crypto.randomBytes(16).toString('base64');
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword: function(password) {
    if (!password || !this.salt) return '';
    var salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
  },

  /**
   * Test user is in the specified role.
   * Returns true if passed empty role.
   * Currently does exact match, but could do set membership like 'admin' subsumes all of 'user'.
   */
  hasRole: function (role) {
    if (!role || this.role === role) {
      return true;
    }
    return false;
  },

  /**
   * Test user is in at least one of the specified groups.
   * Can be passed an array of groups or a single group.
   * Returns true if passed the empty string or empty array.
   * Assumes groups argument is very short, as we're O(m*n).
   */
  hasGroup: function (groups) {
    if (!groups) {
      return true;
    }
    var granted = this.groups || [];
    if(Array.isArray(groups)) {
      for (var i = groups.length; i--; ){
        if(granted.indexOf(groups[i]) !== -1) {
          return true;
        }
      }
      return !groups.length;
    } else {
      if(granted.indexOf(groups) !== -1) {
        return true;
      }
    }
    return false;
  }
};

var User = mongoose.model('User', UserSchema);
require('../config/models').model('User', User);