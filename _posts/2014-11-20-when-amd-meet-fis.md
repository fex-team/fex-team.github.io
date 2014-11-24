---
layout: post
title: 当 AMD 遇上 FIS
author: 2betop
shortname: when-amd-meet-fis
---

## 前言

也许说 [AMD](https://github.com/amdjs/amdjs-api) 不知道这是啥，但说 [requirejs](http://requirejs.org/) 就都懂了。没错 [AMD](https://github.com/amdjs/amdjs-api) 就是一种模块定义的接口（API），用来定义模块间依赖以及自身暴露什么内容的一种规范。而 [requirejs](http://requirejs.org/) 就是一种实现了这些接口的 AMD Loader。

说到 [requirejs](http://requirejs.org/) 相信不少人都已经对它爱不释手了，它真是给我们的开发带来了不少便利性。只要我们每个模块都简单的遵守这个规则

```javascript
// app.js
define(function (require, exports, module) {
    var a = require('a');
    var b = require('b');

    exports.action = function () {};
});
```

然后，简单一段

```javascript
// 程序入口
require(['/app'], function(app) {
    app.action();
});
```

就把指定的所有依赖都自动加载进来了。

于是，我们慢慢的会把一个大功能模块，拆得非常小，让每一个模块都只干最少的事，而且我们很享受这样的拆分，因为这样带给我们非常棒的可维护性。

## 问题

当我们把代码拆得非常小之后，直接用 requirejs 去加载的时候，很容就会出现这种情况。

![image1](/img/when-amd-meet-fis/image1.png)

性能好不好，可想而知。 于是乎，我们需要把这些依赖打包起来。如何打包？当然是 [r.js](http://requirejs.org/docs/optimization.html) 他提供一种指定入口文件将所有的依赖打包成一个文件的工具。常用的做法是，配置一个列表给每个入口程序都打成一个文件, 然后手动把所有的入口文件地址换成打包后的。

这样基本上能满足需求，但是仍然还有些问题？

* 每个入口及其依赖打成了一个包，多个页面间公用的依赖被打包到了多处，页面切换公用依赖的缓存完全没有被利用起来。
* 每个入口地址我都得手动替换新地址，麻烦！
* 有些 amd 模块写法，需要 requirejs 在运行期需要将 function 转成字符分析依赖，性能会不会有问题？

## 优化方案

如果你使用 [FIS](http://fis.baidu.com), 这些问题就都迎刃而解，而且还能带来其他更多的好处。你可以先试用一下这个 [fis amd demo](https://github.com/fex-team/fis-amd-demo)。然后，让我让我来细说 fis 针对 amd 模块做了哪些优化以及在 fis中使用将带来哪些好处。

## 全新的编译插件

使用过 fis mod.js 方案的同学应该知道。原来对 js 模块依赖的解析只是简单粗暴的分析了两种用法。

即：

1. `require('xxxx')`
2. `require.async('xxxx', cb);`

将依赖生成 map.json, 然后，模块定义就是让用户去遵循 commonjs 规范，FIS 在编译期会自动封装成 amd module，其实就是包了一层 `define`

```javascript
define(moduleId, funciton(require, exports, module) {
    // 源 JS 内容。
    var a = require('a');
    var b = require('b');

    exports.action = function() {};
});
```

在页面渲染的时候，程序会根据 map.json 中依赖的申明，提前把同步依赖加载进来。

其实这样已经满足各种开发需求了，而且非常高效实用。但是随着外界开源组件的兴起以及 bower 的推广，目前已有大量的第三方组件涌现，而且他们都有一个特点，就是采用的 amd 规范。问题就是，这些组件拿过来放在 fis 中，没法直接用，必须得手动修改才能使用。

于是，全新的 [amd 依赖解析插件](https://github.com/fex-team/fis-postprocessor-amd) 诞生了。

它会分析所有 [AMD](https://github.com/amdjs/amdjs-api) 规范中定义的各种写法。

有了它，模块间的依赖实际上在编译期就已经知道了，并把的依赖关系生成到了 [map.json](http://fis.baidu.com/docs/more/mapjson.html), 这样只要借助工具，就可以提前把所需模块的全部依赖提前加载进来，而不需要让 requirejs 在前端用 js 去动态加载。

怎么让 requirejs 不重复加载？只要提前加载进来的模块，都带上 module id, 然后 require 入口引用的 module id 与之一致，requirejs 是不会重复加载的。这个自动补充 module id 的工作在这个插件中自动完成了，默认是自动把该文件在工程下面的路径去掉 .js 后缀的值作为 module id。

有了这些依赖信息，我们还可以利用 combo 或者 [pack 打包](http://fis.baidu.com/docs/api/fis-conf.html#pack) 将依赖合成一个文件输出，这样就减少了多个请求带来的网络开销，以后可以愉快拆分模块代码了。

## 更好的模块化开发体验

一个大型的项目，一般情况都会包括三种类型的模块。

1. 第三方模块
1. 当前项目可公用的模块
1. 应用级模块，每个页面都不一样。

针对这三种性质的模块，我们都比较喜欢放在不同的目录。这样带来的坏处是，不管我用绝对定位还是相对定位，都是如此的别扭。

感谢 [AMD](https://github.com/amdjs/amdjs-api) 规范中制定了3个非常便于查找模块路径的配置, 我们把这几个配置也应用到了编译期。

通过fis.config.set('settings.postprocessor.amd') 来设置。

```javascript
fis.config.set('settings.postprocessor.amd', {
    baseUrl: '.',

    // 查看：https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#paths-
    // 不同的是，这是编译期处理，路径请填写编译路径。
    paths: {
        jquery: 'modules/libs/jquery/jquery.js',
        bootstrap: 'modules/libs/bootstrap/js/bootstrap.js',
        jqueryui: 'modules/libs/jquery-ui/ui/',
        app: './modules/app',
        css: './modules/css.js'
    },

    // 查看：https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#packages-
    // 不同的是，这是编译期处理，路径请填写编译路径。
    packages: [

        {
            name: 'zrender',
            location: 'modules/libs/zrender',
            main: 'zrender'
        },

        {
            name: 'echarts',
            location: 'modules/libs/echarts',
            main: 'echarts'
        }
    ]
});
```

### [baseUrl](https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#baseurl-)

当设置了 baseUrl 后，所有绝对路径的模块查找都是基于此目录查找的，对于使用频率比较高的模块，可以把改目录设置成 baseUrl. 比如第三类模块。

### [paths](https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#paths-)

对于一些常用的库，可以通过这个来设置短引用或者说别名。比如： `jquery`, `bootstrap`。

另外需要说明的是，有些第三方库在发布的时候，都是指定的别名依赖。如： jquery-ui 一系列。这种模块有很多很多。

```javascript
(function( factory ) {
    if ( typeof define === "function" && define.amd ) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "./core",
            "./widget",
            "./position"
        ], factory );
    } else {

        // Browser globals
        factory( jQuery );
    }
}(function( $ ) {
});
```

所以，为了不动第三方源码，我们也需要明确的设置这个别名。

```
paths: {
    jquery: 'modules/libs/jquery/jquery.js'
}
```

其次，我们可以给这类性质的“当前项目可公用的模块”，设置个 paths. 如:

```
paths: {
    libs: '/widget/libs/'
}
```

这样对于内部公共模块目录下模块的引用无论你的代码在什么位置就可以这样引用。

```javascript
define(function(require, exports, module) {
    var dialog = require('libs/dialog');
    ...
});
```

### [packages](https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#packages-)

作用基本上和 [paths](https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#paths-) 差不多，只是它更适合配置成一个完整的模块包。如 zrender、echarts 等等。

## 更智能的包装

在 FIS 开发环境中，你还可以编写满足 commonjs 规范的 js 模块，FIS 会自动包装成 AMD 模块以便于在浏览器中运行。如果直接就是 AMD 规范编写的，那就更不用说了。但是既不是 amd, 也不是 commonJS 规范的模块怎么办呢？

再次感谢 AMD 规范中的 [shim](https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#shim-) 配置，同样，FIS 把这个配置应用到了编译期。

```javascript
fis.config.set('settings.postprocessor.amd', {
    // 设置 bootstrap 依赖 jquery
    // 更多用法见：https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#shim-
    // key 为编译期路径。
    shim: {
        'modules/libs/bootstrap/js/bootstrap.js': ['jquery'],

        'some/ohther/path.js': {
            deps: ['libs/a', 'libs/b'],
            exports: 'some.thing',
            init: function (a, b) {
                return some.thing + 'another';
            }
        }
    }
});
```

FIS 在包装模块组件的时候，会读取此配置，自动把改模块的依赖和暴露的对象添加上。当然 requirejs 本来也能做这个事，但是考虑到性能开销，这个工作更应该在编译期完成。

## 更高级的插件加载机制

AMD 除了可以处理 JS 模块依赖加载，还能处理其他依赖加载，怎么做？就是利用 [amd plugin loader](https://github.com/amdjs/amdjs-api/blob/master/LoaderPlugins.md)

换句话说 amd 还可以用来加载 css or 前端 tpl。在 [fis amd demo](https://github.com/fex-team/fis-amd-demo) 例子中有个示例，就是利用 css amd 插件来动态加载 css 文件。[amd 依赖解析插件](https://github.com/fex-team/fis-postprocessor-amd) 不仅只处理模块查找，还处理插件资源查找。

```javascript
require(['css!./styles/demo.css'], function () {
    document.getElementById('main').innerHTML = '<div id="demo">It works!</div>';
});
```

这样的好处是，对于当前工程下面的静态资源引用，可以用相对路径，也可以用绝对路径，且可以给资源加 md5 戳，甚至可以最终部署到 cdn 上，而不用改一句源码。

## 更智能的打包

[FIS 的 pack](http://fis.baidu.com/docs/api/fis-conf.html#pack) 打包方案本来就比较灵活，通过正则或者 glob语法，可以把任意多的文件合并成一个。同时当使用 [depscombine 插件](https://github.com/fex-team/fis-packager-depscombine)的时候也支持 r.js 那种方式，将入口文件的所有依赖合并进来，只要在合并入口 JS 依赖前，配置一条规则把公用依赖部分的 js 合并成一个文件，就能把公共依赖抽离出来，这样公共的部分缓存就可以被利用起来。

```javascript
fis.config.set('pack', {
    // 依赖也会自动打包进来, 且可以通过控制前后顺来来定制打包，后面的匹配结果如果已经在前面匹配过，将自动忽略。
    'pkg/zrender.js': ['modules/libs/zrender/zrender.js'],
    'pkg/echarts.js': ['modules/libs/echarts/echarts.js'],

    'pkg/bootstrap_jquery.js': ['modules/libs/bootstrap/js/bootstrap.js'],

    'pkg/jquery_ui_tabs.js': ['modules/libs/jquery-ui/ui/tabs.js']
});
```

![image2](/img/when-amd-meet-fis/image2.png)

当配置好规则后，简单的一个 `fis release -p` 命令就把所有被打包文件的请求变成合并后的了，源码什么都不用改，如果想愉快的调试代码，release 时不带 `-p` 参数，又自动变成了非打包方案了。

## 被遗忘的技术细节

现在 require 入口调用，会自动把其同步依赖加载进来。但是，等等，貌似怪怪的，因为 require 入口的调用其语义就是异步调用，怎么变成同步的语义了？

按语义来应该针对 require('deps') 引用做同步处理，但是这种用法并不在 amd 规范中定义，amd  规范定义的同步调用用法，只出现在模块定义内部。所以没办法，把模块定义外的 require 用法当成同步来用吧（模块定义内部的 require 异步语义保持不变）。当然一定要当作异步来用也是可以的，只要在 require 调用的前面加段注释 fis async。这样编译期就会把找到依赖标记成异步依赖。

由于 FIS 对于静态文件是支持打包合并、加 md5 戳和部署到 cdn 的，也就是对于 js 的引用，我们是要忽略他的 release 后的路径的。如果纯同步依赖，似乎没问题，但是异步依赖怎么办呢？我在  require 里面的 module id 当然还是得用源码路径ID方便调试定位。

那么怎么转换路径呢？

原来 mod.js 方案是读取 `map.json` 生成一个异步所需的 resoucemap 表，通过 require.resourceMap({xxx}) 设置给 mod.js，这样在异步加载模块的时候，可以对应找到实际的存放地址。

amd 方案里面也是采用同样的方式，只是利用的是 amd 规范中的 [paths](https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#paths-) 设置，根据 map.json 自动生成程序中所需要的异步依赖的路径转换规则，这样的话，fis 不是一定只能用 mod.js 才能做模块化开发，只要满足 amd 规范的所有 loader 都能支持，比如 ecom 出的 [esl.js](https://github.com/ecomfe/esl);

```javascript
require.config({"paths":{
    "modules/libs/zrender/lib/excanvas": "/pkg/zrender",
    "modules/libs/zrender/tool/util": "/pkg/zrender",
    "modules/libs/zrender/config": "/pkg/zrender",
    "modules/libs/zrender/tool/log": "/pkg/zrender",
    "modules/libs/zrender/tool/guid": "/pkg/zrender",
    "modules/libs/zrender/tool/env": "/pkg/zrender",
    "modules/libs/zrender/tool/event": "/pkg/zrender",
    "modules/libs/zrender/Handler": "/pkg/zrender",
    "modules/libs/zrender/tool/matrix": "/pkg/zrender",
    "modules/libs/zrender/shape/mixin/Transformable": "/pkg/zrender",
    "modules/libs/zrender/tool/color": "/pkg/zrender",
    "modules/libs/zrender/shape/Base": "/pkg/zrender",
    "modules/libs/zrender/shape/Path": "/pkg/zrender",
    "modules/libs/zrender/tool/area": "/pkg/zrender",
    "modules/libs/zrender/shape/Text": "/pkg/zrender",
    "modules/libs/zrender/shape/Rectangle": "/pkg/zrender",
    "modules/libs/zrender/loadingEffect/Base": "/pkg/zrender",
    "modules/libs/zrender/shape/Image": "/pkg/zrender",
    "modules/libs/zrender/Painter": "/pkg/zrender",
    "modules/libs/zrender/shape/Group": "/pkg/zrender",
    "modules/libs/zrender/Storage": "/pkg/zrender",
    "modules/libs/zrender/animation/easing": "/pkg/zrender",
    "modules/libs/zrender/animation/Clip": "/pkg/zrender",
    "modules/libs/zrender/animation/Animation": "/pkg/zrender",
    "modules/libs/zrender/zrender": "/pkg/zrender",
    "modules/libs/zrender/shape/Circle": "/pkg/echarts",
    "modules/libs/zrender/tool/math": "/pkg/echarts",
    "modules/libs/zrender/shape/Ring": "/pkg/echarts",
    ...
});
```
另外，[amd 依赖解析插件](https://github.com/fex-team/fis-postprocessor-amd) 除了解析依赖，实际还会做一个小优化，就是会把 factory  中的各种依赖，提前放置在 define 的第二个参数里面。这样的好处是， amd loader 再也不需要用正则查找 factory 函数体的 require 了，直接读第二个参数就能把所有依赖拿到。


## 总结

既然 fis 在编译 amd 模块的时候，优化了这么多，依赖处理啊， ID 生成啊之类的。那么我们还需要一个如此庞大的 require.js 吗？ 当然不需要，FIS 组结合编译的处理，提供一个最小 amd loader 叫 [mod-amd.js](https://github.com/fex-team/mod/blob/master/mod-amd.js) 仅仅 200 多行,  但是他暂时不支持 amd plugin loader，因为没有足够的理由要去支持它，像模板加载，样式加载，fis 中有更优的处理方案。

好吧，回头正视原来提出的那些问题。

* > 每个入口及其依赖打成了一个包，多个页面间公用的依赖被打包到了多处，页面切换公用依赖的缓存完全没有被利用起来。

    采用 fis pack 打包配置，很好的解决这个问题。
* > 每个入口地址我都得手动替换新地址，麻烦！

    在 fis 里面编译的时候加上 -p 就足够。
* > 有些 amd 模块写法，需要 requirejs 在运行期需要将 function 转成字符分析依赖，性能会不会有问题？

    编译期，自动将依赖前置。

Ok，今天先写到这，有说得不对的，欢淫吐槽。
