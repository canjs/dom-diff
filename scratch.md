dom-diff
---------
* diff
* patch
* dom-id (route strings)



can-worker -> worker-rendering
----------

__window__
* receives worker message
  * apply diff
* send DOM events to worker

__worker__
* DOM overrides (appendChild, nodeValue, etc)
  * send diffs to window
* receive events from window
  * recreate event and trigger in vdom






var diff = require("dom-diff"):

diff(document.documentElement, function(patches){

    var msg = serialize(patches);
    postMessage(msg);

});




var render = require("worker-rendering");

var worker = new Worker(...);

render(worker);
