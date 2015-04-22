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
            testLib: [
                'test/karma/**/*.js',
                'test/lib/'
            ],
            testSrc: [
                'test/**/*'
            ],
            all: [
                '<%= src.adapter %>',
                '<%= src.testSrc %>'
            ]
        },
        output: {
            adapterJs: 'dist/js/<%= pkg.name %>.js',
            adapterJsMin: 'dist/js/<%= pkg.name %>.min.js',
            testUnit: [
                'bower_components/ozp-iwc/dist/js/ozpIwc-bus.js',
                'test/karma/unitGlobals.js',
                '<%= output.adapterJs %>',
                'test/specs/unit/**/*.js'
            ]
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
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish'),
                force: true
            },
            all: [
                'Gruntfile.js',
                '<%= src.all %>'
            ]
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
                files: ['Gruntfile.js', 'app/**/*', '<%= src.adapter %>'],
                tasks: ['build','karma:unit'],
                options: {
                    interrupt: true,
                    spawn: false
                }
                
            },
            test: {
                files: ['Gruntfile.js', 'dist/**/*', '<%= src.testSrc %>'],
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
                options: {port: 16001, base: ['dist','test','bower_components/ozp-iwc/dist','node_modules/jasmine-core/lib']}
            }
        },
        bump: {
            options: {
                files: [
                    'package.json',
                    'bower.json'
                ],
                commit: false,
                createTag: false,
                push: false
            }
        },
        shell: {
            buildVersionFile: {
                command: [
                    'echo "Version: <%= pkg.version %>" > dist/version.txt',
                    'echo "Git hash: " >> dist/version.txt',
                    'git rev-parse HEAD >> dist/version.txt',
                    'echo Date: >> dist/version.txt',
                    'git rev-parse HEAD | xargs git show -s --format=%ci >> dist/version.txt'
                ].join('&&')
            },
            releaseGit: {
                command: [
                    'git add bower.json package.json',
                    'git commit -m "chore(release): <%= pkg.version %>"',
                    'git push origin master',
                    'git checkout --detach',
                    'grunt build',
                    'git add -f dist',
                    'git commit -m "chore(release): <%= pkg.version %>"',
                    'git tag -a "<%= pkg.version %>" -m "chore(release): <%= pkg.version %>"',
                    'git push origin <% pkg.version %> --tags',
                    'git checkout master'
                ].join('&&')
            },
            tarDate: {
                command: [
                    './packageRelease.sh iwc-prod dist'
                ].join('&&')
            },
            tarVersion: {
                command: [
                    './packageRelease.sh iwc-prod dist <%= pkg.version %>'
                ].join('&&')
            }
        },
        karma: {
            options:{
                configFile: 'karma.conf.js',
                browsers: ['PhantomJS']
            },
            unit: {
                files: {src: ['<%= output.testUnit %>']}
            },
            unitCI: {
                options: {
                    configFile: 'karma.conf.js',
                    browsers: ['Firefox']
                },
                files: { src: ['<%= output.testUnit %>']}
            }
        }

    });

    // load all grunt tasks matching the `grunt-*` pattern
    require('load-grunt-tasks')(grunt);

    grunt.registerTask('readpkg', 'Read in the package.json file', function() {
        grunt.config.set('pkg', grunt.file.readJSON('./package.json'));
    });

    // Default task(s).
    grunt.registerTask('build', ['jshint', 'concat_sourcemap', 'uglify', 'copy:dist']);
    grunt.registerTask('test', ['build','karma:unit','connect','watch']);
    grunt.registerTask('releasePatch', ['bump:patch','readpkg','shell:releaseGit']);
    grunt.registerTask('releaseMinor', ['bump:minor','readpkg', 'shell:releaseGit']);
    grunt.registerTask('releaseMajor', ['bump:major','readpkg', 'shell:releaseGit']);
    grunt.registerTask('travis', ['build','connect','karma:unitCI']);
    grunt.registerTask('default', ['test']);
};