var gulp = require("gulp")
	tap = require("gulp-tap"),
	_ = require("underscore"),
	Q = require("q"),
	through = require("through"),
	gutil = require("gulp-util"),
	request = require("request"),
	progressUtil = require("request-progress"),
	col = gutil.colors;

gulp.task("convert", function() {

	return convertBowerToJSON("http://adapt-bower-repository.herokuapp.com/packages/", "master")
		.then(function(registry) {
			console.log(registry);
		})
		.done();
});

var types = [ 'component', "extension", "menu", "theme" ];

function convertBowerToJSON(packagesURL, defaultBranch) {
	defaultBranch = defaultBranch || "master";

	return fetchAvailablePlugins()
		.then(fetchPluginTypes)
		.then(function(plugins){
			
			var registry = {};

			for (var i = 0, l = plugins.length; i<l; i++) {
				var plugin = plugins[i];

				if (!plugin.git.bower) continue;
				
				var type = bowerJSONToPluginType(plugin.git.bower);
				
				if (type === undefined) continue;

				type = type+"s";

				if (!registry[type]) registry[type] = [];

				registry[type].push({
					name: plugin.name,
					repo: plugin.git.user,
					branch: defaultBranch
				})

			}

			return registry;

		});

}

function bowerJSONToPluginType(bowerJSON) {
	for (var i = 0, l = types.length; i < l; i++) {
		var type = types[i];
		if (bowerJSON[type]) return type;
	}
	return undefined;
}

function fetchAvailablePlugins() {
	var defered = Q.defer();
	var availablePlugins;

	download("http://adapt-bower-repository.herokuapp.com/packages/")
		.pipe(tap(function(file) {
			availablePlugins = JSON.parse(file.contents.toString());
		}))
		.on("end", function() {
			defered.resolve(availablePlugins);
		});

	return defered.promise;
}


function fetchPluginTypes(plugins) {
	var availablePlugins;

	var promises = [];

	for (var i = 0, l = plugins.length; i < l; i++) {
		var plugin = plugins[i];
		plugin.git = getPluginGIT(plugin.url);
		promises.push(getPluginBowerJSON(plugin));
	}

	var defered = Q.defer();

	var que = Q.all(promises).then(function() {
		return plugins;
	});

	return que;
}

function getPluginBowerJSON(plugin) {
	return fetchPluginBowerJSON(plugin.git);
}


function fetchPluginBowerJSON(git) {
	var defered = Q.defer();
	download("https://raw.githubusercontent.com/"+git.user+"/"+git.repo+"/master/bower.json")
		.pipe(tap(function(file) {
			try {
				git.bower = JSON.parse(file.contents.toString());
			} catch(e) {
				console.log("bower.json error at:");
				console.log({
					domain: git.domain,
					user: git.user,
					repo: git.repo
				});
				delete git.bower;
			}
		}))
		.on("end", function() {
			defered.resolve(git);
		});

	return defered.promise;
}

function getPluginGIT(gitURL) {
	var matchBy = /(\/[^/]+)/g;
	var matches = gitURL.match(matchBy);

	var domain = matches[0].substr(1);
	var user = matches[1].substr(1);
	var repo = matches[2].substr(1);

	if (repo.indexOf(".git") > -1) {
		repo = repo.substr(0, repo.length-4);
	}

	var ret = {
		domain: domain,
		user: user,
		repo: repo,
		matches: matches
	};

	return ret;

}

function download(urls, begin, progress, complete){
	var stream = through(function(file,enc,cb){
		this.push(file);
		cb();
	});


	var files = typeof urls === 'string' ? [urls] : urls;
	var downloadCount = 0;


	function downloader(url, begin, progress, complete){
		var beginner = function(){
			if(firstLog){
				if (begin) begin() 
			}
		};

		progress = progress || function(state){};

		complete = complete || function(state){};

		var firstLog = true;
		
		progressUtil(
			request({url:url,encoding:null},downloadHandler),
			{throttle:1000,delay:1000}
		)
		.on('progress', progress)
		.on('data', beginner)

		function downloadHandler(err, res, body){
			var fileName = url.split('/').pop();
			var file = new gutil.File( {path:fileName, contents: new Buffer(body)} );
			stream.queue(file);

			downloadCount++;
			if(downloadCount != files.length){
				downloader(files[downloadCount], begin, progress, complete)
			}else{
				complete();
				stream.emit('end')
			}
		}
	}
	downloader(files[0], begin, progress, complete)

	return stream;
}

module.exports = {
	download: download,
	convertBowerToJSON: convertBowerToJSON
};



	