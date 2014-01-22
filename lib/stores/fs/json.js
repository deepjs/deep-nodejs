"use strict";
if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(["require", "deepjs","./fs"],function (require, deep)
{
	deep.store.node = deep.store.node || {};
	deep.store.node.fs = deep.store.node.fs || {};

	deep.store.node.fs.JSON = deep.compose.Classes(deep.store.node.fs.FS,
	{
		cachePath:"node.fs.json::",
		bodyParser:function(body){
			if(typeof body !== 'string')
				body = JSON.stringify(body);
			return body;
		},
		responseParser:function(datas){
			if(datas instanceof Buffer)
				datas = datas.toString("utf8");
			//console.log("deep-node-fs/json : datas loaded : ", datas)
			return JSON.parse(datas);
		}
	});

	deep.sheet(deep.store.FullJSONStoreSheet, deep.store.node.fs.JSON.prototype);

	deep.store.node.fs.JSON.createDefault = function(){
		var store = new deep.store.node.fs.JSON("json", deep.globals.rootPath, null, { watch:true, cache:true });
		deep.sheet(deep.store.CachedStoreSheet, store);
		return store;
	};
	deep.store.node.fs.JSON.create = function(protocol, baseURI, schema, options){
		options = options || {};
		var store = new deep.store.node.fs.JSON(protocol, baseURI || deep.globals.rootPath || "", schema, options);
		if(options.cache)
			deep.sheet(deep.store.CachedSheet, store);
		return store;
	};

    //deep.coreUnits = deep.coreUnits || [];
    //deep.coreUnits.push("js::deep-node-fs/units/generic");

	return deep.store.node.fs.JSON;
});










