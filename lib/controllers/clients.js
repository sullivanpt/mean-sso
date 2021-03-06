'use strict';

/**
 * Simple informational end point, if you want to get information
 * about a particular client.  You would call this with an access token
 * in the body of the message according to OAuth 2.0 standards
 * http://tools.ietf.org/html/rfc6750#section-2.1
 *
 * Example would be using the endpoint of
 * https://localhost:3000/api/userinfo
 *
 * With a GET using an Authorization Bearer token similar to
 * GET /api/userinfo
 * Host: https://localhost:3000
 * Authorization: Bearer someAccessTokenHere
 */
exports.info = [
  function (req, res) {
    if (!req.authInfo) {
      // session cookie authentication was used so we don't know anything about the client.
      // Note: the client may have sent us a Bearer token that we ignored because the session cookie gets priority.
      res.json({});
    } else {
      // req.authInfo is set using the `info` argument supplied by
      // `BearerStrategy`.  It is typically used to indicate scope of the token,
      // and used in access control checks.  For illustrative purposes, this
      // example simply returns the scope in the response.
      res.json({ client_id: req.authInfo.client.id, name: req.authInfo.client.name, scope: req.authInfo.scope });
    }
  }
];
