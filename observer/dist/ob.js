'use strict';

// 是否为对象
const isObject = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
};
// 是否为数组
const isArray = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
};
// 是否为指定类型
const isType = function (value, type) {
    type = type.replace(/^\w/, letter => letter.toUpperCase());
    return Object.prototype.toString.call(value) === `[object ${type}]`;
};
// 给对象定义属性
function def(obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
        value: val,
        enumerable: !!enumerable,
        writable: true,
        configurable: true
    });
}// 检查是否有重复属性
function checkRepeat(context, attr) {
    if (context[attr]) {
        console.warn(`${attr}已存在`);
    }
}

let uid = 0;
class Dep {
    constructor() {
        // 唯一标识
        this.id = uid++;
        // 订阅者列表
        this.subs = [];
    }
    // 通知watchers更新
    notify() {
        console.log('notify');
        for (let i = 0, l = this.subs.length; i < l; i++) {
            this.subs[i].update();
        }
    }
    // 收集依赖
    depend() {
        // console.warn('watacher', Dep.target);
        Dep.target.addDep(this);
        // this.subs.push(Dep.target);
        // console.warn('subs', this.subs);
    }
    // 添加订阅者
    addSub(sub) {
        this.subs.push(sub);
    }
}
// 依赖收集桥梁，全局唯一，同一时刻只有一个watcher会赋值，随之会通知dep实例收集依赖
Dep.target = null;

// 处理数组变动重写数组方法，并触发数组更新
var arrayProto = Array.prototype;
const arrayMethods = Object.create(arrayProto);
[
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
            this.length = Number(index) + 1;
        }
        return this.splice(index, 1, val)[0]
    }
);

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
        var index = indexOf(this, item);
        if (index > -1) {
            return this.splice(index, 1)
        }
    }
);

// const arrayKeys = Object.getOwnPropertyNames(arrayMethods);
// console.warn('arrayMethods', arrayMethods);
const defineReactive = function (obj, key, val) {
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
const observe = function (val) {
    // 是否为对象或者数组
    if (!isObject(val) && !isArray(val)) {
        return;
    }
    let ob;
    if (isObject(val) && val.__ob__) {
        ob = val.__ob__;
    }
    if (isObject(val) || isArray(val)) {
        ob = new Observer(val);
    }
    return ob;
};
class Observer {
    // value为对象
    constructor(value) {
        this.value = value;
        this.dep = new Dep();
        def(value, '__ob__', this);
        if (isArray(value)) {
            copyArguments(value, arrayMethods);
            this.observeArray(value);
        } else {
            this.walk(value);
        }
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
    observeArray(arr) {
        // console.log('arr', arr);
        arr.forEach((item) => {
            observe(item);
        });
    }
}
const copyArguments = function (target, src) {
    // let keys = arrayKeys;
    let keys = Object.keys(src);
    // console.warn('keys', keys);
    for (let i = 0, l = keys.length; i < l; i++) {
        let key = keys[i];
        target[key] = src[key];
    }
};

let uid$1 = 0;
class Watcher {
    // expOrFn 暂时为函数
    constructor(vm, expOrFn, cb, options) {
        if (isObject(options)) {
            Object.assign(this, options);
        }
        this.depIds = [];
        this.id = uid$1++;
        this.oldValue = null;
        this.cb = cb;
        this.vm = vm;
        this.expOrFn = isType(expOrFn, 'function') ? expOrFn : function() {};
        this.value = this.get();
    }
    // 获取目标对象的值
    get() {
        let value;
        // 现将watcher实例放在全局唯一通道中
        Dep.target = this;
        // 获取值
        value = this.expOrFn.call(this.vm);
        if (this.value === value) {
            return value;
        } else {
            this.oldValue = this.value;
            this.value = value;
        }
        Dep.target = null;
        return value;
    }
    // 更新函数
    update() {
        if (isType(this.cb, 'function')) {
            // if (this.user && this.oldValue === this.value) {
            //     return;
            // }
            this.cb.call(this.vm, this.get(), this.oldValue);
        }
    }
    // 添加观察者
    addDep(dep) {
        let depId = dep.id;
        if (this.depIds.indexOf(depId) > -1) {
            return;
        }
        dep.addSub(this);
        this.depIds.push(depId);
    }
}

const loop = function() {};
/**
 * @param {Object} options
 *      - pageInstance 当前页面实例
 */
class V {
    constructor(pageInstance) {
        this._options = {
            data: pageInstance.data,
            computed: pageInstance.computed,
            watch: pageInstance.watch
        };
        this.pageInstance = pageInstance;
        if (typeof this._options.data === 'function') {
            this._data = this._options.data();
        } else {
            this._data = this._options.data;
        }
        this._computed = this._options.computed || {};
        this._watch = this._options.watch || {};
        this._proxy(this._data);
        observe(this._data);
        this._initComputed();
        this._initWatch();
    }
    // 代理属性
    _proxy (data) {
        if (!isObject(data)) {
            console.warn('data选项不是对象或者返回对象的函数');
            return;
        }
        let keys = Object.keys(data);
        keys.forEach((key) => {
            if (checkRepeat(key)) {
                return;
            }
            Object.defineProperty(this, key, {
                configurable: true,
                enumerable: true,
                get: function() {
                    return this._data[key];
                },
                set: function (value) {
                    // 小程序
                    // this.pageInstance.setData({
                    //     [key]: value
                    // });
                    this._data[key] = value;
                }
            });
        });
    }
    // 初始化computed属性
    _initComputed () {
        let computed = this._computed;
        let self = this;
        let keys = Object.keys(computed);
        keys.forEach((key) => {
            let getter;
            let setter;
            let attrVal = computed[key];
            if (checkRepeat(key)) {
                return;
            }
            if (isObject(attrVal)) {
                getter = attrVal.get;
                setter = attrVal.set;
            }
            if (isType(attrVal, 'function')) {
                getter = attrVal;
                setter = loop;
            }
            (function () {
                let val = getter.call(self) || '';
                Object.defineProperty(self, key, {
                    configurable: true,
                    enumerable: true,
                    get: function () {
                        return val;
                    },
                    set: function (value) {
                        if (val === value) {
                            return;
                        }
                        // 小程序
                        // this.pageInstance.setData({
                        //     [key]: value
                        // });
                        val = setter ? setter.call(self, value) : null;
                        return val;
                    }
                });
                new Watcher(self, getter, function (value) {
                    console.warn('watcher更新', value);
                    // val = value;
                    self[key] = value;
                });
            })();
        });
    }
    _initWatch() {
        let watch = this._watch || {};
        let self = this;
        let keys = Object.keys(watch);
        keys.forEach((key) => {
            let callback;
            let getter = function () {
                return this[key];
            };
            let attrVal = watch[key];
            if (checkRepeat(key)) {
                return;
            }
            if (isObject(attrVal)) {
                callback = attrVal.handler || noop;
            }
            if (isType(attrVal, 'function')) {
                callback = attrVal;
            }
            new Watcher(self, getter, callback, {
                user: true
            });
        });
    }
}
if (window.module && module.exports) {
    module.exports = function (pageInstance) {
        new V(pageInstance);
    };
} else {
    window.V = V;
}
