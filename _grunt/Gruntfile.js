module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
          options: {
            separator: ';'
          },
          dist: {
            src: ['src/**/*.js'],
            dest: 'dist/<%= pkg.name %>.js'
          }
        },
        less: {
            development: {
                files: [
                    {
                        src: "../public/css/fextm.less",
                        dest: "../public/css/fextm.css"
                    }
                ]
            }
        },
        watch: {
            files: ['../public/css/*.less'],
            tasks: ['less']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['watch']);

};