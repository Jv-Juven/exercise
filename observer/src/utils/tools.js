// 是否为对象
export const isObject = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
};
// 是否为数组
export const isArray = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
};
// 是否为指定类型
export const isType = function (value, type) {
    type = type.replace(/^\w/, letter => letter.toUpperCase());
    return Object.prototype.toString.call(value) === `[object ${type}]`;
}
// 给对象定义属性
export function def(obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
        value: val,
        enumerable: !!enumerable,
        writable: true,
        configurable: true
    })
};
// 检查是否有重复属性
export function checkRepeat(context, attr) {
    if (context[attr]) {
        console.warn(`${attr}已存在`);
    }
};
