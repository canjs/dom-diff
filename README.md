# dom-diff

Creates diffs of DOM or a virtual DOM that looks like the real DOM.

## Installation

```
npm install dom-diff --save
```

## Usage

```js
var diff = require("dom-diff/diff");
var apply = require("dom-diff/patch");

var a = document.createElement("div");
var b = document.createElement("div");

b.appendChild(document.createElement("span"));

var patches = diff(a, b);
apply(a, patches);
```

## Modules

### dom-diff/diff

```
diff(Element, Element) -> patches
```

Given two elements, diffs them and returns an object containing patches.

### dom-diff/patch

```
patch(Element, patches)
```

Given an element and a set of patches, the patches will be applied to the element.

### dom-diff/serialize

```
serialize(patches) -> serializedPatches
```

Given a `patches` object will serialize it into a plain object that can be sent across WebWorker boundaries. You can further serialize this object to JSON if you need to send it across the network.

## License

MIT
