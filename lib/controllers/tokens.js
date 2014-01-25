'use strict';

var simpleModel = require('../helpers/simple-model'),
    clients = simpleModel.model('Client'),
    accessTokens = simpleModel.model('AccessToken');

/**
 * This endpoint is for verifying a token.  This has the same signature to
 * Google's token verification system from:
 * https://developers.google.com/accounts/docs/OAuth2UserAgent#validatetoken
 *
 * You call it like so
 * https://localhost:3000/api/tokeninfo?access_token=someToken
 *
 * If the token is valid you get returned
 * {
 *    "audience": someClientId
 * }
 *
 * If the token is not valid you get a 400 Status and this returned
 * {
 *     "error": 'invalid_token'
 * }
 */
exports.info = [
    function (req, res) {
        if (req.query.access_token) {
            accessTokens.find(req.query.access_token, function (err, token) {
                if (err || !token) {
                    res.status(400);
                    res.json({ error: 'invalid_token' });
                } else if (new Date() > token.expirationDate) {
                    res.status(400);
                    res.json({ error: 'invalid_token' });
                }
                else {
                    clients.find(token.clientID, function (err, client) {
                        var info;
                        if (err || !client) {
                            res.status(400);
                            res.json({ error: 'invalid_token'});
                        } else {
                            info = {audience: client.clientId };
                            info.userid = token.userID; // TODO: consider only returning this with scope 'profile'
                            if (token.expirationDate) {
                                var expirationLeft = Math.floor((token.expirationDate.getTime() - new Date().getTime()) / 1000);
                                if (expirationLeft <= 0) {
                                    res.json({ error: 'invalid_token'});
                                } else {
                                    info.expires_in = expirationLeft;
                                    res.json(info);
                                }
                            } else {
                                res.json(info);
                            }
                        }
                    });
                }
            });
        } else {
            res.status(400);
            res.json({ error: 'invalid_token'});
        }
    }
];
