var isObject = require("is-object");

var forEach = [].forEach;

module.exports = diffProps;

function diffProps(a, b) {
    var diff

	forEach.call(a.attributes, function(aAttr){
		var aAttrName = aAttr.name;

    //for (var aKey in a) {
        if (!b.getAttribute(aAttrName)) {
            diff = diff || []
			diff.push({name:aAttrName,value:undefined});
        }

        var aValue = a[aAttrName]
        var bValue = b[aAttrName]

        if (aValue === bValue) {
            //continue
        } else if (isObject(aValue) && isObject(bValue)) {
            if (getPrototype(bValue) !== getPrototype(aValue)) {
                diff = diff || []
				diff.push({name:aAttrName,value:bValue});
            } else if (isHook(bValue)) {
                 diff = diff || []
				 diff.push({name:aAttrName,value:bValue});
            } else {
                var objectDiff = diffProps(aValue, bValue)
                if (objectDiff) {
                    diff = diff || []
					diff.push({name:aAttrName,value:objectDiff});
                }
            }
        } else {
            diff = diff || [];
			diff.push({name:aKey,value:bValue});
        }
    });

	forEach.call(b.attributes, function(bAttr){
		var bAttrName = bAttr.name;

		if(!a.getAttribute(bAttrName)) {
			diff = diff || [];
			diff.push({name:bAttrName,value:bAttr.value});
		}
    });

    return diff;
}

function getPrototype(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}
