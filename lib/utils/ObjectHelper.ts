export class object = {
    static merge = (src, dst) => {
		var differs = false;
		object.forEachKey(src, function(key, val) {
			var dstVal = dst[key];
			if (typeof dstVal == "undefined")
				dst[key] = val;
			else
			if (val != dstVal && !helpers.areEqual(val, dstVal))
				differs = true;
		});
		return differs;
	}

    static forEachKey = (object, body) => {
		for (var key in object)
			if (object.has(object, key))
				body(key, object[key]);
	}

    static extend = (src, ext, override, deep) => {
		src = src || {};
		object.forEachKey(ext, function(key, val) {
			if (deep && typeof src[key] === "object" && src[key] !== null) {
				src[key] = src[key] || {};
				object.extend(src[key], val, override, deep);
			} else
			if (src[key] == null || override) {
				src[key] = val;
			}
		});
		return src;
	}

    static has = (obj, key) => {
		return Object.prototype.hasOwnProperty.call(obj, key);
	}
    
	static areEqual = (obj1, obj2) => {
		if (obj1 == obj2)
			return true;
		if (obj1 == null || obj2 == null)
			return false;
		if (Array.isArray(obj1) && Array.isArray(obj2)) {
			if (obj1.length != obj2.length)
				return false;
			for (var i = 0; i < obj1.length; i++)
				if (!object.areEqual(obj1[i], obj2[i]))
					return false;
			return true;
		}

		if (typeof obj1 != "object" || typeof obj2 != "object")
			return false;
		//var combined = $.extend({}, obj1, obj2);
		var combined = object.extend({}, obj1);
		object.extend(combined, obj2);
		for (var i in combined) {
			if (object.has(combined, i)) {
				var val1 = obj1[i];
				var val2 = obj2[i];
				if (!object.areEqual(val1, val2))
					return false;
			}
		}
		return true;
	}
}