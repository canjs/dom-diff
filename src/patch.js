var isArray = Array.isArray;

var render = require("./create-element");
var domIndex = require("./dom-index");
var patchOp = require("./patch-op");
var deserialize = require("./deserialize");
var domId = require("./dom-id");

module.exports = patch;

function patch(rootNode, patches, renderOptions) {
	if(!patches.a) {
		patches = deserialize(patches, renderOptions);
		patches.a = rootNode;
	}

    renderOptions = renderOptions || {}
    renderOptions.patch = renderOptions.patch || patchRecursive
    renderOptions.render = renderOptions.render || render

    return renderOptions.patch(rootNode, patches, renderOptions)
}

function patchRecursive(rootNode, patches, renderOptions) {
	var indices = patchIndices(patches);

	var ownerDocument = rootNode.ownerDocument;

	if(!renderOptions.document && ownerDocument !== document) {
		renderOptions.document = ownerDocument;
	}

	indices.forEach(function(i){
		var patch = patches[i];

		rootNode = applyPatch(rootNode,
			patch.node,
			patch,
			renderOptions);
	});

}

function patchRecursiveOld(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices);
    var ownerDocument = rootNode.ownerDocument;

    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
	if(!domNode) {
		if(patchList.route) {
			domNode = domId.getNode(patchList.route, renderOptions.root);
		}

		if(!domNode)
			return;
	}

    var newNode;

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}
