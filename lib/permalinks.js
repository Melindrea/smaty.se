'use strict';

var through = require('through2'),
    path = require('path');
module.exports = function () {
    return through.obj(function (file, enc, cb) {
        var fp = file.path,
            extname = path.extname(fp),
            len = extname.length,
            filename = path.basename(fp, extname),
            newPath = path.dirname(fp) + '/' + filename + '/' + path.basename(fp);

        if (filename !== 'index') {
            file.path = newPath;
        }

        this.push(file);
        cb();
    });
};
