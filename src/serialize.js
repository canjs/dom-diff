var route = require("./dom-id");
var NodeProp = require("./types/node_prop");
var dom = require("./dom-id");

var isArray = Array.isArray;

module.exports = serialize;

function serialize(patches){
	var s = {};

	for(var p in patches) {
		serializeProp(s, p, patches[p]);
	}

	return s;
}

function serializeProp(s, prop, value) {
	if(prop === "a") {
		//s.route = dom.getID(value);
		return;
	}

	var serialized;

	if(isArray(value)) {
		serialized = value.map(serializePatch);
	} else {
		serialized = serializePatch(value);
	}

	s[prop] = serialized;
}

function serializePatch(p) {
	var type = p.type;
	var node = p.node;
	var patch = p.patch;

	return {
		route: p.route,
		type: type,
		node: serializeNode(node),
		patch: serializeNode(patch)
	};
}

function serializeNode(node) {
	if(isNode(node)) {
		return nodeToObject(node);
	}
	return node;
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
