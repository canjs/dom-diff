var diff = require("dom-diff/diff");
var Patch = require("dom-diff/types/patch");
var NodeProp = require("dom-diff/types/node_prop");
var serialize = require("dom-diff/serialize");
var apply = require("dom-diff/patch");
var QUnit = require("steal-qunit");

QUnit.module("diffing");

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

QUnit.module("patching");

function triggerClick(el){
	var clickEvent = document.createEvent("Event");
	clickEvent.initEvent("click", true, true);
	el.dispatchEvent(clickEvent);
}

QUnit.test("works", function(){
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

QUnit.test("attributes and events as well", function(){
	var a = document.createElement("div");
	var b = document.createElement("div");

	var span = document.createElement("span");
	b.__events = {click:true};
	span.__events = {click:true};
	b.appendChild(span);
	b.setAttribute("foo", "bar");

	var patches = diff(a, b);
	var w = serialize(patches);

	var numOfEvents = 0;

	var patchOptions = {
		eventHandler: function(){
			numOfEvents++;
			QUnit.ok(true, "Event was added");
		},
		root: a
	};

	apply(a, w, patchOptions);

	triggerClick(a.childNodes[0]);
	triggerClick(a);

	// Attributes
	QUnit.equal(a.getAttribute("foo"), "bar", "Attribute was added");

	// Events
	QUnit.equal(numOfEvents, 2, "There were 2 events");
});

QUnit.test("events are removed", function(){
	QUnit.expect(0);

	var a = document.createElement("div");
	var b = document.createElement("div");
	b.__events = {click:true};

	// Let's add an event
	var patchOptions = {
		eventHandler: function(){
			QUnit.ok(false, "Event should have been removed");
		},
		root: a
	};

	var patches = diff(a, b);
	var w = serialize(patches);

	apply(a, w, patchOptions);

	// Now let's remove the event.
	delete b.__events;

	patches = diff(a, b);
	w = serialize(patches);

	apply(a, w, patchOptions);

	triggerClick(a);
});
