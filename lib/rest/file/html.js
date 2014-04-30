if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(["require", "deepjs", "./fs", "deepjs/lib/stores/cache" ],function (require, deep)
{
	deep.store.node = deep.store.node || {};
	deep.store.node.fs = deep.store.node.fs || {};
	deep.store.node.fs.HTML = deep.compose.Classes(deep.store.node.fs.FS,
	{
		cachePath:"node.fs.HTML::"
	});
	deep.store.node.fs.HTML.createDefault = function(){
		var store = new deep.store.node.fs.HTML("html", deep.globals.rootPath, null, { watch:true, cache:true });
		deep.sheet(deep.mediaCache.sheets.store, store);
		return store;
	};
	deep.store.node.fs.HTML.create = function(baseURI, schema, options){
		options = options || {};
		var store = new deep.store.node.fs.JSON("html", baseURI || deep.globals.rootPath, schema, options);
		if(options.cache)
			deep.sheet(deep.mediaCache.sheets.store, store);
		return store;
	};
	return deep.store.node.fs.HTML;
});
