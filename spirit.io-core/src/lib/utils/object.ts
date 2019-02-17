/* tslint:disable:no-parameter-reassignment */
export class helper {
    public static merge(src, dst) {
        let differs = false;
        helper.forEachKey(src, (key, val) => {
            const dstVal = dst[key];
            if (typeof dstVal === 'undefined') {
                dst[key] = val;
            } else if (val !== dstVal && !helper.areEqual(val, dstVal)) {
                differs = true;
            }
        });
        return differs;
    }

    public static clone(obj, deep?) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof Date) {
            return obj;
        }
        let clone;
        // if (obj instanceof Array) {
        if (Array.isArray(obj)) {
            clone = [];
            for (const o of obj) {
                clone.push(deep ? helper.clone(o, deep) : o);
            }
            return clone;
        }
        clone = {};
        helper.forEachKey(obj, (key, val) => {
            clone[key] = deep ? helper.clone(val, deep) : val;
        });
        return clone;
    }

    public static forEachKey(object, body) {
        for (const key in object) {
            if (helper.has(object, key)) {
                body(key, object[key]);
            }
        }
    }

    public static extend(src, ext, override?, deep?) {
        src = src || {};
        helper.forEachKey(ext, (key, val) => {
            if (deep && typeof src[key] === 'object' && src[key] !== null) {
                src[key] = src[key] || {};
                helper.extend(src[key], val, override, deep);
            } else if (src[key] == null || override) {
                src[key] = val;
            }
        });
        return src;
    }

    public static has(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }

    public static areEqual(obj1, obj2) {
        if (obj1 === obj2) {
            return true;
        }
        if (obj1 == null || obj2 == null) {
            return false;
        }
        if (Array.isArray(obj1) && Array.isArray(obj2)) {
            if (obj1.length !== obj2.length) {
                return false;
            }
            for (let i = 0; i < obj1.length; i++) {
                if (!helper.areEqual(obj1[i], obj2[i])) {
                    return false;
                }
            }
            return true;
        }

        if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
            return false;
        }
        // var combined = $.extend({}, obj1, obj2);
        const combined = helper.extend({}, obj1);
        helper.extend(combined, obj2);
        for (const i in combined) {
            if (helper.has(combined, i)) {
                const val1 = obj1[i];
                const val2 = obj2[i];
                if (!helper.areEqual(val1, val2)) {
                    return false;
                }
            }
        }
        return true;
    }
}
