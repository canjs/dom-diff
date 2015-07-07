var NodeProp = require("./types/node_prop");
var Patch = require("./types/patch");
var dom = require("./dom-id");

var isArray = Array.isArray;

module.exports = deserialize;

function deserialize(serialized, diffOptions){
	var root = diffOptions && diffOptions.root;

	var s = {};

	for(var p in serialized) {
		deserializeProp(s, p, serialized[p], diffOptions);
	}

	return s;
}

function deserializeProp(s, prop, value, diffOptions) {
	var deserialized;

	if(isArray(value)) {
		deserialized = value.map(function(p){
			return deserializePatch(p, diffOptions);
		});
	} else {
		deserialized = deserializePatch(value, diffOptions);
	}

	s[prop] = deserialized;
}

function deserializePatch(p, diffOptions) {
	return new Patch(p.type, deserializeNode(p.type, p.node, diffOptions),
					 deserializeNode(p.type, p.patch, diffOptions));
}

function deserializeNode(type, node, diffOptions) {
	if(!node || !isNodePatch(type)) {
		return node;
	}
	return objectToNode(node, false, diffOptions);
}


function objectToNode(objNode, insideSvg, diffOptions) {
	if(!objNode) {
		return objNode;
	}

	var node, i;
	if (objNode.hasOwnProperty(NodeProp.TEXT)) {
		node = document.createTextNode(objNode[NodeProp.TEXT]);
	} else if (objNode.hasOwnProperty(NodeProp.COMMENT)) {
		node = document.createComment(objNode[COMMENT]);
	} else {
		if (objNode[NodeProp.NODE_NAME] === 'svg' || insideSvg) {
			node = document.createElementNS('http://www.w3.org/2000/svg', objNode[NodeProp.NODE_NAME]);
			insideSvg = true;
		} else {
			node = document.createElement(objNode[NodeProp.NODE_NAME]);
		}
		if (objNode[NodeProp.ATTRIBUTES]) {
			for (i = 0; i < objNode[NodeProp.ATTRIBUTES].length; i++) {
				node.setAttribute(objNode[NodeProp.ATTRIBUTES][i][0], objNode[NodeProp.ATTRIBUTES][i][1]);
			}
		}
		if (objNode[NodeProp.CHILD_NODES]) {
			for (i = 0; i < objNode[NodeProp.CHILD_NODES].length; i++) {
				node.appendChild(objectToNode(objNode[NodeProp.CHILD_NODES][i], insideSvg, diffOptions));
			}
		}
		if (objNode[NodeProp.VALUE]) {
			node.value = objNode[NodeProp.VALUE];
		}
		if (objNode[NodeProp.CHECKED]) {
			node.checked = objNode[NodeProp.CHECKED];
		}
		if (objNode[NodeProp.SELECTED]) {
			node.selected = objNode[NodeProp.SELECTED];
		}
		if (objNode[NodeProp.EVENTS]) {
			node.__events = {};
			objNode[NodeProp.EVENTS].forEach(function(evName){
				node.__events[evName] = true;
				if(diffOptions && diffOptions.eventHandler) {
					node.addEventListener(evName, diffOptions.eventHandler);
				}
			});

		}
	}
	node._cloned = true;
	return node;
}

var nodePatches = {};
[Patch.INSERT, Patch.REMOVE,
 Patch.NODE, Patch.ORDER].forEach(function(type){
	nodePatches[type] = true;
});
function isNodePatch(type){
	return nodePatches[type];
}
