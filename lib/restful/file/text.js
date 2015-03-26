var deep = require("deepjs"),
	FS =  require("./fs");

deep.nodejs.files.Text = deep.Classes(FS,
{
	cachePath:"node.fs.Text::"
});
module.exports = deep.nodejs.files.Text;
