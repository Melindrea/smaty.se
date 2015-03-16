/*global -$ */
'use strict';
// generated on 2015-02-28 using generator-gulp-webapp 0.3.0
var gulp = require('gulp'),
    gp = require('gulp-load-plugins')(),
    sitemap = require('gulp-sitemap'),
    // sitemapHtml = require('./lib/sitemap'),
    rev = require('gulp-rev'),
    path = require('path'),
    // revReplace = require('gulp-rev-replace'),
    useref = require('gulp-useref'),
    filter = require('gulp-filter'),
    uglify = require('gulp-uglify'),
    csso = require('gulp-csso'),
    rename = require('gulp-rename'),
    revCollector = require('gulp-rev-collector'),
    // htmlmin = require('gulp-htmlmin'),
    robots = require('gulp-robots'),
    pkg = require('./package.json'),
    buildDir = pkg.config.buildDir;

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

gulp.task('fonts', function () {
    return gulp.src(require('main-bower-files')({
            filter: '**/*.{eot,svg,ttf,woff,woff2}'
        }).concat('assets/fonts/**/*'))
        .pipe(gulp.dest(buildDir + '/assets/fonts'));
});

gulp.task('html', function () {
    var userefAssets = useref.assets({searchPath: ['.tmp', 'assets', '.']}),
        jsFilter = filter('**/*.js'),
        cssFilter = filter('**/*.css'),
        htmlFilter = filter('**/*.html');


    return gulp.src('.tmp/**/*.html')
        .pipe(robots({ out: buildDir + '/robots.txt' }))
        .pipe(userefAssets)      // Concatenate with gulp-useref
            .pipe(jsFilter)
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
                siteUrl: 'http://smaty.se'
        })) // Returns sitemap.xml
        .pipe(gulp.dest(buildDir))
        .pipe(htmlFilter.restore());
});

gulp.task('cache-busting', ['html'], function () {
    // var manifest;

    gulp.src([buildDir + '/assets/{fonts,styles,scripts,images}/**/*'], {base: path.join(process.cwd(), 'dist/assets')})
        .pipe(rev())
        .pipe(gulp.dest(buildDir + '/assets'))
        .pipe(rev.manifest({
            merge: true // merge with the existing manifest (if one exists)
        }))
        .pipe(gulp.dest(buildDir + '/assets'));

    gulp.src([buildDir + '/assets/*.json', buildDir + '/**/*.html'])
        .pipe(revCollector())
        .pipe(gulp.dest(buildDir));

    // manifest = gulp.src(buildDir + '/assets/rev-manifest.json');
    // gulp.src([buildDir + '/**/*.html', buildDir + '/assets/styles/*.css'])
    //     .pipe(revReplace({manifest: manifest}))
    //     .pipe(gulp.dest(buildDir));

});

gulp.task('build', ['html', 'images', 'fonts'], function () {
  return gulp.src(buildDir + '/**/*').pipe(gp.size({title: 'build', gzip: true}));
});
