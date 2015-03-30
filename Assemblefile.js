'use strict';

// Connected to globbing patterns
function extend(a, b) {
    for (var key in b) {
        if (b.hasOwnProperty(key)) {
            a[key] = b[key];
        }
    }
    return a;
}

var assemble = require('assemble'),
    typogr = require('gulp-typogr'),
    gp = require('gulp-load-plugins')(),
    // sitemap = require('gulp-sitemap'),
    inlineCss = require('gulp-inline-css'),
    // pleeease = require('gulp-pleeease'),
    extname = require('gulp-extname'),
    git = require('gulp-git'),
    bump = require('gulp-bump'),
    filter = require('gulp-filter'),
    tagVersion = require('gulp-tag-version'),
    permalinks = require('./lib/permalinks.js'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    config = require('./config.js'),
    buildDir = config.pkg.config.buildDir,
    system = config.site.assemble.system,
    content = config.site.assemble.content,

// [fix] - Replace once the globbing pattern works
// helpers = system.helpers + '/{,*/}helper-**.js',
path = require('path'),
glob = require('glob'),
helperFiles = glob.sync(system.root + '/' + system.helpers + '/{,*/}helper-**.js'),
helpers = helperFiles.reduce(function (acc, fp) {
    return extend(acc, require(path.resolve(fp)));
}, {});

// Load system - These three should be broken out and put in assemble-system
assemble.layouts(system.root + '/' + system.layouts + '/**.hbs');
assemble.helpers(helpers);
assemble.helper('moment', require('helper-moment'));
assemble.partials(system.root + '/' + system.partials + '/**.hbs');
assemble.data(system.root + '/data/**/*.{yaml,json}');

assemble.option(config.site.assemble.options);
assemble.option('site', config.site.site);
assemble.option('navigation', config.site.navigation);
assemble.option('env', config.env);
assemble.option('media', config.media);
assemble.option('gtm', config.gtm);
assemble.option('character', config.character);
assemble.option('contentDir', content.root);

assemble.task('pages', function () {
    var baseContentDir = content.root + '/pages';
    assemble.src(baseContentDir + '/**/*.md')
        .pipe(typogr())
        .pipe(extname())
        .pipe(permalinks())
        .pipe(assemble.dest('.tmp'));
});

assemble.task('newsletters', function () {
    var baseContentDir = content.root + '/newsletters';
    assemble.src(baseContentDir + '/**/*.md', {layout: 'email'})
        .pipe(typogr())
        .pipe(inlineCss())
        .pipe(extname())
        .pipe(assemble.dest('.tmp'));
});

assemble.task('resources', function () {
        assemble.copy('resources/**/*', buildDir);

});

function bumpAndTag(importance) {
    // get all the files to bump version in
    return assemble.src(['./package.json'], {layout: null})
        // bump the version number in those files
        .pipe(bump({type: importance}))
        // save it back to filesystem
        .pipe(assemble.dest('./'))
        // commit the changed version number
        .pipe(git.commit('Bump site version'))

        // read only one file to get the version number
        .pipe(filter('package.json'))
        // **tag it in the repository**
        .pipe(tagVersion());
}

assemble.task('patch', function () { return bumpAndTag('patch'); });
assemble.task('feature', function () { return bumpAndTag('minor'); });
assemble.task('release', function () { return bumpAndTag('major'); });

assemble.task('clean', require('del').bind(null, ['.tmp', buildDir]));

assemble.task('jshint', function () {
    return assemble.src(
            [
                'assets/scripts/**/*.js',
                '*.js',
                'templates/helpers/**/*.js'
            ]
        )
        .pipe(reload({stream: true, once: true}))
        .pipe(gp.jshint())
        .pipe(gp.jshint.reporter('jshint-stylish'))
        .pipe(gp.if(!browserSync.active, gp.jshint.reporter('fail')));
});

assemble.task('serve', ['clean', 'pages', 'styles', 'fonts'], function () {
    browserSync({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['dist', '.tmp', './'],
            routes: {
                '/bower_components': 'bower_components'
            }
        }
    });

    // watch for changes
    assemble.watch([
        'content/**/*.md',
        'templates/**/*.{hbs,js}',
        'assets/scripts/**/*.js',
        'assets/images/**/*',
        '.tmp/fonts/**/*'
    ]).on('change', reload);

    assemble.watch('assets/styles/**/*.scss', ['styles']);
    assemble.watch(['content/**/*.md', 'templates/**/*.{hbs,js}'], ['pages']);
    assemble.watch('assets/fonts/**/*', ['fonts']);
});

assemble.task('assets', ['jshint']);
assemble.task('default', ['pages', 'assets', 'resources']);
