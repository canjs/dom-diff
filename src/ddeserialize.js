var NodeProp = require("./types/node_prop");
var Patch = require("./types/patch");
var dom = require("./dom-id");

var isArray = Array.isArray;

module.exports = deserialize;

function deserialize(serialized, diffOptions){
	var root = diffOptions && diffOptions.root;

	var s = {};

	for(var p in serialized) {
		deserializeProp(s, p, serialized[p]);
	}

	return s;
}

function deserializeProp(s, prop, value) {
	var deserialized;

	if(isArray(value)) {
		deserialized = value.map(deserializePatch);
	} else {
		deserialized = deserializePatch(value);
	}

	s[prop] = deserialized;
}

function deserializePatch(p) {
	return new Patch(p.type, deserializeNode(p.node),
					 deserializeNode(p.patch));
}

function deserializeNode(node) {
	if(!node) {
		return node;
	}
	return objectToNode(node);
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
	return node;
}

var nodePatches = {};
[Patch.INSERT, Patch.REMOVE].forEach(function(type){
	nodePatches[type] = true;
});
function isNodePatch(type){
	return nodePatches[type];
}
