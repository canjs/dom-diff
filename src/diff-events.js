
module.exports = diffEvents;

function diffEvents(a, b){
	var aEvents = a.__events || {};
	var bEvents = b.__events || {};

	var diffEvents = [[], []];
	for(var e in bEvents){
		if(!aEvents[e]) {
			diffEvents[0].push(e);
		}
	}

	for(var e in aEvents) {
		if(!bEvents[e]) {
			diffEvents[1].push(e);
		}
	}
	return diffEvents;
}
