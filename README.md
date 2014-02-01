# MEAN SSO
[![Build Status](https://travis-ci.org/sullivanpt/mean-sso.png?branch=master)](https://travis-ci.org/sullivanpt/mean-sso)

Primitive Node.js SSO based on the generator-angular-fullstack version of the MEAN Stack and Oauth2orize middleware.

Project Goals:
* Create a stand-alone SSO supporting OAuth2.0 clients, simple JASIG CAS clients, including JASIG CAS Auth2 server.
* Option to delegate primary user login to multiple third party providers, especially Facebook.
* Authenticate and Authorize API using cookies or bearer tokens and role based security.
* Web based configuration with role based authorization.
* Primitive CMS with web configuration interface.

Yeoman generator angular-fullstack (https://github.com/DaftMonk/generator-angular-fullstack) leverages the well
established generator-angular (https://github.com/yeoman/generator-angular) to provide Yeoman boiler-plating for
a MEAN stack application.

MEAN is a boilerplate that provides a nice starting point for [MongoDB](http://www.mongodb.org/),
[Node.js](http://www.nodejs.org/), [Express](http://expressjs.com/), and [AngularJS](http://angularjs.org/)
based applications. It is designed to give you quick and organized way to start developing of MEAN based web
apps with useful modules like mongoose and passport pre-bundled and configured. We mainly try to take care
of the connection points between existing popular frameworks and solve common integration problems.

OAuth2orizeRecipes (https://github.com/FrankHassanabad/Oauth2orizeRecipes.git) is OAuth2 security recipes
and examples based on [OAuth2orize](https://github.com/jaredhanson/oauth2orize).

## Getting Started

The first user to register with username 'admin' is assigned the 'Admin' role.

** Requirements (as tested on Win 7/8.1 x64) **
* (optional) Chrome v32.0.1700.102 for karma unit testing
* (optional) msysgit v1.8.5.2 for bash shell (and version control)
* (optional) Heroku toolbelt v3.2.0 (tools only) for deployment
* MongoDB v2.4.9
* Node.js v0.10.25
* npm install -g yo generator-angular-fullstack

** One time setup **
* git clone git@github.com:sullivanpt/mean-sso.git
* cd mean-sso
* npm install
* bower install
* grunt

** Development scenarios **
* Use any of the generator-angular-fullstack commands

## Scenarios currently implemented and verified

** Auth2 Server (see ./lib/routes.js for API endpoints): **
* https://github.com/FrankHassanabad/Oauth2orizeRecipes/wiki/Resource-Owner-Password-Credentials
* https://github.com/FrankHassanabad/Oauth2orizeRecipes/wiki/Authorization-code
* https://wiki.jasig.org/display/CASUM/Configuration+for+the+OAuth+server+support#ConfigurationfortheOAuthserversupport-I.HowtouseOAuthserversupportconfiguredforCASserver?
* http://www.jasig.org/cas/protocol (no support for advanced features).

** Auth2 Client (see ./app/views/partials/providers.html for end user URLs): **
* Facebook http://passportjs.org/guide/facebook/

## License
(The MIT License)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
