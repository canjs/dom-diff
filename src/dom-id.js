/**
 * @module can-worker/dom-id dom-id
 *
 * Utilities for finding DOM elements.
 *
 */

var slice = [].slice;

// An object for caching nodes
var nodeCache = exports.nodeCache = {};

/**
 * A data structure used to invalidate ids when new nodes are inserted into
 * the DOM. The structure is like:
 *
 * [
 *   10: [
 *     element: Element,
 *     2: [
 *       element: Element
 *     ]
 *   ]
 * ]
 *
 * If we insert an id of "0.2"
 */
var nodeTree = exports.nodeTree = [];

// Separator for our dom ids
var SEPARATOR = ".";

/**
 * @function can-worker/dom-id.rootNode
 * @parent can-worker/dom-id
 *
 * Get the root DOM element.
 *
 * @param {Document} [root] The root document.
 * @return {HTMLHtmlElement}
 */
var rootNode = exports.rootNode = function(root){
	if(!root) {
		return document.documentElement;
	}
	return root.documentElement || root;
};

var cache = function(node, routeInfo){
	node.__routeInfo = routeInfo;
	nodeCache[routeInfo.id] = node;
};

/**
 * @function can-worker/dom-id.getID getID
 * @parent can-worker/dom-id
 *
 * Get the ID for a given element.
 *
 * The id is represented as ".0.1.0.0.1" where each integer is the index of the
 * node within it's parent. This is computed by starting with the node and
 * walking up the document
 *
 * @param {Node} node
 * @return {String} id of the node
 */
var getID = exports.getID = function(node){
	var id = getCachedID(node);
	if(!id) {
		// Get the route to the node.
		var routeInfo = getRoute(node);
		id = routeInfo.id;
	}
	return id;
};

var getCachedInfo = exports.getCachedInfo = function(node){
	return node.__routeInfo;
};

var getCachedID = exports.getCachedID = function(node){
	var info = getCachedInfo(node);
	return info && info.id;
};

var getIndex = exports.getIndex = function(id){
	return +id.substr(id.lastIndexOf(".") + 1);
};

function getBranch(index, element, parentBranch) {
	parentBranch = parentBranch || nodeTree;
	var branch = parentBranch[index];
	if(!branch) {
		branch = parentBranch[index] = [];
		branch.element = element;
	}
	return branch;
}

/**
 * Generates the route for a particular node, caching the intermediate nodes
 * along the way.
 */
function getRoute(node) {
	var id = "";

	var parent = node.parentNode;
	var index = -1;

	if(!parent) {
		return {id:"0"};
	}

	var child = parent.firstChild;
	while(child) {
		index++;
		if(child === node) {
			break;
		}
		child = child.nextSibling;
	}

	// ARG!

	var parentInfo = parent.nodeType === 9 ? {id:""} :
		getCachedInfo(parent) || getRoute(parent);

	var parentId = parentInfo.id;

	id = (parentId ? parentId + SEPARATOR : "") + index;

	var routeInfo = {
		id: id,
		branch: getBranch(index, node, parentInfo.branch)
	};
	cache(node, routeInfo);

	return routeInfo;
}

/**
 * @function can-worker/dom-id.findNode findNode
 * @parent can-worker/dom-id
 *
 * Find a DOM node by its id.
 */
var findNode = exports.findNode = function(id, root){
	var node = rootNode(root);
	var ids = id.split(".");
	var idIndex = 1;

	while(node) {
		var currentIndex = ids[idIndex];
		if(currentIndex == null) {
			break;
		}

		var nodeIndex = 0;
		var child = node.firstChild;

		while(child) {
			if(nodeIndex == currentIndex) {
				node = child;
				break;
			}
			nodeIndex++;
			child = child.nextSibling;
		}

		idIndex++;
		node = child;
	}

	return node;
};

/**
 * @function can-worker/dom-id.getNode getNode
 * @parent can-worker/dom-id
 *
 * Get the Node for a particular id.
 *
 * @param {String} id
 * @param {HTMLHtmlElement} [root] The root element to start with in the search
 * for a DOM node.
 * @return {Node} dom element matching the id.
 */
exports.getNode = function(id, root){
	var node;

	node = nodeCache[id];
	if(node) {
		return node;
	}

	// Find the node with traversal
	node = findNode(id, root);
	cache(node, {id:id});

	return node;
};

/**
 * @function can-worker/dom-id.purgeID purgeID
 * @parent can-worker/dom-id
 *
 * Remove caching associated with an id.
 */
exports.purgeID = function(id){
	var node = nodeCache[id];
	if(node) {
		delete node.__routeInfo;
		delete nodeCache[id];
	}
};

exports.purgeSiblings = function(node){
	var routeInfo = getCachedInfo(node);
	var parentRouteInfo = getCachedInfo(node.parentNode);
	if(parentRouteInfo) {
		var parentBranch = parentRouteInfo.branch;
		var index = getIndex(routeInfo.id);
		var staleBranch = false;
		parentBranch.forEach(function(branch, i){
			if(i > index) {
				// This branch is stale, remove it.
				staleBranch = true;
				return false;
			}
		});
		if(staleBranch) {
			parentBranch.length = 0;
			parentBranch[index] = routeInfo.branch;
		}
	}
};
