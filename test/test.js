var diff = require("dom-diff/diff");
var Patch = require("dom-diff/types/patch");
var NodeProp = require("dom-diff/types/node_prop");
var serialize = require("dom-diff/serialize");
var apply = require("dom-diff/patch");
var QUnit = require("steal-qunit");

QUnit.module("dom-diff");

QUnit.test("basics works", function(){
	var a = document.createElement("div");
	var b = document.createElement("div");

	b.appendChild(document.createElement("span"));
	b.setAttribute("foo", "bar");

	var patches = diff(a, b);

	QUnit.ok(patches, "we got patches back");
	QUnit.equal(patches[0][0].type, Patch.ATTRS, "attributes");
	QUnit.equal(patches[0][1].type, Patch.INSERT, "inserting a span");
});

QUnit.test("can be serialized", function(){
	var a = document.createElement("div");
	var b = document.createElement("div");

	var span = document.createElement("span");
	span.appendChild(document.createTextNode("hello"));
	b.appendChild(span);

	var patches = diff(a, b);
	var w = serialize(patches);

	QUnit.equal(w[0][2][NodeProp.NODE_NAME], "SPAN", "span included");
	QUnit.equal(w[0][2][NodeProp.CHILD_NODES][0][NodeProp.TEXT], "hello", "Text node included");
});

QUnit.test("can be patched", function(){
	var a = document.createElement("div");
	var b = document.createElement("div");

	var span = document.createElement("span");
	span.appendChild(document.createTextNode("hello"));
	b.appendChild(span);

	var patches = diff(a, b);
	var w = serialize(patches);

	apply(a, w);

	QUnit.equal(a.childNodes.length, 1, "there is one child");
	QUnit.equal(a.childNodes[0].nodeName, "SPAN", "child is a span");
	QUnit.equal(a.childNodes[0].childNodes[0].nodeValue, "hello", "got the text node too");
});
