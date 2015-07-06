var version = require("./version")

Patch.NONE = 0
Patch.TEXT = 1
Patch.NODE = 2
Patch.WIDGET = 3
Patch.PROPS = Patch.ATTRS = 4
Patch.ORDER = 5
Patch.INSERT = 6
Patch.REMOVE = 7
Patch.THUNK = 8
Patch.ADD_EVENT = 9
Patch.REMOVE_EVENT = 10

module.exports = Patch;

function Patch(type, node, patch) {
    this.type = Number(type);
    this.node = node;
    this.patch = patch;
}

Patch.prototype.version = version;
Patch.prototype.type = "Patch";
