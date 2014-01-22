if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(["require","deepjs", "./fs"],function (require, deep)
{
	deep.store.node = deep.store.node || {};
	deep.store.node.fs = deep.store.node.fs || {};
	deep.store.node.fs.Text = deep.compose.Classes(deep.store.node.fs.FS,
	{
		cachePath:"node.fs.Text::"
	});
	deep.store.node.fs.Text.createDefault = function(){
		var store = new deep.store.node.fs.Text("text", deep.globals.rootPath, null, { watch:true, cache:true });
		deep.sheet(deep.store.CachedStoreSheet, store);
		return store;
	};
	deep.store.node.fs.Text.create = function(baseURI, schema, options){
		options = options || {};
		var store = new deep.store.node.fs.Text("text", baseURI || deep.globals.rootPath, schema, options);
		if(options.cache)
			deep.sheet(deep.store.CachedStoreSheet, store);
		return store;
	};
	return deep.store.node.fs.Text;
});
