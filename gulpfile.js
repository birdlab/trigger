var gulp = require('gulp');
var jade = require('gulp-jade');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var order = require('gulp-order');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var livereload = require('gulp-livereload');

var sources = {
  jade: "src/www/source/jade/*.jade",
  sass: "src/www/source/sass/*.scss",
  scripts: "src/www/source/js/*.js"
};

// Define destinations object
var destinations = {
  html: "src/www/source/",
  css: "src/www/source/css",
  js: "src/www/source/js"
};

// Compile and copy Jade
gulp.task("jade", function(event) {
  return gulp.src(sources.jade)
  .pipe(jade({pretty: true}))
  .pipe(gulp.dest(destinations.html))
});

// Compile and copy sass
gulp.task("sass", function(event) {
  return gulp.src(sources.sass)
  .pipe(sass())
  .pipe(concat('sass.css'))
  .pipe(minifyCSS({keepBreaks:false}))
  .pipe(gulp.dest(destinations.css));
});

// Minify and copy all JavaScript
gulp.task('scripts', function() {
  gulp.src(sources.scripts)
    .pipe(uglify())
    .pipe(gulp.dest(sources.scripts));
});

// Server
gulp.task('server', function () {
  var express = require('express');
  var app = express();
  app.use(require('connect-livereload')());
  app.use(express.static(__dirname+'/src/www/source'));
  app.listen(4000, '0.0.0.0');
});

// Watch sources for change, executa tasks
gulp.task('watch', function() {
  livereload.listen();
  gulp.watch(sources.jade, ["jade", "refresh"]);
  gulp.watch(sources.sass, ["sass", "refresh"]);
  gulp.watch(sources.scripts, ["scripts", "refresh"]);
});

// Refresh task. Depends on Jade task completion
gulp.task("refresh", ["jade"], function(){
  livereload.changed();
  console.log('LiveReload is triggered');
});

// Define default task
gulp.task("default", ["jade", "sass", "scripts", "server", "watch"]);
