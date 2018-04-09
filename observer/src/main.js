import {
    isObject,
    isType
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
    constructor(options) {
        this._options = options
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
