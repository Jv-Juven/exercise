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
export default Dep;