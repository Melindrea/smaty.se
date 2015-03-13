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
    pleeease = require('gulp-pleeease'),
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
assemble.partials(system.root + '/' + system.partials + '/**.hbs');

assemble.option(config.site.assemble.options);
assemble.option('site', config.site.site);
assemble.option('navigation', config.site.navigation);
assemble.option('env', config.env);
assemble.option('media', config.media);
assemble.option('gtm', config.gtm);

assemble.task('pages', function () {
    var baseContentDir = content.root + '/pages';
    assemble.src(baseContentDir + '/**/*.md')
        .pipe(typogr())
        .pipe(extname())
        .pipe(permalinks())
        .pipe(assemble.dest('.tmp'));
});

assemble.task('styles', function () {
    return assemble.src('assets/styles/main.scss', {layout: null})
        .pipe(gp.sourcemaps.init())
        .pipe(gp.sass({
        outputStyle: 'nested', // libsass doesn't support expanded yet
        precision: 10,
        includePaths: ['.', './bower_components'],
            onError: console.error.bind(console, 'Sass error:')
        }))
        .pipe(pleeease({browsers: ['last 1 version']}))
        .pipe(gp.sourcemaps.write())
        .pipe(assemble.dest('.tmp/assets/styles'))
        .pipe(reload({stream: true}));
});

assemble.task('images', function () {
    return assemble.src('assets/images/**/*')
        .pipe(gp.cache(gp.imagemin({
            progressive: true,
            interlaced: true,
            // don't remove IDs from SVGs, they are often used
            // as hooks for embedding and styling
            svgoPlugins: [{cleanupIDs: false}]
        })))
        .pipe(assemble.dest(buildDir + '/assets/images'));
});

assemble.task('resources', function () {
        assemble.src('resources/**/*')
        .pipe(assemble.dest(buildDir));

});

assemble.task('fonts', function () {
    return assemble.src(require('main-bower-files')({
            filter: '**/*.{eot,svg,ttf,woff,woff2}'
        }).concat('assets/fonts/**/*'))
        .pipe(assemble.dest(buildDir + '/assets/fonts'));
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

assemble.task('assets', ['jshint', 'styles', 'images', 'fonts']);
assemble.task('default', ['pages', 'assets', 'resources']);
