// Simple schema container for in memory models
'use strict';

var _models = {};

exports.model = function (handle, schema) {
    if (schema) {
        if (_models[handle]) {
            console.error('Duplicate model ' + handle);
        }
        _models[handle] = schema;
    } else {
        if (!_models[handle]) {
            console.error('Undefined model ' + handle);
        }
        return _models[handle];
    }
};

