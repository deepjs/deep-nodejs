var deep = require("deepjs"),
	FS =  require("./fs");

deep.nodejs.files.HTML = deep.Classes(FS,
{
	cachePath:"nodejs.files.HTML::"
});
module.exports = deep.nodejs.files.HTML;
