module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        src: {
            adapter: [
                'app/js/shindig/util.js',
                'app/js/shindig/json.js',
                'app/js/shindig/rpc.js',
                'app/js/shindig/overrides.js',
                'app/js/adapter/*.js',
                'app/js/main.js'
            ],
            test: [
                'test/**/*'
            ],
            all: [
                '<%= src.adapter %>'
            ]
        },
        output: {
            adapterJs: 'dist/js/<%= pkg.name %>.js',
            adapterJsMin: 'dist/js/<%= pkg.name %>.min.js'
        },
        concat_sourcemap: {
            options: {
                sourcesContent: true
            },
            adapter: {
                src: '<%= src.adapter %>',
                dest: '<%= output.adapterJs %>'
            }
        },
        uglify: {
            options: {
                sourceMap:true,
                sourceMapIncludeSources: true,
                sourceMapIn: function(m) { return m+".map";}
            },
            adapter: {
                src: '<%= concat_sourcemap.adapter.dest %>',
                dest: '<%= output.adapterJsMin %>'
            }
        },
        copy: {
            dist: {
                files: [
                    {
                        src: ['*.html'],
                        dest: './dist/',
                        cwd: 'app',
                        expand: true,
                        nonull:true
                    }
                ]
            }
        },      
        clean: {
          dist: ['./dist/']
        },
        jsdoc: {
            dist: {
                src: ['<%= src.bus %>'],
                options: {
                    destination: 'doc'
                }
            }
        },
        watch: {
            concatFiles: {
                files: ['Gruntfile.js', 'app/**/*', '<%= src.all %>'],
                tasks: ['concat_sourcemap', 'copy:dist'],
                options: {
                    interrupt: true,
                    spawn: false
                }
                
            },
            test: {
                files: ['Gruntfile.js', 'dist/**/*', '<%= src.test %>'],
                options: {
                    livereload: true,
                    spawn: false
                }
            }
        },
        connect: {
            bus: {
                options: {port: 16000, base: [
                    {
                        "path":"test-api-data",
                        options: {
                            directory: false,
                            index: "index.json"
                        }
                    },
                    'dist',
                    'bower_components/ozp-iwc/dist'
                    
                ]}
            },
            tests: {
                options: {port: 16001, base: ['dist','test','bower_components/ozp-iwc/dist']}
            }
        }

    });

    // load all grunt tasks matching the `grunt-*` pattern
    require('load-grunt-tasks')(grunt);

    // Default task(s).
    grunt.registerTask('build', ['concat_sourcemap', 'uglify', 'copy:dist']);
    grunt.registerTask('test', ['build','connect','watch']);
    grunt.registerTask('default', ['test']);
};