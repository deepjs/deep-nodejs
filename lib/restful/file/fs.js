"use strict";
	var deep = require("deepjs"), 
		cache = require("deepjs/lib/cache"), 
		Store = require("deep-restful/lib/store"), 
		cacheSheet = require("deep-restful/lib/cache-sheet");
		
var fs = require("fs");

deep.nodejs = deep.nodejs || {};
deep.nodejs.files = deep.nodejs.files || {};


deep.nodejs.files.FS = deep.Classes(deep.Store,
function(protocol, basePath, schema, options){
	this.basePath = basePath || this.basePath ||  deep.globals.rootPath || '';
	if(schema && this.schema)
        deep.aup(schema, this.schema);
    else
        this.schema = schema || this.schema;
	if(options)
		deep.aup(options, this);
	this.watched = {};
	options = options || {};
	options.watch = (options.watch === false)?false:true;
	options.cache = (options.cache === false)?false:true;
	if(options.cache)
		deep.sheet(this, cacheSheet);
},
{
	cachePath:"node.fs.FS::",
	basePath:"",
	watch:false,
	cache:false,
	watched:null, // private
	bodyParser:function(body){
		if(typeof body !== 'string')
			body = JSON.stringify(body);
		return body;
	},
	responseParser:function(datas){
		if(datas instanceof Buffer)
			datas = datas.toString("utf8");
		return datas;
	},
	get : function (path, opt) {
		//console.log("node-fs/fs : get : options : ", opt);
		opt = opt || {};
		deep.utils.decorateUpFrom(this, opt, ["basePath", "watch"]);
		//console.log("node-fs/fs : get : ", path, cacheName, cache.get(cacheName))
		var def = new deep.Promise(),
			self = this;

		path = (deep.Promise.context.rootPath || deep.globals.rootPath || "")+this.basePath+path;
		fs.readFile(path, function(err, datas){
			if(err)
				return def.reject(err);
			deep.when(self.responseParser(datas))
			.done(function (datas) {
				def.resolve(datas);
			});
		});
		deep.nodejs.files.FS.checkWatch.call(this, this.watched, opt);
		return def;
	},
	post:function (content, opt) {
		opt = opt || {};
		deep.utils.decorateUpFrom(this, opt, ["basePath","watch"]);
		opt.id = opt.id || content.id;
		if(!opt.id)
			return deep.errors.Post("node.fs store need id on post", content);
		opt.id = (deep.Promise.context.rootPath || deep.globals.rootPath || "")+this.basePath+opt.id;
		var def = new deep.Promise(),
			self = this;
		fs.stat(opt.id, function(err, stat){
			if(!err)
				return def.reject(deep.errors.Conflict("file already exists : please put in place of post. path : "+(opt.basePath||"")+opt.id));
			deep.when(self.bodyParser(content))
			.done(function(parsed){
				fs.writeFile((opt.basePath||"")+opt.id, parsed, function (err) {
					if (err)
						return def.reject(err);
					deep.nodejs.files.FS.checkWatch.call(self, self.watched, opt);
					def.resolve(content);
				});
			});
		});
		return def;
	},
	put:function (content, opt) {
		opt = opt || {};
		deep.utils.decorateUpFrom(this, opt, ["basePath","watch"]);

		opt.id = opt.id || content.id;
		if(!opt.id)
			return deep.errors.Post("node fs json store need id on put");
		//console.log("fs.put : ", content, opt);
		opt.id = (deep.Promise.context.rootPath || deep.globals.rootPath || "")+this.basePath+opt.id;
		var def = new deep.Promise(),
			self = this;
		var schema = this.schema;
		if(opt.query)
		{
			fs.readFile(opt.id, function(err, datas){
				if(err)
					return def.reject(deep.errors.Put("file doesn't exists : please post in place of put. path : "+(opt.basePath||"")+opt.id));
				deep.when(self.responseParser(datas))
				.done(function (datas) {
					deep.utils.replace(datas, opt.query, content);
					if(schema)
					{
						if(schema._deep_ocm_)
							schema = schema("put");
						var report = deep.validate(datas, schema);
						if(!report.valid)
							return def.reject(deep.errors.PreconditionFail(report));
					}
					deep.when(self.bodyParser(datas))
					.done(function(parsed){
						fs.writeFile((opt.basePath||"")+opt.id, parsed, function (err) {
							if (err)
								return def.reject(err);
							deep.nodejs.files.FS.checkWatch.call(self, self.watched, opt);
							def.resolve(datas);
						});
					});
				});
			});
        }
        else
        {
			if(schema)
			{
				if(schema._deep_ocm_)
					schema = schema("put");
				var report = deep.validate(content, schema);
				if(!report.valid)
					return def.reject(deep.errors.PreconditionFail(report));
			}
			fs.stat(opt.id, function(err, stat){
				if(err)
					return def.reject(deep.errors.Put("file doesn't exists : please post in place of put. path : "+(opt.basePath||"")+opt.id));
				deep.when(self.bodyParser(content))
				.done(function(parsed){
					fs.writeFile((opt.basePath||"")+opt.id, parsed, function (err) {
						if (err)
							return def.reject(err);
						deep.nodejs.files.FS.checkWatch.call(self, self.watched, opt);
						def.resolve(content);
					});
				});
			});
		}
		return def;
	},
	del:function(id, opt){
		opt = opt || {};
		deep.utils.decorateUpFrom(this, opt, ["basePath"]);
		var def = new deep.Promise(),
			self = this;
		opt.id = id;
		opt.id = (deep.Promise.context.rootPath || deep.globals.rootPath || "")+this.basePath+opt.id;
		fs.stat((opt.basePath||"")+opt.id, function(err, stat){
			if(err)
				return def.reject(deep.errors.Delete("file doesn't exists : couldn't delete. path : "+(opt.basePath||"")+opt.id));
			fs.unlink(id, function (err) {
				if (err)
					return def.reject(err);
				def.resolve(true);
			});
		});
		deep.nodejs.files.FS.removeWatch(this.watched, (opt.basePath||"")+opt.id);
		return def;
	}
});

deep.nodejs.files.FS.checkWatch =function(watched, opt)
{
	var self = this;
	try{
	if(opt.watch && !watched[(opt.basePath||"")+opt.id])
		watched[(opt.basePath||"")+opt.id] = fs.watch((opt.basePath||"")+opt.id, function (event, filename) {
			cache.remove(opt.cachePath, opt.cacheName);
		});
	}
	catch(e)
	{
		console.log("error while watching file : ", opt);
	}
};

deep.nodejs.files.FS.removeWatch = function(watched, path){
	if(watched[path])
		watched[path].close();
	delete watched[path];
};

module.exports = deep.nodejs.files.FS;




