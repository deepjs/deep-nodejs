var deep = require("deepjs"),
    crypto = require("crypto");

//________________________________________  Hash utils
deep.utils.Hash = function(string, algo) {
    return crypto.createHash(algo || 'sha1').update(string).digest('hex');
};
deep.transformers.Hash = function(algo) {
    return function(node) {
        return deep.utils.Hash(node.value, algo);
    };
};

