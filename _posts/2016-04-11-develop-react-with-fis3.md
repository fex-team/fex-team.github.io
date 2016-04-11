---
layout: post
title: '如何用 fis3 来开发 React?'
author: 2betop
shortname: develop-react-with-fis3
---

当下 [react](https://facebook.github.io/react/) + [redux](http://redux.js.org/) + es6 + node_modules 的技术选型非常流行，相信有不少同学都想去尝试，然后 webpack 并不是唯一的选择，用 fis 一样也能支持得很好，你依然可以继续使用 fis 的资源定位、cnd 部署、资源加 md5 戳和 css 雪碧图等其他实用的功能。为了节省大家的摸索成本，那么让我来详细的介绍下 fis 是如何去支持这些技术选型的。

开始之前，可以先体验下这个 [DEMO](https://github.com/fis-scaffold/react-redux-todo-npm)。这是一个基于  [react](https://facebook.github.io/react/) 和 [redux](http://redux.js.org/) 采用 npm 作为组件生态，modules 模块目录全部采用 es6 + jsx 语法编写的 Todo App，是 React + redux 入门的绝佳例子。

其实要支持这种技术选型非常简单，加上如下配置到 fis-conf.js 即可。（请注意看注释）

第一步：配置支持 es6 和 jsx 语法。

```js
// 让 modules 目录下面的 js 和 jsx 通过 typescript
fis.match('{/modules/**.js,*.jsx}', {
  // 要支持 es6 和 jsx， typescript 也能胜任，最主要是编译速度要快很多。
  parser: fis.plugin('typescript'),

  // typescript 就是编译速度会很快，但是对一些 es7 的语法不支持，如果你觉得不爽，可以用 babel 来解决。用以下内容换掉 typescript 的parser配置就好了。
  // parser: fis.plugin('babel-5.x', {
  //     sourceMaps: true,
  //     optional: ["es7.decorators", "es7.classProperties"]
  // }),
  rExt: '.js'
});
```

第二步：配置支持 npm 模块查找

```js
fis.unhook('components'); // fis3 中预设的是 fis-components，这里不需要，所以先关了。
fis.hook('node_modules'); // 使用 fis3-hook-node_modules 插件。
```

第三步：页面中引入 [mod.js](https://github.com/fex-team/mod/blob/master/mod.js)，标记目标模块化文件，启用 loader 插件，然后就可以随意 `import` 模块了。

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Redux TodoMVC example</title>
    <link rel="stylesheet" type="text/css" href="/static/index.css" />
    <script type="text/javascript" src="./static/mod.js"></script>
  </head>
  <body>
    <div class="todoapp" id="root">
    </div>
    <script type="text/javascript">
      // 注意看 fis-conf.js 中 commonjs 的配置，已经把 /modules 目录放入 baseUrl 中，所以可以直接找到 ./modules/index.jsx
      require(['./index'])
    </script>
  </body>
</html>
```

```js
// 设置成是模块化 js, 编译后会被 define 包裹。
fis.match('/{node_modules,modules}/**.{js,jsx}', {
  isMod: true
});

fis.match('::package', {
  // 本项目为纯前段项目，所以用 loader 编译期加载，
  // 如果用后端运行时框架，请不要使用。
  postpackager: fis.plugin('loader', {
    useInlineMap: true
  })
});
```

到此，已经可以快速的开发项目了，如果你想对细节更多了解，请接着往下看。

要去支持这种技术方案，其实只需要处理好这几块即可。

* es6 编译
* 模块化
* 生态
* 资源合并

## [ES6](https://github.com/lukehoban/es6features) (ES Next)

[ES6](https://github.com/lukehoban/es6features) 其实就是种新的 JS 语法，现在浏览器还不能直接运行。但是可以通过编译工具把 [ES6](https://github.com/lukehoban/es6features) 编译成 ES5 后再运行的，这样基本上可以兼容到 IE 8+ 了。目前 fis 中有两款 parser 插件能很好的胜任此工作。

* [fis-parser-babel-5.x](https://github.com/fex-team/fis-parser-babel-5.x)
* [fis-parser-typescript](https://github.com/fex-team/fis3-parser-typescript)

这两款编译插件产出总体来说差不多, 在细节上有些细微的区别。[babel](http://babeljs.io/) 相对官方点，有很多 [ES7](https://github.com/hemanth/es7-features) 的语法也都支持。[typescript](http://www.typescriptlang.org/) 也同样支持 [ES6](https://github.com/lukehoban/es6features) 和 jsx 语法，同是还支持自己的一些[语法](http://www.typescriptlang.org/docs/tutorial.html)，而且编译速度比 babel 要快很多，但是有个小问题就是对于 [ES7](https://github.com/hemanth/es7-features) 的一些新语法跟进得相对要慢，比如 [Object rest & spread properties](https://github.com/Microsoft/TypeScript/issues/4928)。

想要使用 es6 语法，只需要选择其中一个插件即可。比如使用 babel 的话，直接加上如下配置项就能编写 es6/jsx 了。

```js
// 后缀为 jsx 的文件和 /modules 目录下面的 js 文件
// 采用 babel 编译成 js 后缀的文件
fis.match('{*.jsx,/modules/**.js}', {
  rExt: '.js', // 产出后缀为 js
  parser: fis.plugin('babel-5.x', {
    sourceMap: true // 产出源码表，方便调试。
  })
})
```

## 模块化

很多人都很好奇 fis 是如何支持 `import` 模块化的，其实内部并没有特殊处理，还是原来的模块化方案，因为 `import` 在经过 parser 阶段后已经变成了 `require` 语句，所以 es6 的模块化机制在 fis 中直接就能使用。

如：

```js
import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import App from './containers/App'
import configureStore from './store/configureStore'

const store = configureStore()

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
```

编译后

```js
define('modules/index.jsx', function(require, exports, module) {

  "use strict";
  var react_1 = require('node_modules/react/react');
  var react_dom_1 = require('node_modules/react-dom/index');
  var react_redux_1 = require('node_modules/react-redux/lib/index');
  var App_1 = require('modules/containers/App.jsx');
  var configureStore_1 = require('modules/store/configureStore');
  var store = configureStore_1.default();
  react_dom_1.render(react_1.default.createElement(react_redux_1.Provider, {store: store}, react_1.default.createElement(App_1.default, null)), document.getElementById('root'));

});
```

所以说 es6 的模块化方案并没有什么特别的，只需要了解原来 fis 的模块化机制即可。

目前有四种模块化方案，可以根据自己喜好选用。

* [fis3-hook-commonjs](https://github.com/fex-team/fis3-hook-commonjs)：和 [mod.js](https://github.com/fex-team/mod/blob/master/mod.js) 结合的模块化方案。（强烈推荐，最简单实用！mod.js 才一百来行）
* [fis3-hook-amd](https://github.com/fex-team/fis3-hook-amd)： 和 require.js，[esl.js](https://github.com/ecomfe/esl)或者其他满足 [amd](https://github.com/amdjs/amdjs-api) 规范的加载器结合的模块化方案。
* [fis3-hook-system](https://github.com/fex-team/fis3-hook-system)：和 [system.js](https://github.com/systemjs/systemjs) 结合的模块化方案
* [fis3-hook-cmd](https://github.com/fex-team/fis3-hook-cmd)： 和 sea.js 结合的模块化方案。

无论你选用哪种方案，千万要记得把那些 es6 文件设置 `isMod` 属性。否者编译后的 js 没有被模块化包裹，导致模块找不到。

```js
fis.hook('commonjs'); // 采用 commonjs 模块化方案。

// 标记这些文件为模块化文件，插件会根据这个属性来进行 define 包裹。
fis.match('{*.jsx,/modules/**.js}', {
  isMod: true
});
```

## 组件生态
生态是我们开发 React 应用必不可少的一个东西，当下最流行的组件生态莫过于是 NPM 了。原来 fis 其实并不支持，但是经过 [@andycall](https://github.com/andycall) 同学的努力，fis3 终于可以直接使用 npm 生态了，安装 [fis3-hook-node_modules](https://github.com/fex-team/fis3-hook-node_modules) 加上如下配置即可：

```js
fis.unhook('components'); // fis3 自带的不是 npm 所以，先禁用它
fis.hook('node_modules'); // 启用 node_modules 组件支持。
```

虽然用起来很简单，但是还是有些细节处理需要说明下。

### 资源重复问题
npm 2 中组件的依赖是被安装在组件所在目录的，这样会导致一个问题就是，很多公共依赖会出现在多个组件内部，最终导致代码严重臃肿。

不过这个插件已经自动开启了去除重复组件的功能。组件去重分四个级别(mergeLevel)，用户可以自己配置。

* `0` 组件同名且版本号完全一致才会认为是重复。
* `1` （默认）组件同名且只有小版本号不同才认为是重复。 如：
  - `lodash@3.1.1` 和 `lodash@3.1.5` 会被认为是重复的组件。
  - 但是 `lodash@3.1.1` 和 `lodash@3.2.1` 不被认为重复。
* `2` 组件同名，且只要大版本号相同，则认为重复。如：
  - `lodash@3.1.1` 和 `lodash@3.2.1` 会被认为重复。
  - 但是 `lodash@3.1.1` 和 `lodash@4.1.1` 不被认为重复。
* `3` 只要组件同名则认为重复。

当组件被检查出重复后，会在重复的列表中选择版本最高的一个来使用。一般组件小版本更新都不会出现 break changes 所以默认级别 `1` 基本不会出现问题。

### node 端代码问题

现在很多组件里面都夹杂着 node 端的代码，比如:

* `__dirname`
* `__filename`
* `process.env.NODE_ENV !== 'production' ? xxx() : null;`
* `global.xx = xxx;`
* `Buffer.isBuffer(xxx)`

为了让这类代码可以在浏览器上正常运行，[fis3-hook-node_modules](https://github.com/fex-team/fis3-hook-node_modules) 插件对这类语句做了相应的替换。

* `__dirname` 和 `__filename` 会被替换成该文件在项目中相应的路径。
* `process.env.NODE_ENV` 在开启压缩的前提下替换成 `'production'` 否者替换成 `'development'`。如果再有其他 process 用法，会在代码中注入 `var process = require('process');`
* `global.xx = xxx` 会自动注入 `global` 的定义。
* `Buffer.isBuffer` 对 buffer 的操作也会自动注入 `require('buffer') 和 require('is-buffer')`。

所以如果出现上面这种情况，需要在项目中相应的去安装 `process`，`buffer` 和 `is-buffer` 模块。（友情提示：重新编译别忘了 -c 因为文件本身没有内容变化，所以上次编译结果被缓存了。）

除了这类代码，还有些需要针对 browser 端做替换处理的代码，一般这些信息都记录在 package.json 的 [browser](https://github.com/defunctzombie/package-browser-field-spec) 字段里面，此类替换也已经按规范在插件实现。

## 打包

由于使用了 npm，文件数目必然是小不了，上线不打包是不可能接受的。

有人喜欢 All In One 打包。有点类似于与 webpack 的 bundle 打包。

```js
fis.match('/{modules,node_modules}/**.{js,jsx}', {
    packTo: '/pkg/aio.js'
});
```

简单奔放，但是每次更新迭代都会使得所有 js 缓存失效，所以并不推荐这么打包。而是把常变动的代码打成一个，不经常变动的打成一个。所以推荐的打包方式是这样：

```js
fis.match('/modules/**.{js,jsx}', {
  packTo: '/pkg/app.js'
});

// 一定要开启按需编译，否者不相干的 js 也会打包进来。
fis.match('/node_modules/**.js', {
  packTo: '/pkg/third.js'
});
```

基于 React 和 Redux 开发，很多情况下都是整站 js 一次性都加载了，因为你会发现基本上所有的 js 都是通过 `import` 加载进来的，也就是说所有依赖都是同步依赖，这就会出现一个结果，不管什么页面，整站的 js 都在第一次渲染的时候都加载进来了。这样其实并没有什么问题，只是如果你的页面有很多，想到每次访问其中的一小部分页面的时候，其他的页面也都加载进来了，会觉得很浪费，很不爽。于是决定要拆包，页面异步按需加载。

首先需要把同步依赖断开，从 routes 层面入手。把那些不是必须第一次加载的页面改成异步加载的方式。

一个页面或者说一个功能模块基本上由三部分组成： React UI，Actions 和 Reducers。

React UI, 一般作为 Route 中的 Component, 他是可以异步加载的，react-router 有 component 的异步加载接口。

Actions 也是可以异步加载的，只要**只有**当前 UI 里面 import 了，它肯定也是在该 UI 加载的时候才加载的。但是通常情况下 Actions 是公用的，很可能其他页面也用了会提前加载进来。

Reducers 其实也是可以动态添加，但是**不能移除**，所以不太建议再去按需加载。而且公用性比较高，往往都会被提前加载。

```jsx
<Route
  path="page/xxx"
  getComponent={(location, cb) => {
    require(['./xxx/index.jsx'], function(component) {
      cb(null, component);
    });
  }}
/>
```

这样至少 UI 和 Actions 是按需加载的了，既然改成按需加载了，那么该页面里面的资源就需要独立打包了。如果要实现这个，要像上面例子的打包方式一样通过 match 去命令该页面的依赖就有点困难了。所以在这里推荐另外一个打包插件 [deps-pack](https://github.com/fex-team/fis3-packager-deps-pack)，它可以命中某文件的所有依赖。

比如，想让 `/modules/xxx/index.jsx` 以及他的**所有依赖**独立打成一个文件，就这么配置。

```js
fis.match('::packager', {
  packager: fis.plugin('deps-pack', {
    'pkg/xxx.js': [
      '/modules/xxx/index.jsx',
      '/modules/xxx/index.jsx:deps'
    ]
  })
});
```

这样 index.jsx 的所有依赖都被打包到了 `pkg/xxx.js` 文件里面，考虑到 node_modules 里面的依赖可能很少改动，不希望小的修改导致 node_modules 相应的依赖缓存失效，可以优化成.

```js
fis.match('::packager', {
  packager: fis.plugin('deps-pack', {
  'pkg/third.js': [
      '/modules/xxx/index.jsx:deps',
      '!/modules/**'
    ],
    'pkg/xxx.js': [
      '/modules/xxx/index.jsx',
      '/modules/xxx/index.jsx:deps'
    ]
  })
});
```

第一个规则是把 index.jsx 在 node_modules 中的依赖打包成 `third.js` 文件。注意 `!` 起到排除作用。第二个规则因为在第一个规则下面，因为 node_modules 中共同的依赖已经被第一个规则命中了，所以第二个规则不会再处理，最终的效果是，index.jsx 不在 node_modules 中剩余的依赖和自己被打包到了 `pkg/xxx.js` 文件里面，这样小修改只会让 `pkg/xxx.js` 缓存失效。

总的来说可以基于 [deps-pack](https://github.com/fex-team/fis3-packager-deps-pack) 的规则轻松满足你的多种打包策略。

## 其他易用性支持

参考现有的一些 React 项目，不难发现经常有如下的一些代码使用场景。

1. JS 中直接引入 css 文件。
  - `import 'xxx.css'`
  - `import 'xxx.less'`
  - `import 'xxx.scss'`
2. JS 中直接引入其他文件。
  - `import url from "xxx.png"`
  - `import data from 'xxx.json'`

为了跟社区用法保持一致，目前 fis3 也是支持这些用法。

1. JS 中 import css 或者 require css 文件，只需要开启 [fis3-preprocessor-js-require-css](https://github.com/fex-team/fis3-preprocessor-js-require-css) 即可。最终的表象就是，在 js 中 import 的 css ，会被分析到，最后在 header 里面通过 link 标签加载进来。(当然支持 css 合并)。个人感觉比 webpack 直接把内容内嵌到 js 中更好。当然要内嵌也支持，具体请看插件的 README.
2. JS 中 import 或者 require 其他类型的文件，也有对应的插件 [fis3-preprocessor-js-require-file](https://github.com/fex-team/fis3-preprocessor-js-require-file), 插件会根据目标文件的内容大小返回不同的内容。默认当目标文件体积他与 20K 会返回资源 url, 否则把内容直接base64 内嵌到字符串里面。

## 产品线使用举例

### 线上百万级PV案例：
贴吧【吧友热议】http://tieba.baidu.com/mo/q/hotMessage?topic_id=5027
开发流程：http://fit.baidu.com/components/tb (目前还只能百度内部才能访问)
技术方案：React + Fis3 + [Fit](http://fit.baidu.com/)(FEX开发的React组件库, 目前还只能百度内部才能访问)

### 相关连接

* [基于 react + redux + npm 的 todo Demo](https://github.com/fis-scaffold/react-redux-todo-npm)
* https://github.com/fex-team/fis3-parser-babel-5.x
* https://github.com/fex-team/fis3-parser-typescript
* https://github.com/fex-team/fis3-hook-commonjs
* https://github.com/fex-team/fis3-hook-node_modules
* https://github.com/fex-team/fis3-packager-deps-pack
* https://github.com/fex-team/fis3-preprocessor-js-require-css
* https://github.com/fex-team/fis3-preprocessor-js-require-file
