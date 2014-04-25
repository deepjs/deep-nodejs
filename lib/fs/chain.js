var fs = require('fs');
var pathUtil = require("path"),
	normalize = pathUtil.normalize;
var deep = require("deepjs");


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
    var handler = new FSChain(this._state);
    var func = function(s, e) {
    	cwd = cwd || ".";
		var oldCwd = deep.context.cwd || deep.globals.rootPath;
		if(cwd[0] !== "/" && oldCwd)
			cwd = normalize(oldCwd+"/"+cwd);
		handler.context("cwd", cwd)
		.exists(".", true);
 		return s;
    };
    func._isDone_ = true;
    self._enqueue(func);
    return handler;
};

deep.fs = function(cwd){
	return new FSChain({ cwd:cwd })._start();
};

var FSChain = deep.compose.Classes(deep.Promise,
	function (options) {
		options = options || {};
		this._identity = FSChain;
		var cwd = options.cwd || ".";
		var oldCwd = deep.context.cwd || deep.globals.rootPath;
		if(cwd[0] !== "/" && oldCwd)
			cwd =  normalize(oldCwd+"/"+cwd);
		//console.log('CWD : ', cwd);
		this.context("cwd", pathUtil.resolve(cwd))
		.exists(".", true);
		// console.log('FS constructor : ', this._state.cwd);
}, {
	/*_forward:deep.compose.around(function(old){
		return function(clone){
			return old.call(this, clone);
		}
	})*/
	isWritable:function(path){
		var self = this;
		path = path || '';
		var func = function(s,e){
			return checkPermission.call(self, path, 2);
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	isReadable:function(path){
		var self = this;
		path = path || '';
		var func = function(s,e){
			return checkPermission.call(self, path, 4);
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	isExecutable:function(path){
		var self = this;
		path = path || '';
		var func = function(s,e){
			return checkPermission.call(self, path, 1);
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	pwd:function(){
		var self = this;
		var func = function(s,e){
			console.log("pwd : ", deep.context.cwd);
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	cd:function(cwd){
		var self = this;
		var func = function(s,e){
    		var oldCwd = deep.context.cwd || deep.globals.rootPath;
			if(cwd[0] !== "/" && oldCwd)
				cwd =  normalize(oldCwd+"/"+cwd);
			self.context("cwd", pathUtil.resolve(cwd))
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
			path = normalize(deep.context.cwd+"/"+path);
			return deep.async(fs, "stat", [path]);
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	rename:function(oldPath, newPath){
		var self = this;
		var func = function(s,e){
			oldPath = normalize(deep.context.cwd+"/"+oldPath);
			newPath = normalize(deep.context.cwd+"/"+newPath);
			return deep.async(fs, "rename", [oldPath, newPath])
			.done(function(){
				return true;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	chown:function(path, uid, gid){
		var self = this;
		path = path || '.';
		var func = function(s,e){
			path = normalize(deep.context.cwd+"/"+path);
			return deep.async(fs, "chown", [path, uid, gid])
			.done(function(){
				return true;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	chmod:function(path, mode){
		var self = this;
		path = path || '.';
		var func = function(s,e){
			path = normalize(deep.context.cwd+"/"+path);
			return deep.async(fs, "chmod", [path, mode])
			.done(function(){
				return true;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	exists:function(path, assertion){
		var self = this;
		path = path || '.';
		var func = function(s,e){
			path = normalize(deep.context.cwd+"/"+path);
			var def = deep.Deferred();
			fs.exists(path, function(res){
				if(!res && assertion)
					def.reject(false);
				else
					def.resolve(res);
			})
			return def.promise();
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	link:function(srcpath, dstpath){
		var self = this;
		var func = function(s,e){
			srcpath = normalize(deep.context.cwd+"/"+srcpath);
			dstpath = normalize(deep.context.cwd+"/"+dstpath);
			return deep.async(fs, "link", [srcpath, dstpath])
			.done(function(){
				return true;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	unlink:function(path){
		var self = this;
		path = path || '.';
		var func = function(s,e){
			path = normalize(deep.context.cwd+"/"+path);
			return deep.async(fs, "unlink", [path])
			.done(function(){
				return true;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	readlink:function(path){
		var self = this;
		path = path || '.';
		var func = function(s,e){
			path = normalize(deep.context.cwd+"/"+path);
			return deep.async(fs, "readlink", [path]);
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	readdir:function(path){
		var self = this;
		path = path || '.';
		var func = function(s,e){
			path = normalize(deep.context.cwd+"/"+path);
			return deep.async(fs, "readdir", [path]);
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	rmdir:function(path){
		var self = this;
		var func = function(s,e){
			path = normalize(deep.context.cwd+"/"+path);
			return deep.async(fs, "rmdir", [path])
			.done(function(){
				return true;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	mkdir:function(path, mode){
		var self = this;
		var func = function(s,e){
			path = normalize(deep.context.cwd+"/"+path);
			return deep.async(fs, "mkdir", [path, mode])
			.done(function(){
				return true;
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
			if(path[0] !== '/')
				path = normalize(deep.context.cwd+"/"+path);
			console.log("WILL FROM :",path);
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
	to:function(path, data, options){
		var self = this;
		var func = function(s,e){
			data = data || s;
			console.log("TO fs : ", self._state);
			path = normalize(deep.context.cwd+"/"+path);
			if(!(data instanceof Buffer) && typeof data === 'object')
				data = JSON.stringify(data);
			return deep.async(fs, "writeFile", [path, data, options]);
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	appendTo:function(path, data, options){
		var self = this;
		var func = function(s,e){
			data = data || s;
			path = normalize(deep.context.cwd+"/"+path);
			return deep.async(fs, "appendFile", [path, "\r\n"+data, options]);
		};
		func._isDone_ = true;
		return self._enqueue(func);
	}
});

/*
deep.Promise.API.file = function(fileName) {
    var self = this;
    var handler = new FileChain();
    var func = function(s, e) {
    	if(fileName)
		{
    		var oldCwd = deep.context.cwd || deep.globals.rootPath;
			if(fileName[0] !== "/" && oldCwd)
				fileName = normalize(oldCwd+"/"+fileName);
		}
    	var cloned = self._forward();
		handler._start(cloned);
 		return s;
    };
    func._isDone_ = true;
    self._enqueue(func);
    return handler;
};

deep.file = function(fileName){
	return new FileChain({ fileName:fileName })._start();
};

var FileChain = deep.compose.Classes(deep.Promise, function(options){
	options = options || {};
	this._identity = FileChain;
	this._locals = this._locals || {};
	this._locals.fileName = options.fileName;

	var oldCwd = deep.context.cwd || deep.globals.rootPath;
	if(this._locals.fileName[0] !== "/" && oldCwd)
		this._locals.fileName =  normalize(oldCwd+"/"+this._locals.fileName);
	this._locals.fileName =  pathUtil.resolve(this._locals.fileName);
}, {
	close:deep.compose.before(function(){
		var self = this;
		var func = function(s,e){
			if(!self._env.fd || !self._env.fd.length)
				return s;
			return deep.async(fs, "close", [self._env.fd.pop()])
			.done(function(){
				return true;
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	}),
	open:function(path, flags, mode){
		var self = this;
		flags = flags || 'a+';
		var func = function(s,e){
			self._env.fd = self._env.fd || [];
			path = normalize(deep.context.cwd+"/"+path);
			return deep.async(fs, "open", [path, flags, mode])
			.done(function(fd){
				self._env.fd.push(fd);
			});
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	write:function(buffer, offset, length, position){
		var self = this;
		var func = function(s,e){
			if(!self._env.fd || !self._env.fd.length)
				return deep.errors.Internal("you try to write on no opened file")
			var fd = self._env.fd[self._env.fd.length-1];
			return deep.async(fs, "write", [buffer, offset, length, position]);
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	read:function(buffer, offset, length, position){
		var self = this;
		var func = function(s,e){
			if(!self._env.fd || !self._env.fd.length)
				return deep.errors.Internal("you try to read on no opened file")
			var fd = self._env.fd[self._env.fd.length-1];
			return deep.async(fs, "read", [buffer, offset, length, position]);
		};
		func._isDone_ = true;
		return self._enqueue(func);
	},
	append:function(){

	}
});

*/

