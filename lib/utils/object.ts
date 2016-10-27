export class helper {
    static merge (src, dst) {
		var differs = false;
		helper.forEachKey(src, function(key, val) {
			var dstVal = dst[key];
			if (typeof dstVal == "undefined")
				dst[key] = val;
			else
			if (val != dstVal && !helper.areEqual(val, dstVal))
				differs = true;
		});
		return differs;
	}

	static clone (obj, deep?) {
		if (!obj || typeof obj != "object")
			return obj;
		if (obj instanceof Date)
			return obj;
		var clone;
		//if (obj instanceof Array) {
		if (Array.isArray(obj)) {
			clone = [];
			for (var i = 0; i < obj.length; i++)
				clone.push(deep ? helper.clone(obj[i], deep) : obj[i]);
			return clone;
		}
		clone = {};
		helper.forEachKey(obj, function(key, val) {
			clone[key] = deep ? helper.clone(val, deep) : val;
		});
		return clone;
	}

    static forEachKey (object, body) {
		for (var key in object)
			if (helper.has(object, key))
				body(key, object[key]);
	}

    static extend (src, ext, override?, deep?) {
		src = src || {};
		helper.forEachKey(ext, function(key, val) {
			if (deep && typeof src[key] === "object" && src[key] !== null) {
				src[key] = src[key] || {};
				helper.extend(src[key], val, override, deep);
			} else
			if (src[key] == null || override) {
				src[key] = val;
			}
		});
		return src;
	}

    static has (obj, key) {
		return Object.prototype.hasOwnProperty.call(obj, key);
	}
    
	static areEqual (obj1, obj2) {
		if (obj1 == obj2)
			return true;
		if (obj1 == null || obj2 == null)
			return false;
		if (Array.isArray(obj1) && Array.isArray(obj2)) {
			if (obj1.length != obj2.length)
				return false;
			for (var i = 0; i < obj1.length; i++)
				if (!helper.areEqual(obj1[i], obj2[i]))
					return false;
			return true;
		}

		if (typeof obj1 != "object" || typeof obj2 != "object")
			return false;
		//var combined = $.extend({}, obj1, obj2);
		var combined = helper.extend({}, obj1);
		helper.extend(combined, obj2);
		for (let i in combined) {
			if (helper.has(combined, i)) {
				var val1 = obj1[i];
				var val2 = obj2[i];
				if (!helper.areEqual(val1, val2))
					return false;
			}
		}
		return true;
	}
}

