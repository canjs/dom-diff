//var applyProperties = requirex("./apply-properties")
var applyAttributes = require("./apply-attributes");

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    if (isText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

	var attributes = vnode.attributes;
	applyAttributes(node, attributes);

    var children = vnode.childNodes;

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children.get(i), opts);
        if (childNode) {
            node.appendChild(childNode);
        }
    }

    return node
}

function isNode(a){
	// Anything with a nodeType is a Node.
	return !!(a && a.nodeType && !isText(a));
}

function isText(a){
	return !!(a && a.nodeType === 3);
}

