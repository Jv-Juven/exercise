import Dep from './dep';
import {
    isObject,
    def,
    isArray
} from 'utils';
export const defineReactive = function (obj, key, val) {
    let dep = new Dep();
    // 对象递归添加观察者和收集依赖
    let childOb = observe(val);
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get() {
            // 收集依赖
            if (Dep.target) {
                dep.depend();
                if (childOb) {
                    childOb.dep.depend();
                }
            }
            return val;
        },
        set(value) {
            if (value === val) {
                return;
            }
            val = value;
            // 对新增的子对象添加观察者和收集依赖
            childOb = observe(value);
            // 值变动通知
            dep.notify();
        }
    });
    return obj;
};
export const observe = function (val) {
    // 是否为对象或者数组
    if (!isObject(val) && !isArray(val)) {
        return;
    }
    let ob;
    if (isObject(val) && val.__ob__) {
        ob = val.__ob__;
    }
    if (isObject(val)) {
        ob = new Observer(val);
    }
    return ob;
}
export class Observer {
    // value为对象
    constructor(value) {
        this.value = value;
        this.dep = new Dep();
        def(value, '__ob__', this);
        this.walk(value);
    }
    walk(obj) {
        let keys = Object.keys(obj);
        for (var i = 0, l = keys.length; i < l; i++) {
            this.convert(keys[i], obj[keys[i]]);
        }
    }
    convert(key, value) {
        return defineReactive(this.value, key, value);
    }
}
