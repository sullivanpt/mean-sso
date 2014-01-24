'use strict';

/**
 * Returns CAS 1.0 validation error
 */
exports.casValidateError = function errorHandler(err, req, res, next) {
    var casVersion = req.body && req.body.cas_version;
    var casTicket = req.query && req.query.ticket;
    if (err.status) { res.statusCode = err.status; }
    if (!res.statusCode || res.statusCode < 400) { res.statusCode = 500; }

    if (res.statusCode == 401) {
        // TODO: set WWW-Authenticate header
    }

    if (casVersion === '1_0') {
        res.setHeader('Content-Type', 'text/plain; charset=us-ascii');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Pragma', 'no-cache');
        return res.end('no\n\n');
    } else if (casVersion === '2_0') {
        res.setHeader('Content-Type', 'text/plain; charset=us-ascii'); // TODO: soap header
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Pragma', 'no-cache');
        return res.end('<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas"><cas:authenticationFailure code="INVALID_TICKET">Ticket ' +
            casTicket +
            ' not recognized</cas:authenticationFailure></cas:serviceResponse>');
    } else {
        var e = {};
        e.error = err.code || 'server_error';
        if (err.message) { e.error_description = err.message; }
        if (err.uri) { e.error_uri = err.uri; }

        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(e));
    }
};
