module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
		src: {
			bus: [
				'app/js/bus/transport/shindig/*.js',
				'app/js/bus/transport/**/*.js'
			],
			test: [
				'app/test/**/*'
			],
			all: [
				'<%= src.bus %>'
			]
		},
		output: {
			busJs: 'app/js/<%= pkg.name %>-owf7-listener',
		},
		concat: {
      bus: {
        src: '<%= src.bus %>',
        dest: '<%= output.busJs %>.js'
      }
		},
    uglify: {
      bus: {
        src: '<%= concat.bus.dest %>',
        dest: '<%= output.busJs %>.min.js'
      }
    },
		jsdoc : {
        dist : {
            src: ['<%= src.bus %>'],
            options: {
                destination: 'doc'
            }
        }
    },
    watch: {
			jsdoc: {
	      files: ['Gruntfile.js','<%= jsdoc.dist.src %>'],
				tasks: ['jsdoc']
			},
			test: {
				files: ['Gruntfile.js','<%= src.all %>'],
				tasks: ['concat']
			}
    },
		connect: {
			app: {        
				options:{ port: 13100,base: "app", debug: true}
			},
			doc: {
				options: { port: 13101, base: "doc" }
			},
			tests: {        
				options:{ port: 14100, base: ["app","test/unit"]	}
			},
			owf7Widget: {        
				options:{	port: 14101, base: ["app","demo/owf7Widgets"]}
			}
		}

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	
  // Default task(s).
  grunt.registerTask('default', ['concat','uglify','jsdoc']);
  grunt.registerTask('test', ['concat','uglify','connect','watch:test']);

};