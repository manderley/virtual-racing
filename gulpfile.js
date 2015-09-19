var gulp = require('gulp');
var postcss = require('gulp-postcss');
var cssImport = require('postcss-import');
var cssnext = require('cssnext');

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
    .pipe(gulp.dest('./dest'));

});

gulp.task('watch', function() {
	gulp.watch('css/*.css', ['styles']);
});

gulp.task('default', ['styles', 'watch']);