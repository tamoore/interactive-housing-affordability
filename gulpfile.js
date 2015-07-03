var gulp = require('gulp'),
	shell = require('gulp-shell'),
	watch = require('gulp-watch'),
	sass = require('gulp-ruby-sass'),
	postcss = require('gulp-postcss'),
	$ = require('gulp-load-plugins')(),
	browserSync = require('browser-sync'),
	reload = browserSync.reload,
	htmlreplace = require('gulp-html-replace');

var spawn = require('child_process').spawn;
var gutil = require('gulp-util');

gulp.task('styles', function() {
	return sass('src/scss/main.scss')
		.on('error', function (err) {
			console.error('Error', err.message);
		})
		.pipe(gulp.dest('src/css'))
		.pipe(reload({stream: true}));
});

gulp.task('deploy', ['build'], function() {
	return gulp.src(['./'])
		.on('end', shell.task([
			'aws s3 sync ./build s3://gdn-cdn/embed/aus/2015/jun/housing-affordability --profile interactive --acl public-read --cache-control="max-age=0, no-cache"'
		]));
});

gulp.task('build', ['styles'], function() {
	gulp.src('./')
		.pipe(shell([
			'jspm bundle-sfx --minify src/lib/index',
			'cp -f ./build.js ./build/',
			'cp -rf ./src/css ./build && cp -rf ./src/images ./build/images',
			'cp -f ./src/boot.js ./build'
		]));

	gulp.src('./src/index.html')
		.pipe(htmlreplace({
			src: 'src/index.html',
			'js': {
				src: ['build.js']
			},
			'css': {
				src: ['css/main.css']
			}
		}))
		.pipe(gulp.dest('build/'));
});

gulp.task('serve', ['styles'], function () {
	browserSync({
		notify: false,
		port: 9000,
		ui: {
			port: 9001
		},
		server: {
			baseDir: ['src'],
			routes: {
				'/jspm_packages': 'jspm_packages',
				'/config.js': 'config.js'
			}
		}
	});

	// watch for changes
	gulp.watch([
		'src/**/*.txt',
		'src/*.html',
		'src/**/*.html',
		'src/lib/**/*.js',
		'src/lib/**/*.jsx',
		'src/images/**/*',
		'.tmp/scripts/**/*.js',
	]).on('change', reload);
	gulp.watch('src/scss/**/*.scss', ['styles']);
});

