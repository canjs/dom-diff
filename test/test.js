var diff = require("dom-diff/diff");
var Patch = require("dom-diff/types/patch");
var NodeProp = require("dom-diff/types/node_prop");
var serialize = require("dom-diff/serialize");
var sserialize = require("dom-diff/sserialize");
var deserialize = require("dom-diff/ddeserialize");
var apply = require("dom-diff/patch");
var QUnit = require("steal-qunit");

var applyp = require("dom-diff/apatch");

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

QUnit.module("serialize")

QUnit.test("handles complex changes", function(){
	var a = document.createElement("div");
	var b = document.createElement("div");

	a.innerHTML = b.innerHTML = "<div><ul><li id='1'></li><li id='2'></li></ul></div>";

	// Insert a li before 1 and 2
	var ul = b.firstChild.firstChild;
	var secondLi = ul.firstChild.nextSibling;
	var newLi = document.createElement("li");
	newLi.id = "3";
	ul.insertBefore(newLi, secondLi);

	// Add a span inside of secondLi
	secondLi.appendChild(document.createElement("span"));


	var patches = diff(a, b);
	var w = sserialize(patches);

	var d = deserialize(w);

	QUnit.equal(Array.isArray(d[2]), true, "first is an array");
	QUnit.equal(typeof d[4], "object", "second is an object");

	// Make sure they are equivalent
	QUnit.equal(patches[4].patch.nodeName, d[4].patch.nodeName, "the span");
	QUnit.equal(patches[2][0].type, d[2][0].type, "same type");
	QUnit.equal(patches[2][0].patch.nodeName, d[2][0].patch.nodeName, "the li");
	QUnit.equal(patches[2][1].node.nodeName, d[2][1].node.nodeName, "the ul");
	QUnit.equal(patches[2][1].type, d[2][1].type, "same type");
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

	apply(a, w, { root: a });

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

QUnit.test("lists works", function(){
	var a = document.createElement("ul");
	var b = document.createElement("ul");

	var li;
	for(var i = 0; i < 10; i++) {
		li = document.createElement("li");
		li.id = "item-" + i;
		a.appendChild(li);
	}

	for(var i = 0; i < 10; i++) {
		li = document.createElement("li");
		li.id = "item-" + i;
		b.appendChild(li);
	}

	var patches = diff(a, b);
	var w = serialize(patches);

	QUnit.equal(w.length, 0, "No differences to start");

	var three = b.childNodes[3];
	li = document.createElement("li");
	li.id = "item-11";
	b.insertBefore(li, three);

	var patches = diff(a, b);

	applyp(a, patches);
});
