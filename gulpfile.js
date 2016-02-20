var gulp = require('gulp');
var postcss = require('gulp-postcss');
var cssImport = require('postcss-import');
var cssnext = require('cssnext');
var browserSync = require('browser-sync').create();

gulp.task('styles', function() {
  var processors = [
  	cssImport,
  	cssnext({
  		'browsers': ['last 2 versions', 'ie 9'],
      'customProperties': true,
      'customSelectors': true,
      'compress': true
  	})
  ];

  return gulp.src('./css/main.css')
    .pipe(postcss(processors))
    .pipe(gulp.dest('./dest/css'))
    .pipe(browserSync.stream());

});

gulp.task('watch', function() {

  browserSync.init({
    server: "./"
  });

	gulp.watch('css/*.css', ['styles']).on('change', browserSync.reload);
});

gulp.task('default', ['styles', 'watch']);