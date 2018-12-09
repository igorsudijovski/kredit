module.exports = function (grunt) {

  grunt.initConfig({
    connect: {
      server: {
        options: {
          livereload: true,
          port: 9000,
          hostname: 'localhost',
          base: '../'
        }
      }
    },
    watch: {
      html: {
        files: ['../*.html'],
        options: {
          livereload: true
        }
      },
      css: {
        files: ['../css/*.css'],
        options: {
          livereload: true
        }
      },
      js: {
        files: ['../js/*.js'],
        options: {
          debounceDelay: 1000,
          livereload: true
        }
      },
      data: {
        files: ['../data/*.json'],
        options: {
          debounceDelay: 1000,
          livereload: true
        }
      }
    },
    open: {
      dev: {
        path: 'http://localhost:9000/index.html',
        app: 'Chrome'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-open');

  grunt.registerTask('server', ['connect:server', 'open:dev', 'watch']);

};