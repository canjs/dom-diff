var NodeProp = require("./types/node_prop");
var Patch = require("./types/patch");
var deserialize = require("./deserialize");

var isArray = Array.isArray;

module.exports = patch;

function patch(a, patches) {
	if(isArray(patches)) {
		patches = deserialize(patches);
	}

	forEach.call(patches, function(p){
		var n = p.node || a;

		switch(p.type) {
			case Patch.INSERT:
				n.appendChild(p.patch);
				break;
			case Patch.TEXT:
				break;
		}
	});
}

function forEach(fn){
	var i = 0;
	while(this[i]) {
		fn(this[i]);
		i++;
	}
}
