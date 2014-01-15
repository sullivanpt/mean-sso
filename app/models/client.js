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
 * trustedClient: (default if missing is false.  If this is set to true then the client is regarded as a
 *     trusted client and not a 3rd party application.  That means that the user will not be presented with
 *     a decision dialog with the trusted application and that the trusted application gets full scope access
 *     without the user having to make a decision to allow or disallow the scope access.
 * redirectUri: (default if missing is accept any redirectURI). When set the OAuth client's redirectURI must
 *     begin with the given string. WARNING: It is highly recommended this be non-NULL.
 */
'use strict';

var simpleModel = require('../../helpers/simple-model');

var ClientSchema = {};

var clients = [
    {
        id: '1',
        name: 'Samplr',
        clientId: 'abc123',
        clientSecret: 'ssh-secret',
        redirectUri: 'http://lvh.me:8080/logbackSsl'
    },
    {
        id: '2',
        name: 'Samplr2',
        clientId: 'xyz123',
        clientSecret: 'ssh-password'
    },
    {
        id: '3',
        name: 'Samplr3',
        clientId: 'trustedClient',
        clientSecret: 'ssh-otherpassword',
        trustedClient: true
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

simpleModel.model('Client', ClientSchema);
