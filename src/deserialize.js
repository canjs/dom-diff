var NodeProp = require("./types/node_prop");
var Patch = require("./types/patch");

module.exports = deserialize;

function deserialize(w){
	var patches = [];
	w.forEach(function(u){
		var type = u[0];
		var node = objectToNode(u[1]);
		var patch = objectToNode(u[2]);

		patches.push(new Patch(type, node, patch));
	});
	return patches;
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
			addEvents(node, objNode, diffOptions);
		}
	}
	return node;
}
