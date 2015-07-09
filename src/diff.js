var isArray = Array.isArray;

var Patch = require("./types/patch");

var diffProps = require("./diff-props");
var diffEvents = require("./diff-events");

var dom = require("./dom-id");

module.exports = diff;

function diff(a, b, diffOptions) {
	var patch = { a: a };
	diffOptions = diffOptions || {};
	walk(a, b, patch, 0, diffOptions);
	return patch;
}

function walk(a, b, patch, index, diffOptions) {
	if (a === b) {
		return;
	}

	var apply = patch[index];
	var applyClear = false;

	if (b == null) {
		apply = appendPatch(apply, new Patch(Patch.REMOVE, a, b))
	} else if (isNode(b)) {
		if (isNode(a)) {
			if (a.tagName === b.tagName &&
				a.namespace === b.namespace &&
				a[keyProp(a)] === keyFor(b)) {
				// TODO this should probably be attributes
				var propsPatch = diffProps(a, b);
				if (propsPatch) {
					apply = appendPatch(apply,
						new Patch(Patch.PROPS, a, propsPatch))
				}
				var eventsPatch = diffEvents(a, b);
				if(eventsPatch[0].length) {
					apply = appendPatch(apply,
						new Patch(Patch.ADD_EVENT, a, eventsPatch[0]));
				}
				if(eventsPatch[1].length) {
					apply = appendPatch(apply,
						new Patch(Patch.REMOVE_EVENT, a, eventsPatch[1]));
				}
				apply = diffChildren(a, b, patch, apply, index, diffOptions);
			} else {
				apply = appendPatch(apply, new Patch(Patch.NODE, a, b))
				applyClear = true
			}
		} else {
			apply = appendPatch(apply, new Patch(Patch.NODE, a, b))
			applyClear = true
		}
	} else if (isText(b)) {
		if (!isText(a)) {
			apply = appendPatch(apply, new Patch(Patch.TEXT, a, b))
			applyClear = true
		} else if (a.text !== b.text) {
			apply = appendPatch(apply, new Patch(Patch.TEXT, a, b))
		}
	} else if (isWidget(b)) {
		if (!isWidget(a)) {
			applyClear = true
		}

		apply = appendPatch(apply, new Patch(Patch.WIDGET, a, b))
	}

	if (apply) {
		var route;
		if(apply.node) {
			route = dom.getID(apply.node, diffOptions.root);
		} else if(apply.patch && apply.patch.parentNode) {
			route = dom.getID(apply.patch.parentNode, diffOptions.root);
		}
		apply.route = route;

		patch[index] = apply
	}

	if (applyClear) {
		clearState(a, patch, index)
	}
}

function diffChildren(a, b, patch, apply, index, diffOptions) {
	var aChildren = getChildren(a);
	var bChildren = getChildren(b);

	var orderedSet = reorder(aChildren, bChildren);
	var bChildren = orderedSet.children;

	var aLen = aChildren.length;
	var bLen = bChildren.length;
	var len = aLen > bLen ? aLen : bLen;

	for (var i = 0; i < len; i++) {
		var leftNode = aChildren[i];
		var rightNode = bChildren[i];
		index += 1

		if (!leftNode) {
			if (rightNode) {
				// Excess nodes in b need to be added
				apply = appendPatch(apply,
					new Patch(Patch.INSERT, null, rightNode,
							 dom.getID(rightNode.parentNode, diffOptions.root)));
			}
		} else {
			walk(leftNode, rightNode, patch, index, diffOptions);
		}

		if (isNode(leftNode) && leftNode.count) {
			index += leftNode.count
		}
	}

	if (orderedSet.moves) {
		// Reorder nodes last
		apply = appendPatch(apply, new Patch(
			Patch.ORDER,
			a,
			orderedSet.moves
		))
	}

	return apply
}

function clearState(vNode, patch, index) {
	// TODO: Make this a single walk, not two
	//unhook(vNode, patch, index)
	//destroyWidgets(vNode, patch, index)
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
	if (isWidget(vNode)) {
		if (typeof vNode.destroy === "function") {
			patch[index] = appendPatch(
				patch[index],
				new Patch(Patch.REMOVE, vNode, null)
			)
		}
	} else if (isNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
		var children = vNode.children
		var len = children.length
		for (var i = 0; i < len; i++) {
			var child = children[i]
			index += 1

			destroyWidgets(child, patch, index)

			if (isNode(child) && child.count) {
				index += child.count
			}
		}
	} else if (isThunk(vNode)) {
		thunks(vNode, null, patch, index)
	}
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
	var nodes = handleThunk(a, b)
	var thunkPatch = diff(nodes.a, nodes.b)
	if (hasPatches(thunkPatch)) {
		patch[index] = new Patch(Patch.THUNK, null, thunkPatch)
	}
}

function hasPatches(patch) {
	for (var index in patch) {
		if (index !== "a") {
			return true
		}
	}

	return false
}

// Execute hooks when two nodes are identical
function unhook(vNode, patch, index) {
	if (isNode(vNode)) {
		if (vNode.hooks) {
			patch[index] = appendPatch(
				patch[index],
				new Patch(
					Patch.PROPS,
					vNode,
					undefinedKeys(vNode.hooks)
				)
			)
		}

		if (vNode.descendantHooks || vNode.hasThunks) {
			var children = vNode.children
			var len = children.length
			for (var i = 0; i < len; i++) {
				var child = children[i]
				index += 1

				unhook(child, patch, index)

				if (isNode(child) && child.count) {
					index += child.count
				}
			}
		}
	} else if (isThunk(vNode)) {
		thunks(vNode, null, patch, index)
	}
}

function undefinedKeys(obj) {
	var result = {}

	for (var key in obj) {
		result[key] = undefined
	}

	return result
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {
	// O(M) time, O(M) memory
	var bChildIndex = keyIndex(bChildren)
	var bKeys = bChildIndex.keys
	var bFree = bChildIndex.free

	if (bFree.length === bChildren.length) {
		return {
			children: bChildren,
			moves: null
		}
	}

	// O(N) time, O(N) memory
	var aChildIndex = keyIndex(aChildren)
	var aKeys = aChildIndex.keys
	var aFree = aChildIndex.free

	if (aFree.length === aChildren.length) {
		return {
			children: bChildren,
			moves: null
		}
	}

	// O(MAX(N, M)) memory
	var newChildren = []

	var freeIndex = 0
	var freeCount = bFree.length
	var deletedItems = 0

	// Iterate through a and match a node in b
	// O(N) time,
	for (var i = 0 ; i < aChildren.length; i++) {
		var aItem = aChildren[i]
		var itemIndex

		if (keyFor(aItem)) {
			if (bKeys.hasOwnProperty(keyFor(aItem))) {
				// Match up the old keys
				itemIndex = bKeys[keyFor(aItem)]
				newChildren.push(bChildren[itemIndex])

			} else {
				// Remove old keyed items
				itemIndex = i - deletedItems++
				newChildren.push(null)
			}
		} else {
			// Match the item in a with the next free item in b
			if (freeIndex < freeCount) {
				itemIndex = bFree[freeIndex++]
				newChildren.push(bChildren[itemIndex])
			} else {
				// There are no free items in b to match with
				// the free items in a, so the extra free nodes
				// are deleted.
				itemIndex = i - deletedItems++
				newChildren.push(null)
			}
		}
	}

	var lastFreeIndex = freeIndex >= bFree.length ?
		bChildren.length :
		bFree[freeIndex]

	// Iterate through b and append any new keys
	// O(M) time
	for (var j = 0; j < bChildren.length; j++) {
		var newItem = bChildren[j]

		if (keyFor(newItem)) {
			if (!aKeys.hasOwnProperty(keyFor(newItem))) {
				// Add any new keyed items
				// We are adding new items to the end and then sorting them
				// in place. In future we should insert new items in place.
				newChildren.push(newItem)
			}
		} else if (j >= lastFreeIndex) {
			// Add any leftover non-keyed items
			newChildren.push(newItem)
		}
	}

	var simulate = newChildren.slice()
	var simulateIndex = 0
	var removes = []
	var inserts = []
	var simulateItem

	for (var k = 0; k < bChildren.length;) {
		var wantedItem = bChildren[k]
		simulateItem = simulate[simulateIndex]

		// remove items
		while (simulateItem === null && simulate.length) {
			removes.push(remove(simulate, simulateIndex, null))
			simulateItem = simulate[simulateIndex]
		}

		if (!simulateItem || keyFor(simulateItem) !== keyFor(wantedItem)) {
			// if we need a key in this position...
			if (keyFor(wantedItem)) {
				if (simulateItem && keyFor(simulateItem)) {
					// if an insert doesn't put this key in place, it needs to move
					if (bKeys[keyProp(simulateItem)] !== k + 1) {
						removes.push(remove(simulate, simulateIndex, keyFor(simulateItem)))
						simulateItem = simulate[simulateIndex]
						// if the remove didn't put the wanted item in place, we need to insert it
						if (!simulateItem || keyFor(simulateItem) !== keyFor(wantedItem)) {
							inserts.push({key: keyFor(wantedItem), to: k})
						}
						// items are matching, so skip ahead
						else {
							simulateIndex++
						}
					}
					else {
						inserts.push({key: keyFor(wantedItem), to: k})
					}
				}
				else {
					inserts.push({key: keyFor(wantedItem), to: k})
				}
				k++
			}
			// a key in simulate has no matching wanted key, remove it
			else if (simulateItem && keyFor(simulateItem)) {
				removes.push(remove(simulate, simulateIndex, keyFor(simulateItem)))
			}
		}
		else {
			simulateIndex++
			k++
		}
	}

	// remove all the remaining nodes from simulate
	while(simulateIndex < simulate.length) {
		simulateItem = simulate[simulateIndex]
		removes.push(remove(simulate, simulateIndex, simulateItem && keyFor(simulateItem)))
	}

	// If the only moves we have are deletes then we can just
	// let the delete patch remove these items.
	if (removes.length === deletedItems && !inserts.length) {
		return {
			children: newChildren,
			moves: null
		}
	}

	return {
		children: newChildren,
		moves: {
			removes: removes,
			inserts: inserts
		}
	}
}

function remove(arr, index, key) {
	arr.splice(index, 1)

	return {
		from: index,
		key: key
	}
}

function keyIndex(children) {
	var keys = {};
	var free = [];
	var length = children.length;

	for (var i = 0; i < length; i++) {
		var child = children[i]

		if (keyFor(child)) {
			keys[keyFor(child)] = i;
		} else {
			free.push(i);
		}
	}

	return {
		keys: keys,		// A hash of key name to index
		free: free		// An array of unkeyed item indices
	}
}

function keyFor(a) {
	return a.id;
}

function keyProp(a) {
	return "id";
}

function appendPatch(apply, patch) {
	if (apply) {
		if (isArray(apply)) {
			apply.push(patch)
		} else {
			apply = [apply, patch]
		}

		return apply
	} else {
		return patch
	}
}

function isNode(a){
	// Anything with a nodeType is a Node.
	return !!(a && a.nodeType && !isText(a));
}

function isText(a){
	return !!(a && a.nodeType === 3);
}

function getChildren(a){
	/*if(a.children) {
		return a.children;
	}*/

	var out = [];
	var cur = a.firstChild;
	while(cur) {
		//if(!isText(cur)) {
			out.push(cur);
		//}
		cur = cur.nextSibling;
	}
	return out;
}
