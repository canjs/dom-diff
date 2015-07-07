
module.exports = applyAttributes;

function applyAttributes(node, attributes) {
	var i = 0, len = attributes.length, attr;

	for(; i < len; i++) {
		attr = attributes[i];
		node.setAttribute(attr.name, attr.value);
	}
}
