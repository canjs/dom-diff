var NodeProp = require("./types/node_prop");
var Patch = require("./types/patch");
var deserialize = require("./deserialize");
var forEach = require("./for-each-patch");

var isArray = Array.isArray;

module.exports = patch;

function patch(a, patches, patchOptions) {
	if(isArray(patches)) {
		patches = deserialize(patches, patchOptions);
	}

	patchOptions = patchOptions || {};

	forEach.call(patches, function(p){
		var n = p.node || a;

		switch(p.type) {
			case Patch.INSERT:
				n.appendChild(p.patch);
				break;
			case Patch.REMOVE:
				p.node.parentNode.removeChild(p.node);
				break;
			case Patch.TEXT:
				break;
			case Patch.ATTRS:
				forEachProp.call(p.patch, function(key, value){
					n.setAttribute(key, value);
				});
				break;
			case Patch.ADD_EVENT:
				if(patchOptions.eventHandler) {
					n.__events = n.__events || {};
					p.patch.forEach(function(evName){
						n.addEventListener(evName, patchOptions.eventHandler);
						n.__events[evName] = true;
					});
				}
				break;
			case Patch.REMOVE_EVENT:
				if(patchOptions.eventHandler) {
					p.patch.forEach(function(evName){
						n.removeEventListener(evName, patchOptions.eventHandler);
						if(n.__events) {
							delete n.__events[evName];
						}
					});
				}
				break;
		}
	});
}

function forEachProp(fn){
	var keys = Object.keys(this);
	var self = this;
	forEach.call(keys, function(prop){
		fn(prop, self[prop]);
	});
}
