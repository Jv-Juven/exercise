// 处理数组变动重写数组方法，并触发数组更新
import {
    def
} from 'utils';
var arrayProto = Array.prototype;
export const arrayMethods = Object.create(arrayProto);
;[
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
].forEach((method) => {
    let original = arrayProto[method];
    def(arrayMethods, method, function (...args) {
        let ob = this.__ob__;
        let result = original.apply(this, args);
        let inserted;
        switch(method) {
            case 'push':
                inserted = args[0];
                break;
            case 'unshift':
                inserted = args[0];
                break;
            case 'splice':
                inserted = args.slice(2);
                break;
        }
        if (inserted) ob.observeArray(inserted);
        ob.dep.notify();
        return result;
    }, true);
});
// 以下是复制vuejs 1.0.28 的代码
/**
 * Swap the element at the given index with a new value
 * and emits corresponding event.
 *
 * @param {Number} index
 * @param {*} val
 * @return {*} - replaced element
 */

def(
    arrayProto,
    '$set',
    function $set(index, val) {
        if (index >= this.length) {
            this.length = Number(index) + 1
        }
        return this.splice(index, 1, val)[0]
    }
)

/**
 * Convenience method to remove the element at given index or target element reference.
 *
 * @param {*} item
 */

def(
    arrayProto,
    '$remove',
    function $remove(item) {
        /* istanbul ignore if */
        if (!this.length) return
        var index = indexOf(this, item)
        if (index > -1) {
            return this.splice(index, 1)
        }
    }
)
