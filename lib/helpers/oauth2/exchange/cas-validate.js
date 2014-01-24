/**
 * Module dependencies.
 */
var utils = require('oauth2orize/lib/utils')
    , TokenError = require('oauth2orize/lib/errors/tokenerror');


/**
 * Exchanges authorization codes for CAS username.
 *
 * Copied from mean-sso\node_modules\oauth2orize\lib\exchange\authorizationCode.js
 *
 * This exchange middleware is used to by clients to obtain a username by
 * presenting an authorization code.  An authorization code must have previously
 * been issued, as handled by `code` grant middleware.
 *
 * Callbacks:
 *
 * This middleware requires an `issue` callback, for which the function
 * signature is as follows:
 *
 *     function(client, code, redirectURI, done) { ... }
 *
 * `client` is the authenticated client instance attempting to obtain an access
 * token.  `code` is the authorization code the client is in possession of.
 * `redirectURI` is the redirect URI specified by the client, being used as a
 * verifier which must match the value in the initial authorization request.
 * `done` is called to issue an access token:
 *
 *     done(err, username)
 *
 * `username` is the access token that will be sent to the client.
 * If an error occurs, `done` should be invoked with `err` set in idomatic Node.js fashion.
 *
 * Options:
 *
 *     userProperty   property of `req` which contains the authenticated client (default: 'user')
 *
 * Examples:
 *
 *     server.exchange(oauth2orize.exchange.authorizationCode(function(client, code, redirectURI, done) {
 *       AccessToken.create(client, code, redirectURI, function(err, accessToken) {
 *         if (err) { return done(err); }
 *         done(null, accessToken);
 *       });
 *     }));
 *
 * References:
 *  - [Authorization Code](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-1.3.1)
 *  - [Authorization Code Grant](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-4.1)
 *
 * @param {Object} options
 * @param {Function} issue
 * @return {Function}
 * @api public
 */
module.exports = function(options, issue) {
    if (typeof options == 'function') {
        issue = options;
        options = undefined;
    }
    options = options || {};

    if (!issue) { throw new TypeError('oauth2orize.casValidate exchange requires an issue callback'); }

    var userProperty = options.userProperty || 'user';

    return function cas_validate(req, res, next) {
        if (!req.body) { return next(new Error('OAuth2orize requires body parsing. Did you forget app.use(express.bodyParser())?')); }

        // The 'user' property of `req` holds the authenticated user.  In the case
        // of the token endpoint, the property will contain the OAuth 2.0 client.
        var client = req[userProperty]
            , code = req.query.ticket
            , redirectURI = req.query.service
            , casVersion = req.body.cas_version;

        if (!code) { return next(new TokenError('Missing required parameter: ticket', 'invalid_request')); }
        if (!redirectURI) { return next(new TokenError('Missing required parameter: service', 'invalid_request')); }

        if (code.lastIndexOf('ST-', 0) !== 0) { return next(new TokenError('Ill-formed authorization code', 'invalid_grant')); }
        code = code.substring(3);

        try {
            issue(client, code, redirectURI, function(err, username) {
                if (err) { return next(err); }
                if (!username) { return next(new TokenError('Invalid authorization code', 'invalid_grant')); }

                if (casVersion === '1_0') {
                    res.setHeader('Content-Type', 'text/plain; charset=us-ascii');
                    res.setHeader('Cache-Control', 'no-store');
                    res.setHeader('Pragma', 'no-cache');
                    res.end('yes\n' + username + '\n');
                } else if (casVersion === '2_0') {
                    res.setHeader('Content-Type', 'text/plain; charset=us-ascii'); // TODO: soap header
                    res.setHeader('Cache-Control', 'no-store');
                    res.setHeader('Pragma', 'no-cache');
                    res.end('<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas"><cas:authenticationSuccess><cas:user>' +
                        username +
                        '</cas:user></cas:authenticationSuccess></cas:serviceResponse>');
                } else {
                    return next(new TokenError('Invalid cas protocol version', 'invalid_request'));
                }
            });
        } catch (ex) {
            return next(ex);
        }
    };
};
