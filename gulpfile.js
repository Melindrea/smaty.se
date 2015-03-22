/*global -$ */
'use strict';
// generated on 2015-02-28 using generator-gulp-webapp 0.3.0
var gulp = require('gulp'),
    gp = require('gulp-load-plugins')(),
    sitemap = require('gulp-sitemap'),
    useref = require('gulp-useref'),
    revall = require('gulp-rev-all'),
    pleeease = require('gulp-pleeease'),
    filter = require('gulp-filter'),
    uglify = require('gulp-uglify'),
    jsValidate = require('gulp-jsvalidate'),
    csso = require('gulp-csso'),
    rename = require('gulp-rename'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    // htmlmin = require('gulp-htmlmin'),
    robots = require('gulp-robots'),
    pkg = require('./package.json'),
    buildDir = pkg.config.buildDir,
    deployDir = pkg.config.deployDir;

gulp.task('images', function () {
    return gulp.src('assets/images/**/*')
        .pipe(gp.cache(gp.imagemin({
            progressive: true,
            interlaced: true,
            // don't remove IDs from SVGs, they are often used
            // as hooks for embedding and styling
            svgoPlugins: [{cleanupIDs: false}]
        })))
        .pipe(gulp.dest(buildDir + '/assets/images'));
});

gulp.task('styles', function () {
    return gulp.src('assets/styles/main.scss', {layout: null})
        .pipe(gp.sourcemaps.init())
        .pipe(gp.sass({
            outputStyle: 'nested', // libsass doesn't support expanded yet
            precision: 10,
            includePaths: ['.', './bower_components'],
                onError: console.error.bind(console, 'Sass error:')
            })
        )
        .pipe(pleeease({browsers: ['last 1 version']}))
        .pipe(gp.sourcemaps.write())
        .pipe(gulp.dest('.tmp/assets/styles'))
        .pipe(reload({stream: true}));
});


gulp.task('fonts', function () {
    return gulp.src(require('main-bower-files')({
            filter: '**/*.{eot,svg,ttf,woff,woff2}'
        }).concat('assets/fonts/**/*'))
        .pipe(gulp.dest(buildDir + '/assets/fonts'));
});

gulp.task('html', ['fonts', 'styles', 'images'], function () {
    var userefAssets = useref.assets({searchPath: ['.tmp', 'assets', '.']}),
        jsFilter = filter('**/*.js'),
        cssFilter = filter('**/*.css'),
        htmlFilter = filter('**/*.html');


    return gulp.src('.tmp/**/*.html')
        .pipe(robots({ out: buildDir + '/robots.txt' }))
        .pipe(userefAssets)      // Concatenate with gulp-useref
            .pipe(jsFilter)
                .pipe(jsValidate())
                .pipe(uglify())             // Minify any javascript sources
            .pipe(jsFilter.restore())
            .pipe(cssFilter)
                .pipe(csso())               // Minify any CSS sources
            .pipe(cssFilter.restore())
        .pipe(userefAssets.restore())
        .pipe(useref())
        // .pipe(htmlmin({
        //     removeComments: true,
        //     collapseWhiteSpace: true,
        //     collapseBooleanAttributes: true,
        //     removeRedundantAttributes: true,
        //     removeScriptTypeAttributes: true,
        //     removeStyleLinkTypeAttributes: true,
        //     maxLineLength: 80
        // }))
        .pipe(rename(function (path) {
            if (path.extname === '.html' && path.basename !== 'index') {
                path.basename = 'index';
            }
        }))
        .pipe(gulp.dest(buildDir))
        .pipe(htmlFilter)
        .pipe(sitemap({
                siteUrl: pkg.homepage
        })) // Returns sitemap.xml
        .pipe(gulp.dest(buildDir))
        .pipe(htmlFilter.restore());
});

gulp.task('cache-busting', function () {
    gulp.src(buildDir + '/**')
        .pipe(revall({ ignore: [/^\/favicon.ico$/g, '.html', '.xml', '.txt'] }))
        .pipe(gulp.dest(deployDir));
});

gulp.task('build', ['html'], function () {
  return gulp.src(buildDir + '/**/*').pipe(gp.size({title: 'build', gzip: true}));
});
