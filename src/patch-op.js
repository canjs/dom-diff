/*var applyProperties = requirex("./apply-properties")

var isWidget = requirex("../vnode/is-widget.js")
var VPatch = requirex("../vnode/vpatch.js")

var updateWidget = requirex("./update-widget")*/

var applyAttributes = require("./apply-attributes");

var Patch = require("./types/patch");

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case Patch.REMOVE:
            return removeNode(domNode, vNode)
        case Patch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case Patch.TEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case Patch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case Patch.NODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case Patch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case Patch.ATTRS:
			applyAttributes(domNode, patch);
            return domNode;
        case Patch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
		case Patch.ADD_EVENT:
			if(renderOptions.eventHandler) {
				domNode.__events = domNode.__events || {};
				patch.forEach(function(evName){
					domNode.addEventListener(evName, renderOptions.eventHandler);
					domNode.__events[evName] = true;
				});
			}
			return domNode;
		case Patch.REMOVE_EVENT:
			if(renderOptions.eventHandler) {
				patch.forEach(function(evName){
					domNode.removeEventListener(evName, renderOptions.eventHandler);
					if(domNode.__events) {
						delete domNode.__events[evName];
					}
				});
			}
			return domNode;

        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = renderOptions.render(vText, renderOptions)

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget)
    var newNode

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode
    } else {
        newNode = renderOptions.render(widget, renderOptions)
    }

    var parentNode = domNode.parentNode

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode)
    }

    return newNode
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, moves) {
    var childNodes = domNode.childNodes
    var keyMap = {}
    var node
    var remove
    var insert

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) {
            keyMap[remove.key] = node
        }
        domNode.removeChild(node)
    }

    var length = childNodes.length
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]
        // this is the weirdest bug i've ever seen in webkit
        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}
