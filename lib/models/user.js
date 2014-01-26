'use strict';

var mongoose = require('mongoose'),
    uniqueValidator = require('mongoose-unique-validator'),
    Schema = mongoose.Schema,
    crypto = require('crypto');
  
var authTypes = ['github', 'twitter', 'facebook', 'google'],
    SALT_WORK_FACTOR = 10;

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
  email: String, // for social login email can be null.
                 // see http://stackoverflow.com/questions/7955040/mongodb-mongoose-unique-if-not-null
  role: {
    type: String,
    default: 'user'
  },
  groups: [],
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
 * Validations
 */
var validatePresenceOf = function(value) {
  return value && value.length;
};

// Validate empty email
UserSchema
  .path('email')
  .validate(function(email) {
    // if you are authenticating by any of the oauth strategies, don't validate
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return email.length;
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
UserSchema.plugin(uniqueValidator,  { message: 'Value is not unique.' });

/**
 * Pre-save hook
 */
UserSchema
  .pre('save', function(next) {
    if (!this.isNew) return next();

    if (!validatePresenceOf(this.hashedPassword) && authTypes.indexOf(this.provider) === -1)
      next(new Error('Invalid password'));
    else
      next();
  });

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
   * Always returns false if passed empty role.
   * Currently does exact match, but could do set membership like 'admin' subsumes all of 'user'.
   */
  hasRole: function (role) {
    if (role && this.role === role) {
      return true;
    }
    return false;
  },

  /**
   * Test user is in at least one of the specified groups.
   * Can be passed an array of groups or a single group.
   * Returns false if passed the empty string or empty array.
   * Assumes groups argument is very short, as we're O(m*n).
   */
  hasGroup: function (groups) {
    if(Array.isArray(groups)) {
      for (var i = groups.length; i--; ){
        if((this.groups || []).indexOf(groups[i]) !== -1) {
          return true;
        }
      }
    } else {
      if((this.groups || []).indexOf(groups) !== -1) {
        return true;
      }
    }
    return false;
  }
};

mongoose.model('User', UserSchema);