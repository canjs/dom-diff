var NodeProp = require("./types/node_prop");
var dom = require("./dom-id");

var isArray = Array.isArray;

module.exports = serialize;



function serialize(patches){
	var out = [];
	forEach.call(patches, function(p){
		var a = isArray(p) ? p : [p];

		a.forEach(function(p){
			out.push([
				p.type,
				p.node ? dom.getID(p.node) : p.node,
				toArray(p.patch)
			]);
		});
	});
	return out;

}

function toArray(a){
	if(isNode(a)) {
		return nodeToObject(a);
	} else if(a) {
		// Other stuff
		return a;
	}
	return null;
}

function isNode(a){
	return !!(a && a.nodeType);
}

function nodeToObject(node){
	var objNode = [], i;

	if (node.nodeType === 3) {
		objNode[NodeProp.TEXT] = node.nodeValue;
	} else if (node.nodeType === 8) {
		objNode[NodeProp.COMMENT] = node.data;
	} else {
		objNode[NodeProp.NODE_NAME] = node.nodeName;
		if (node.attributes && node.attributes.length > 0) {
			objNode[NodeProp.ATTRIBUTES] = [];
			for (i = 0; i < node.attributes.length; i++) {
				objNode[NodeProp.ATTRIBUTES].push([node.attributes[i].name, node.attributes[i].value]);
			}
		}
		if (node.childNodes && node.childNodes.length > 0) {
			objNode[NodeProp.CHILD_NODES] = [];
			for (i = 0; i < node.childNodes.length; i++) {
				objNode[NodeProp.CHILD_NODES].push(nodeToObject(node.childNodes.item(i)));
			}
		}
		if (node.value) {
			objNode[NodeProp.VALUE] = node.value;
		}
		if (node.checked) {
			objNode[NodeProp.CHECKED] = node.checked;
		}
		if (node.selected) {
			objNode[NodeProp.SELECTED] = node.selected;
		}
		if(node.__events) {
			objNode[NodeProp.EVENTS] = [];
			var events = Object.keys(node.__events);
			for(i = 0; i < events.length; i++) {
				objNode[NodeProp.EVENTS].push(events[i]);
			}
		}
	}
	return objNode;
}

function forEach(fn){
	var i = 0;
	while(this[i]) {
		fn(this[i]);
		i++;
	}
}
