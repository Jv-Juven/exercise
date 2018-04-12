import {
    isObject,
    isType,
    checkRepeat
} from 'utils';
import {
    observe
} from 'lib/observer';
import {
    Watcher
} from 'lib/watcher'
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
        }
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
            }
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
    }
} else {
    window.V = V;
}
