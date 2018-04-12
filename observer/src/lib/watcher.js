import {
    isType
} from 'utils';
import Dep from './dep';
let uid = 0;
import {
    isObject
} from 'utils';
export class Watcher {
    // expOrFn 暂时为函数
    constructor(vm, expOrFn, cb, options) {
        if (isObject(options)) {
            Object.assign(this, options);
        }
        this.depIds = [];
        this.id = uid++;
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