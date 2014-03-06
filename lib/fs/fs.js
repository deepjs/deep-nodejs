"use strict";
if(typeof define !== 'function')
	var define = require('amdefine')(module);


define(["require", "deepjs"],function (require, deep)
{
	var fs = require("fs");
	deep.store.node = deep.store.node || {};
	deep.store.node.fs = deep.store.node.fs || {};

	deep.store.node.fs.FS = deep.compose.Classes(deep.Store,
	function(protocol, baseURI, schema, options){
		this.baseURI = baseURI || this.baseURI || "";
		this.schema = schema || this.schema;
		if(options)
			deep.utils.up(options, this);
		this.watched = {};
		options = options || {};
		options.watch = (options.watch === false)?false:true;
		options.cache = (options.cache === false)?false:true;
		if(options.cache)
			deep.sheet(deep.store.CachedStoreSheet, this);
	},
	{
		cachePath:"node.fs.FS::",
		baseURI:"",
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
			deep.utils.decorateUpFrom(this, opt, ["baseURI", "watch"]);
			//console.log("node-fs/fs : get : ", path, cacheName, deep.mediaCache.cache[cacheName])
			var def = deep.Deferred(),
				self = this;

			path = (deep.context.rootPath || deep.globals.rootPath || "")+this.baseURI+path;
			fs.readFile(path, function(err, datas){
				if(err)
					return def.reject(err);
				deep.when(self.responseParser(datas))
				.done(function (datas) {
					def.resolve(datas);
				});
			});
			deep.store.node.fs.FS.checkWatch.call(this, this.watched, opt);
			return def.promise();
		},
		post:function (content, opt) {
			opt = opt || {};
			deep.utils.decorateUpFrom(this, opt, ["baseURI","watch"]);
			opt.id = opt.id || content.id;
			if(!opt.id)
				return deep.errors.Post("node.fs store need id on post", content);
			opt.id = (deep.context.rootPath || deep.globals.rootPath || "")+this.baseURI+opt.id;
			var def = deep.Deferred(),
				self = this;
			fs.stat(opt.id, function(err, stat){
				if(!err)
					return def.reject(deep.errors.Conflict("file already exists : please put in place of post. path : "+(opt.baseURI||"")+opt.id));
				deep.when(self.bodyParser(content))
				.done(function(parsed){
					fs.writeFile((opt.baseURI||"")+opt.id, parsed, function (err) {
						if (err)
							return def.reject(err);
						deep.store.node.fs.FS.checkWatch.call(self, self.watched, opt);
						def.resolve(content);
					});
				});
			});
			return def.promise();
		},
		put:function (content, opt) {
			opt = opt || {};
			deep.utils.decorateUpFrom(this, opt, ["baseURI","watch"]);

			opt.id = opt.id || content.id;
			if(!opt.id)
				return deep.errors.Post("node fs json store need id on put");
			//console.log("fs.put : ", content, opt);
			opt.id = (deep.context.rootPath || deep.globals.rootPath || "")+this.baseURI+opt.id;
			var def = deep.Deferred(),
				self = this;
			var schema = this.schema;
			if(opt.query)
			{
				fs.readFile(opt.id, function(err, datas){
					if(err)
						return def.reject(deep.errors.Put("file doesn't exists : please post in place of put. path : "+(opt.baseURI||"")+opt.id));
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
							fs.writeFile((opt.baseURI||"")+opt.id, parsed, function (err) {
								if (err)
									return def.reject(err);
								deep.store.node.fs.FS.checkWatch.call(self, self.watched, opt);
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
						return def.reject(deep.errors.Put("file doesn't exists : please post in place of put. path : "+(opt.baseURI||"")+opt.id));
					deep.when(self.bodyParser(content))
					.done(function(parsed){
						fs.writeFile((opt.baseURI||"")+opt.id, parsed, function (err) {
							if (err)
								return def.reject(err);
							deep.store.node.fs.FS.checkWatch.call(self, self.watched, opt);
							def.resolve(content);
						});
					});
				});
			}
			return def.promise();
		},
		del:function(id, opt){
			opt = opt || {};
			deep.utils.decorateUpFrom(this, opt, ["baseURI"]);
			var def = deep.Deferred(),
				self = this;
			opt.id = id;
			opt.id = (deep.context.rootPath || deep.globals.rootPath || "")+this.baseURI+opt.id;
			fs.stat((opt.baseURI||"")+opt.id, function(err, stat){
				if(err)
					return def.reject(deep.errors.Delete("file doesn't exists : couldn't delete. path : "+(opt.baseURI||"")+opt.id));
				fs.unlink(id, function (err) {
					if (err)
						return def.reject(err);
					def.resolve(true);
				});
			});
			deep.store.node.fs.FS.removeWatch(this.watched, (opt.baseURI||"")+opt.id);
			return def.promise();
		}
	});

	deep.store.node.fs.FS.checkWatch =function(watched, opt)
	{
		var self = this;
		try{
		if(opt.watch && !watched[(opt.baseURI||"")+opt.id])
			watched[(opt.baseURI||"")+opt.id] = fs.watch((opt.baseURI||"")+opt.id, function (event, filename) {
				switch(event)
				{
					case 'change' :
						fs.readFile((opt.baseURI||"")+opt.id, function(err, datas){
							var d = null;
							if(err)
								d = deep.when(deep.errors.Watch("Error while reloading file : "+(opt.baseURI||"")+opt.id));
							else
								d = deep.when(self.responseParser(datas));
							if(opt.cache !== false)
								deep.mediaCache.manage(d, opt.cacheName);
						});
						break;
					case 'rename' :
						deep.mediaCache.remove(opt.cacheName);
						break;
				}
			});
		}
		catch(e)
		{
			console.log("error while watching file : ", opt);
		}
	};

	deep.store.node.fs.FS.removeWatch = function(watched, path){
		if(watched[path])
			watched[path].close();
		delete watched[path];
	};
	
	return deep.store.node.fs.FS;

});