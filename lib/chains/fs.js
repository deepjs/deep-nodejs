/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */
var deep = require("deepjs");
require("../errors");
var fs = require('fs');
var pathUtil = require("path");
var normalize = function(path){
	if(path && path[0] !== '/')
		path = pathUtil.normalize(deep.context.cwd+"/"+path);
	return path || deep.context.cwd;
};
/*
canExecute():

checkPermission (<path>, 1, cb);
canRead():

checkPermission (<path>, 4, cb);
canWrite():

checkPermission (<path>, 2, cb);
*/
var checkPermission = function (path, mask){
	var def = deep.Deferred();
	path = this.normalize(path);
    fs.stat (path, function (error, stats){
        if (error)
            def.reject(error);
        else
            def.resolve(!!(mask & parseInt ((stats.mode & parseInt ("777", 8)).toString (8)[0])));
    });
    return def.promise();
};

deep.Promise.API.fs = function(cwd) {
    var self = this;
    if(typeof cwd === 'string')
    	cwd = { cwd:cwd };
    var handler = new FSChain(this._state, cwd);
    self._enqueue(handler);
    return handler;
};

deep.fs = function(cwd){
	if(typeof cwd === 'string')
    	cwd = { cwd:cwd };
	return new FSChain({}, cwd)._start();
};

var constructor = function (state, options) {
	options = options || {};
	this._identity = FSChain;
	this.cd(options.cwd || ".");
};

var proto = {
	isWritable:function(path){
		var self = this;
		path = path || '';
		var func = function(s,e){
			path = normalize(path);
			return checkPermission.call(self, path, 2)
			.done(function(sc){
				if(!sc)
					return deep.errors.FS(path+ " is not Writable.");
				return s || sc;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	isReadable:function(path){
		var self = this;
		path = path || '';
		var func = function(s,e){
			path = normalize(path);
			return checkPermission.call(self, path, 4)
			.done(function(sc){
				if(!sc)
					return deep.errors.FS(path+ " is not readable.");
				return s || sc;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	isExecutable:function(path){
		var self = this;
		path = path || '';
		var func = function(s,e){
			path = normalize(path);
			return checkPermission.call(self, path, 1)
			.done(function(sc){
				if(!sc)
					return deep.errors.FS(path+ " is not executable.");
				return s || sc;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	pwd:function(){
		var self = this;
		var func = function(s,e){
			return deep.context.cwd;
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	cd:function(cwd){
		var self = this;
		var func = function(s,e){
			cwd =  normalize(cwd);
			self.toContext("cwd", pathUtil.resolve(cwd))
			.exists(".", true)
			.done(function(){
				return s;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	stat:function(path){
		var self = this;
		path = path || '.';
		var func = function(s,e){
			path = normalize(path);
			return deep.async(fs, "stat", [path]);
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	rename:function(oldPath, newPath){
		var self = this;
		var func = function(s,e){
			oldPath = normalize(oldPath);
			newPath = normalize(newPath);
			return deep.async(fs, "rename", [oldPath, newPath])
			.done(function(sc){
				return s || sc;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	chown:function(path, uid, gid){
		var self = this;
		path = path || '.';
		var func = function(s,e){
			path = normalize(path);
			return deep.async(fs, "chown", [path, uid, gid])
			.done(function(sc){
				return s || sc;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	chmod:function(path, mode){
		var self = this;
		path = path || '.';
		var func = function(s,e){
			path = normalize(path);
			return deep.async(fs, "chmod", [path, mode])
			.done(function(sc){
				return s || sc;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	exists:function(path, assertion){
		var self = this;
		path = path || '.';
		var func = function(s,e){
			path = normalize(path);
			var def = deep.Deferred();
			fs.exists(path, function(res){
				if(!res && assertion)
					def.reject(false);
				else
					def.resolve(s || true);
			})
			return def.promise();
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	link:function(srcpath, dstpath){
		var self = this;
		var func = function(s,e){
			srcpath = normalize(srcpath);
			dstpath = normalize(dstpath);
			return deep.async(fs, "link", [srcpath, dstpath])
			.done(function(sc){
				return s || sc;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	unlink:function(path){
		var self = this;
		path = path || '.';
		var func = function(s,e){
			path = normalize(path);
			return deep.async(fs, "unlink", [path])
			.done(function(sc){
				return s || sc;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	readlink:function(path){
		var self = this;
		path = path || '.';
		var func = function(s,e){
			path = normalize(path);
			return deep.async(fs, "readlink", [path]);
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	readdir:function(path){
		var self = this;
		path = path || '.';
		var func = function(s,e){
			path = normalize(path);
			return deep.async(fs, "readdir", [path]);
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	rmdir:function(path){
		var self = this;
		var func = function(s,e){
			path = normalize(path);
			return deep.async(fs, "rmdir", [path])
			.done(function(sc){
				return s || sc;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	mkdir:function(path, mode){
		var self = this;
		var func = function(s,e){
			path = normalize(path);
			return deep.async(fs, "mkdir", [path, mode])
			.done(function(sc){
				return s || sc;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	from:function(path, options){
		var self = this;
		if(typeof options === 'string')
			options = { type:options };
		else
		{
			options = options || {};
			options.type = options.type || 'json';
		}
		var func = function(s,e){
			path = normalize(path);
			return deep.async(fs, "readFile", [path, options])
			.done(function(s){
				switch(options.type)
				{
					case 'binary': return s; break;
					case 'json': return JSON.parse(String(s)); break;
					default : return String(s);
				}
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	json:function(path){
		var self = this;
		var func = function(s,e){
			return self.from(path, { type:"json" });
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	text:function(path){
		var self = this;
		var func = function(s,e){
			return self.from(path, { type:"text" });
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	to:function(path, data){
		var self = this;
		var func = function(s,e){
			data = data || s;
			path = normalize(path);
			if(!(data instanceof Buffer) && typeof data !== 'string')
				data = JSON.stringify(data);
			return deep.async(fs, "writeFile", [path, data])
			.done(function(){
				return data;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	appendTo:function(path, data, options){
		var self = this;
		var func = function(s,e){
			data = data || s;
			path = normalize(path);
			return deep.async(fs, "appendFile", [path, "\r\n"+data, options])
			.done(function(){
				return data;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	}
};

var FSChain = deep.fs.Chain = deep.compose.Classes(deep.Promise, constructor, proto);

FSChain._aspects = {
	constructor:constructor,
	proto:proto
};


deep.fs.Protocol = function(name, options) {
	return deep.protocol(name, {
		protocol: name,
		get: function(request, opt) {
			// console.log("______________ ssh protoc : get : ", name, request, opt);
			var methodIndex = request.indexOf(" "),
				method, args;
			if (methodIndex > -1) {
				method = request.substring(0, methodIndex);
				args = request.substring(methodIndex+1);
			}
			var handler = new deep.fs.Chain(null, options);
			if (method && handler[method])
				handler[method](args);
			else
				return deep.errors.Internal("protocol : fs:: no sub command found with : ", method)
			return handler._start();
		},
		json: function(request, opt) {
			// console.log("______________ ssh protoc : get : ", name, request, opt);
			return deep.fs(options).json(request);
		},
		text: function(request, opt) {
			// console.log("______________ ssh protoc : get : ", name, request, opt);
			return deep.fs(options).text(request);
		},
		to:function(path, opt){
			return function(value, oldFile)
			{
				return deep.fs(options).to(path, value);
			}
		},
		appendTo:function(path, opt){
			return function(value, oldFile)
			{
				return deep.fs(options).appendTo(path, value);
			}
		}
	});
};


module.exports = FSChain;

