module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',

    // Added this so grunt watch would auto-compile coffeescript. Still doesn't do it.
    preprocessors: {
      'greenbus-views-tpls-*-SNAPSHOT.js': 'coverage',
      'src/**/*.coffee': 'coffee'
    },
    coffeePreprocessor: {
      // options passed to the coffee compiler
      options: {
        bare: true,
        sourceMap: true
      },
      expand: true,
      flatten: false,
      cwd: 'src',
      src: ['**/*.coffee'],
      dest: 'target',
      ext: '.js'

      //// transforming the filenames
      //transformPath: function(path) {
      //  return path.replace(/\.coffee$/, '.js');
      //}
    },

    frameworks: [
      'jasmine',
      'jasmine-matchers'
    ],

    // list of files / patterns to load in the browser
    files: [
      'bower_components/jquery/dist/jquery.min.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-cookies/angular-cookies.js',
      'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
      'bower_components/angular-ui-utils/ui-utils.min.js',
      'bower_components/angular-ui-router/release/angular-ui-router.min.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/d3/d3.js',
      'misc/test-lib/helpers.js',
      'misc/test-lib/d3-traits.js',

      // Use the actual source files for testing.
      'src/**/*.js',
      'target/**/*.js',
      'template/**/*.js'
    ],


    // list of files to exclude
    exclude: [
      'src/**/docs/*'
    ],

    plugins: [
      'karma-jasmine',
      'karma-jasmine-matchers',
      'karma-coverage',
      //'karma-phantomjs-launcher',
      //'karma-firefox-launcher',
      'karma-chrome-launcher',
      'karma-coffee-preprocessor'
    ],

    coverageReporter: {
      reporters:[
        {type: 'html', dir:'coverage/'},
        {type: 'teamcity'},
        {type: 'text'}
      ]
    },

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit'
    reporters: ['dots', 'coverage', 'progress'],

    // web server port
    port: 9876,

    // cli runner port
    runnerPort: 9100,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: 'LOG_INFO',

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,


  // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['Chrome']
  })
}

