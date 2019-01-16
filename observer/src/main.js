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
} from 'lib/watcher';
import { isBrowser, isMpwx } from 'lib/platform';
const loop = function() {};
/**
 * @param {Object} options
 *      - pageInstance 当前页面实例
 */
var V = function () {
    // this._options = {
    //     data: this.data,
    //     computed: this.computed,
    //     watch: this.watch
    // }
    // data求值
    if (typeof this.data === 'function') {
        this._data = this.data();
    } else {
        this._data = this.data;
    }
    // this._computed = this.computed || {};
    // this._watch = this.watch || {};
    this._proxy(this.data);
    observe(this.data);
    this._initComputed();
    this._initWatch();
}
// 代理属性
V.prototype._proxy = function (data) {
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
                if (isMpwx) {
                    return this.data[key];
                } 
                if (isBrowser) {
                    return this._data[key];
                }
            },
            set: function (value) {
                // 小程序
                if (isMpwx) {
                    this.setData({
                        [key]: value
                    });
                }
                // web
                if (isBrowser) {
                    this._data[key] = value;
                }
            }
        });
    });
}
// 初始化computed属性
V.prototype._initComputed = function () {
    let computed = this.computed;
    let self = this;
    let keys = Object.keys(computed);
    keys.forEach((key) => {
        let getter;
        let setter;
        // computed求值函数
        let attrVal = computed[key];
        // 是否有重复的key
        if (checkRepeat(key)) {
            return;
        }
        // 对象形式处理
        if (isObject(attrVal)) {
            getter = attrVal.get;
            setter = attrVal.set;
        }
        // 函数形式处理
        if (isType(attrVal, 'function')) {
            getter = attrVal;
            setter = loop;
        }
        (function () {
            // 闭包缓存的值
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
                    if (isMpwx) {
                        this.setData({
                            [key]: value
                        });
                    }
                    val = setter ? setter.call(self, value) : null;
                    return val;
                }
            });
            new Watcher(self, getter, function (value) {
                console.warn('watcher更新', value);
                // val = value;
                // self[key] = value;
                this.setData({
                    [key]: value
                });
            });
        })();
    });
}
V.prototype._initWatch = function() {
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
const hack = function (pageInstance) {
    return V.call(pageInstance);
};
if (window) {
    window.hack = hack;
}

// module.exports = hack;
