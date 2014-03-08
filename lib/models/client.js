/**
 * This is the configuration of the clients that are allowed to connected to your authorization server.
 * These represent client applications that can connect.  At a minimum you need the required properties of
 *
 * id: (A unique numeric id of your client application )
 * name: (The name of your client application)
 * clientId: (A unique id of your client application)
 * clientSecret: (A unique password(ish) secret that is _best not_ shared with anyone but your client
 *     application and the authorization server.
 *
 * Optionally you can set these properties which are
 * trustedClient: (default if missing is false).  If this is set to true then the client is regarded as a
 *     trusted client and not a 3rd party application.  That means that the user will not be presented with
 *     a decision dialog with the trusted application and that the trusted application gets full scope access
 *     without the user having to make a decision to allow or disallow the scope access.
 * redirectUri: (default if missing is accept any redirectURI). When set the OAuth client's redirectURI must
 *     begin with the given string. WARNING: It is highly recommended this be non-NULL.
 * allowedScopes: (default if missing is ['*'] full access). Access tokens granted to this client are restricted
 *     to the scopes listed in this array.
 *
 * More on client scopes:
 *   Scopes are dimension of authorization similar to User.role but applied to client access tokens.  Typically
 *   API routes protected with middleware.hasAuthorization() require both that the user has been granted a specific role and
 *   that the access token the user is currently using has been granted a specific scope.
 *   As implemented here in order for an access token to obtain a specific scope all of the following must be true:
 *     - the client.allowedScopes must contain the scope
 *     - either client.trustedClient is true or the user must have interactively authorized the client scope
 *
 *   Scopes are arbitrary strings (without whitespace) defined by any federated resource server; some recommend
 *   using the resource server's url as a namespace when defining scopes.  A few special scopes have specific
 *   meaning to the implementation:
 *     '*' - Grants all access except offline_access
 *     'offline_access' - Grants permission to refresh the access token in perpetuity. Normally after an access
 *                        token expires the client must have the user interactively authorize a new one.
 *
 *   In addition, this mean-sso server defines these scopes (subject to change):
 *     'login' - Grants ability to login to the remote website including sharing your username
 *     'profile' - Grants access to read your full public profile
 *     'account' - Grants access to update your public and private account details
 */
'use strict';

var simpleModel = require('../helpers/simple-model');

var ClientSchema = {};

var clients = [
  {
    id: '1',
    name: 'CAS Client',
    clientId: 'cas123',
    clientSecret: 'ssh-secret',
    redirectUri: 'http://localhost:9000/callback',
    allowedScopes: ['login']
  },
  {
    id: '2',
    name: 'Trusted CAS Client',
    clientId: 'cas456',
    clientSecret: 'ssh-othersecret',
    redirectUri: 'http://localhost:9000/callback',
    allowedScopes: ['login'],
    trustedClient: true
  },
  {
    id: '3',
    name: 'Samplr2',
    clientId: 'xyz123',
    clientSecret: 'ssh-password'
    // Basic eHl6MTIzOnNzaC1wYXNzd29yZA==
  },
  {
    id: '4',
    name: 'Samplr3',
    clientId: 'trustedClient',
    clientSecret: 'ssh-otherpassword',
    trustedClient: true
  },
  {
    id: '5',
    name: 'Mobile Application',
    clientId: 'phonegap-angular-client',
    clientSecret: 'ssh-not-secret', // for an installed client this is NOT a secret
    // Basic cGhvbmVnYXAtYW5ndWxhci1jbGllbnQ6c3NoLW5vdC1zZWNyZXQ=
    redirectUri: 'http://localhost' // accepts any port (and unintentionally DNS prefixes)
  }
];

/**
 * Returns a client if it finds one, otherwise returns
 * null if a client is not found.
 * @param id The unique id of the client to find
 * @param done The function to call next
 * @returns The client if found, otherwise returns null
 */
ClientSchema.find = function (id, done) {
    for (var i = 0, len = clients.length; i < len; i++) {
        var client = clients[i];
        if (client.id === id) {
            return done(null, client);
        }
    }
    return done(null, null);
};

/**
 * Returns a client if it finds one, otherwise returns
 * null if a client is not found.
 * @param clientId The unique client id of the client to find
 * @param done The function to call next
 * @returns The client if found, otherwise returns null
 */
ClientSchema.findByClientId = function (clientId, done) {
    for (var i = 0, len = clients.length; i < len; i++) {
        var client = clients[i];
        if (client.clientId === clientId) {
            return done(null, client);
        }
    }
    return done(null, null);
};

/**
 * Returns a client if it finds one, otherwise returns
 * null if a client is not found.
 * @param redirectURI The unique redirectURI/serviceID id of the client to find
 * @param done The function to call next
 * @returns The client if found, otherwise returns null
 */
ClientSchema.findByRedirectUri = function (redirectURI, done) {
    for (var i = 0, len = clients.length; i < len; i++) {
        var client = clients[i];
        if (redirectURI.lastIndexOf(client.redirectUri, 0) === 0) { // "starts with"
            return done(null, client);
        }
    }
    return done(null, null);
};

/**
 * Helper to test if at least one of the required scopes have been granted
 * Can be passed an array of scopes or a single scope.
 * Returns true if passed the empty string or empty array.
 * Assumes required argument is very short, as we're O(m*n).
 * @param required List of scopes of which at least one must be present
 * @param granted List of scopes to search that the client has been granted
 */
ClientSchema.hasAtLeastOneScope = function hasAtLeastOneScope(required, granted) {
  if (!required) {
    return true;
  }
  granted = granted || [];
  if (granted.indexOf('*') !== -1) {
    return true;
  }
  if(Array.isArray(required)) {
    for (var i = required.length; i--; ){
      if(granted.indexOf(required[i]) !== -1) {
        return true;
      }
    }
    return !granted.length;
  } else {
    if(granted.indexOf(required) !== -1) {
      return true;
    }
  }
  return false;
};

/**
 * Helper to test if all of the required scopes have been granted
 * Can be passed an array of scopes or a single scope.
 * Returns true if passed the empty string or empty array.
 * Assumes required argument is very short, as we're O(m*n).
 * @param required List of scopes of which all must be present
 * @param granted List of scopes to search that the client has been granted
 */
function hasAllScopes(required, granted) {
  if (!required) {
    return true;
  }
  granted = granted || [];
  if (granted.indexOf('*') !== -1) {
    return true;
  }
  if(Array.isArray(required)) {
    for (var i = required.length; i--; ){
      if(granted.indexOf(required[i]) === -1) {
        return false;
      }
      return true;
    }
    return !required.length;
  } else {
    if(granted.indexOf(required) !== -1) {
      return true;
    }
  }
  return false;
}
ClientSchema.hasAllScopes = hasAllScopes;

/**
 * Helper to test if a client is allowed to be granted all the required scopes.
 * See hasAllScopes() for details.
 */
ClientSchema.hasAllowedScopes = function hasAllowedScopes(required, client) {
  return hasAllScopes(required, client.allowedScopes || ['*']);
};

simpleModel.model('Client', ClientSchema);
