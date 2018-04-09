import alias from 'rollup-plugin-alias';
import path from 'path';
let resolve = function (fileName) {
    return path.resolve(__dirname, fileName);
}
export default {
    input: 'src/main.js',
    output: {
        file: 'dist/ob.js',
        format: 'cjs'
    },
    watch: {
        include: ['src/**', './rollup.config.js']
    },
    plugins: [
        alias({
            utils: resolve('src/utils/index'),
            lib: resolve('src/lib')
        })
    ]
};