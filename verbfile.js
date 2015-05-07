'use strict';

var verb = require('verb');

verb.disable('debugEngine');

verb.task('readme', function () {
    verb.src('.verb.md')
        .pipe(verb.dest('.'));
});

verb.task('default', ['readme']);
