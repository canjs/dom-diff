
module.exports = forEach;

function forEach(fn){
	var indices = patchIndices(this);
	for(var i = 0, len = indices.length; i < len; i++) {
		var index = indices[i];
		fn(this[index]);
	}
}

function patchIndices(patches) {
	var indices = [];

	for (var key in patches) {
		if (key !== "a") {
			indices.push(Number(key));
		}
	}

	return indices;
}

