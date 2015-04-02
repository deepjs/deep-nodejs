"use strict";

var deep =  require("deepjs"),
	FS = require("./fs"),
	storeSheet = require("deep-restful/lib/store-sheet");


deep.nodejs.files.JSON = deep.Classes(FS,
{
	cachePath:"nodejs.files.json::",
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
}, storeSheet);
//deep.coreUnits = deep.coreUnits || [];
//deep.coreUnits.push("js::deep-node-fs/units/generic");
module.exports = deep.nodejs.files.JSON;










