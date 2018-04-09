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
}

class Dep {
    constructor() {
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
        console.warn('watacher', Dep.target);
        this.subs.push(Dep.target);
        console.warn('subs', this.subs);
    }
}
// 依赖收集桥梁，全局唯一，同一时刻只有一个watcher会赋值，随之会通知dep实例收集依赖
Dep.target = null;

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
    if (isObject(val)) {
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

class Watcher {
    // expOrFn 暂时为函数
    constructor(vm, expOrFn, cb) {
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
            this.cb.call(this.vm, this.get(), this.oldValue);
        }
    }
}

const loop = function() {};
/**
 * @param {Object} options
 *      - pageInstance 当前页面实例
 */
class V {
    constructor(options) {
        this._options = options;
        if (typeof options.data === 'function') {
            this._data = options.data();
        } else {
            this._data = options.data;
        }
        this._computed = options.computed || {};
        this._proxy(this._data);
        observe(this._data);
        this._initComputed();
    }
    // 代理属性
    _proxy (data) {
        if (!isObject(data)) {
            console.warn('data选项不是对象或者返回对象的函数');
            return;
        }
        let keys = Object.keys(data);
        keys.forEach((key) => {
            Object.defineProperty(this, key, {
                configurable: true,
                enumerable: true,
                get: function() {
                    return this._data[key];
                },
                set: function (value) {
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
                        val = setter ? setter.call(self, value) : null;
                        return val;
                    }
                });
                new Watcher(self, getter, function (value) {
                    console.warn('计算属性更新', value);
                    val = value;
                });
            })();
        });
    }
}
window.V = V;
