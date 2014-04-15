---
layout: post
title: 前端工程之模块化
author: walter
---


模块化是一种处理复杂系统分解成为更好的可管理模块的方式，它可以把系统代码划分为一系列职责单一，高度解耦且可替换的模块，系统中某一部分的变化将如何影响其它部分就会变得显而易见，系统的可维护性更加简单易得。


前端开发领域(JavaScript、CSS、Template)并没有为开发者们提供以一种简洁、有条理地的方式来管理模块的方法。CommonJS(致力于设计、规划并标准化 JavaScript API)的诞生开启了“ JavaScript 模块化的时代”。CommonJS 的模块提案为在服务器端的 JavaScript 模块化做出了很大的贡献，但是在浏览器下的 JavaScript 模块应用很有限。随之而来又诞生了其它前端领域的模块化方案，像 requireJS、SeaJS 等，然而这些模块化方案并不是十分适用 ，并没有从根本上解决模块化的问题。

## 前端模块化并不等于 JavaScript 模块化

前端开发相对其他语言来说比较特殊，因为我们实现一个页面功能总是需要 JavaScript、CSS 和 Template 三种语言相互组织才行，如果一个功能仅仅只有 JavaScript 实现了模块化，CSS 和 Template 还是处于原始状态，那我们调用这个功能的时候并不能完全通过模块化的方式，那么这样的模块化方案并不是完整的，所以我们真正需要的是一种可以将 JavaScript、CSS 和 Template 同时都考虑进去的模块化方案，而非仅仅 JavaScript 模块化方案。

## JavaScript 模块化并不等于异步模块化

主流的 JavaScript 模块化方案都使用“异步模块定义”的方式，这种方式给开发带来了极大的不便，所有的同步代码都需要修改为异步的方式，我们是否可以在前端开发中使用“ CommonJS ”的方式，开发者可以使用自然、容易理解的模块定义和调用方式，不需要关注模块是否异步，不需要改变开发者的开发行为。

## 前端模块化带来的性能问题

很多主流的模块化解决方案通过 JavaScript 运行时来支持“匿名闭包”、“依赖分析”和“模块加载”等功能，例如“依赖分析”需要在 JavaScript 运行时通过正则匹配到模块的依赖关系，然后顺着依赖链（也就是顺着模块声明的依赖层层进入，直到没有依赖为止）把所有需要加载的模块按顺序一一加载完毕，当模块很多、依赖关系复杂的情况下会严重影响页面性能。

## 模块化为打包部署带来的极大不便

传统的模块化方案更多的考虑是如何将代码进行拆分，但是当我们部署上线的时候需要将静态资源进行合并（打包），这个时候会发现困难重重，每个文件里只能有一个模块，因为模块使用的是“匿名定义”，经过一番研究，我们会发现一些解决方案，无论是“ combo 插件”还是“ flush 插件”，都需要我们修改模块化调用的代码，这无疑是雪上加霜，开发者不仅仅需要在本地开发关注模块化的拆分，在调用的时候还需要关注在一个请求里面加载哪些模块比较合适，模块化的初衷是为了提高开发效率、降低维护成本，但我们发现这样的模块化方案实际上并没有降低维护成本，某种程度上来说使得整个项目更加复杂了。

## 一体化的前端模块化实践方案

写到这里，其实我们的“前端工程之块化”才正式开始，本文面向对前端模块化开发有所实践或有所研究的同学，接下来我们所介绍的前端模块化解决方案， 有别于 JavaScript 模块化方案或 CSS 模块化方案，它是一种可以综合处理前端各种资源的模块化方案；它可以极大提升开发者的开发体验，并为性能优化提供良好的支持。下面让我们来进一步来了解什么是“一体化”的模块化实践方案。

首先我们来看一下一个 web 项目是如何通过“一体化”的模块化方案来划分目录结构：

![image1](/img/fis/image2-1.png)

* 站点(site)：一般指能独立提供服务，具有单独二级域名的产品线。如旅游产品线或者特大站点的子站点（lv.baidu.com）。
* 子系统(module)：具有较清晰业务逻辑关系的功能业务集合，一般也叫系统子模块，多个子系统构成一个站点。子系统(module)包括两类： common 子系统， 为其他业务子系统提供规范、资源复用的通用模块；业务子系统:，根据业务、URI 等将站点进行划分的子系统站点。
* 页面(page): 具有独立 URL 的输出内容，多个页面一般可组成子系统。
* 模块(widget)：能独立提供功能且能够复用的模块化代码，根据复用的方式不同分为 Template 模块、JS 模块、CSS 模块三种类型。
* 静态资源(static)：非模块化资源目录，包括模板页面引用的静态资源和其他静态资源（favicon,crossdomain.xml 等）。

前端模块(widget)，是能独立提供功能且能够复用的模块化代码，根据复用的方式不同分为 Template 模块、JS 模块、CSS 模块三种类型，CSS 组件，一般来说，CSS 模块是最简单的模块，它只涉及 CSS 代码与 HTML 代码； JS 模块，稍为复杂，涉及 JS 代码，CSS 代码和 HTML 代码。一般，JS 组件可以封装 CSS 组件的代码； Template 模块，涉及代码最多，可以综合处理 HTML、JavaScript、CSS 等各种模块化资源，一般情况，Template 会将 JS 资源封装成私有 JS 模块、CSS 资源封装成自己的私有 CSS 模块。下面我们来一一介绍这几种模块的模块化方案。

## 模板模块

我们可以将任何一段可复用的模板代码放到一个 smarty 文件中，这样就可以定义一个模板模块。在 widget 目录下的 smarty 模板(本文仅以 Smarty 模板为例)即为模板模块，例如 common 子系统的 widget/nav/ 目录

```bash
├── nav.css
├── nav.js
└── nav.tpl
```

下 nav.tpl 内容如下：

```html
<nav id="nav" class="navigation" role="navigation">
    <ul>
        <%foreach $data as $doc%>
        <li class="active">
            <a href="#section-{$doc@index}">
                <i class="icon-{$doc.icon} icon-white"></i><span>{$doc.title}</span>
            </a>
        </li>
        <%/foreach%>
    </ul>
</nav>
```

然后，我们只需要一行代码就可以调用这个包含 smarty、JS、CSS 资源的模板模块，

```html
// 调用模块的路径为 子系统名称:模板在 widget 目录下的路劲
{widget name="common:widget/nav/nav.tpl" }
```

这个模板模块(nav)目录下有与模板同名的 JS、CSS 文件，在模板被执行渲染时这些资源会被自动加载。如上所示，定义 template 模块的时候，只需要将 template 所依赖的 JS 模块、CSS 模块存放在同一目录(默认 JavaScript 模块、CSS 模块与 Template 模块同名)下即可，调用者调用 Template 模块只需要写一行代码即可，不需要关注所调用的 template 模块所依赖的静态资源，模板模块会帮助我们自动处理依赖关系以及资源加载。

## JavaScript 模块

上面我们介绍了一个模板模块是如何定义、调用以及处理依赖的，接下来我们来介绍一下模板模块所依赖的 JavaScript 模块是如何来处理模块交互的。我们可以将任何一段可复用的 JavaScript 代码放到一个 JS 文件中，这样就可以定义为一个 JavaScript 类型的模块，我们无须关心“ define ”闭包的问题，我们可以获得“ CommonJS ”一样的开发体验，下面是 nav.js 中的源码.

```javascript
// common/widget/nav/nav.js
var $ = require('common:widget/jquery/jquery.js');

exports.init = function() {
    ...
};
```

我们可以通过 require、require.async 的方式在任何一个地方(包括 html、JavaScript 模块内部)来调用我们需要的 JavaScript 类型模块，require 提供的是一种类似于后端语言的同步调用方式，调用的时候默认所需要的模块都已经加载完成，解决方案会负责完成静态资源的加载。require.async 提供的是一种异步加载方式，主要用来满足“按需加载”的场景，在 require.async 被执行的时候才去加载所需要的模块，当模块加载回来会执行相应的回调函数，语法如下：

```javascript
// 模块名: 文件所在 widget 中路径
require.async(["common:widget/menu/menu.js"], function( menu ) {
    menu.init();
});
```

一般 require 用于处理页面首屏所需要的模块，require.async 用于处理首屏外的按需模块。

## CSS 模块

在模板模块中以及 JS 模块中对应同名的 CSS 模块会自动与模板模块、JS 模块添加依赖关系，进行加载管理，用户不需要显示进行调用加载。那么如何在一个 CSS 模块中声明对另一个 CSS 模块的依赖关系呢，我们可以通过在注释中的@require 字段标记的依赖关系，这些分析处理对 html 的 style 标签内容同样有效，

```css
/**
 * demo.css
 * @require reset.css
 */
```

## 非模块化资源

在实际开发过程中可能存在一些不适合做模块化的静态资源，那么我们依然可以通过声明依赖关系来托管给静态资源管理系统来统一管理和加载，

```html
{require name="home:static/index/index.css" }
```

如果通过如上语法可以在页面声明对一个非模块化资源的依赖，在页面运行时可以自动加载相关资源。

## 项目实例

下面我们来看一下在一个实际项目中，如果在通过页面来调用各种类型的 widget，首先是目录结构：

```bash
├── common
│   ├── fis-conf.js
│   ├── page
│   ├── plugin
│   ├── static
│   └── widget
└── photo
    ├── fis-conf.js
    ├── output
    ├── page
    ├── static
    ├── test
    └── widget
```

我们有两个子系统，一个 common 子系统(用作通用)，一个业务子系统，page 目录用来存放页面，widget 目录用来存放各种类型的模块，static 用于存放非模块化的静态资源，首先我们来看一下 photo/page/index.tpl 页面的源码，

```html
{extends file="common/page/layout/layout.tpl"}
{block name="main"}
    {require name="photo:static/index/index.css"}
    {require name="photo:static/index/index.js"}
    <h3>demo 1</h3>
    <button id="btn">Button</button>
    {script type="text/javascript"}
        // 同步调用 jquery
        var $ = require('common:widget/jquery/jquery.js');

        $('#btn').click(function() {
            // 异步调用 respClick 模块
            require.async(['/widget/ui/respClick/respClick.js'], function() {
                respClick.hello();
            });
        });
    {/script}

    // 调用 renderBox 模块
    {widget name="photo:widget/renderBox/renderBox.tpl"}
{/block}
```

第一处代码是对非模块化资源的调用方式；第二处是用 require 的方式调用一个 JavaScript 模块；第三处是通过 require.async 通过异步的方式来调用一个 JavaScript 模块;最后一处是通过 widget 语法来调用一个模板模块。
respclick 模块的源码如下：

```javascript
exports.hello = function() {
    alert('hello world');
};
```

renderBox 模板模块的目录结构如下：

```html
└── widget
    └── renderBox
        ├── renderBox.css
        ├── renderBox.js
        ├── renderBox.tpl
        └── shell.jpeg
```

虽然 renderBox 下面包括 renderBox.js、renderBox.js、renderBox.tpl 等多种模块，我们再调用的时候只需要一行代码就可以了，并不需要关注内部的依赖，以及各种模块的初始化问题。

## 模块化基础架构

### 总体架构
为了实现一种自然、便捷、高性能、一体化的模块化方案，我们需要解决以下一些问题，

* 模块静态资源管理，一般模块总会包含 JavaScript、CSS 等其他静态资源，需要记录与管理这些静态资源
* 模块依赖关系处理，模块间存在各种依赖关系，在加载模块的时候需要处理好这些依赖关系
* 模块加载，在模块初始化之前需要将模块的静态资源以及所依赖的模块加载并准备好
* 模块沙箱(模块闭包)，在 JavaScript 模块中我们需要自动对模块添加闭包用于解决作用域问题

** 使用编译工具来管理模块 **

我们可以通过编译工具(自动化工具) 对模块进行编译处理，包括对静态资源进行预处理(对 JavaScript 模块添加闭包、对 CSS 进行 LESS 预处理等)、记录每个静态资源的部署路径以及依赖关系并生成资源表(resource map)。我们可以通过编译工具来托管所有的静态资源，这样可以帮我们解决模块静态资源管理、模块依赖关系、模块沙箱问题。

** 使用静态资源加载框架来加载模块 **

那么如何解决模块加载问题，我们可以通过静态资源加载框架来解决，主要包含前端模块加载框架，用于 JavaScript 模块化支持，控制资源的异步加载。后端模块化框架，用于解决 JavaScript 同步加载、CSS 和模板等模块资源的加载，静态资源加载框架可以用于对页面进行持续的自适应的前端性能优化，自动对页面的不同情况投递不同的资源加载方案，帮助开发者管理静态资源，抹平本地开发到部署上线的性能沟壑。
编译工具和静态资源加载框架的流程图如下：

![image2](/img/fis/image2-2.png)

### 编译工具

自动化工具会扫描目录下的模块进行编译处理并输出产出文件：

**静态资源**，经过编译处理过的 JavaScript、CSS、Image 等文件，部署在 CDN 服务器自动添加闭包，我们希望工程师在开发 JavaScript 模块的时候不需要关心” define ”闭包的事情，所以采用工具自动帮工程师添加闭包支持，例如如上定义的 nav.js 模块在经过自动化工具处理后变成如下，

```javascript
define('common:widget/nav/nav.js', function( require, exports, module ) {
    // common/widget/nav/nav.js
    var $ = require('common:widget/jquery/jquery.js');

    exports.init = function() {
        ...
    };
});
```

**模板文件**，经过编译处理过的 smarty 文件，自动部署在模板服务器

**资源表**，记录每个静态资源的部署路径以及依赖关系，用于静态资源加载框架
静态资源加载框架(SR Management System)会加载 source maps 拿到页面所需要的所有模块以及静态资源的 url，然后组织资源输出最终页面。

### 静态资源加载框架

下面我们会详细讲解如何加载模块，如下所示，

![image3](/img/fis/image2-3.png)

在流程开始前我们需要准备两个数据结构：

* uris = []，数组，顺序存放要输出资源的 uri
* has = {}，hash 表，存放已收集的静态资源，防止重复加载

1. 加载资源表(resource map):

    ```javascript
    {
        "res": {
            "A/A.tpl": {
                "uri": "/templates/A.tpl",
                "deps": ["A/A.css"]
            },
            "A/A.css": {
                "uri": "/static/css/A_7defa41.css"
            },
            "B/B.tpl": {
                "uri": "/templates/B.tpl",
                "deps": ["B/B.css"]
            },
            "B/B.css": {
                "uri": "/static/css/B_33c5143.css"
            },
            "C/C.tpl": {
                "uri": "/templates/C.tpl",
                "deps": ["C/C.css"]
            },
            "C/C.css": {
                "uri": "/static/css/C_6a59c31.css"
            }
        }
    }
    ```
2. 执行 {widget name="A"}
    * 在表中查找 id 为 A/A.tpl 的资源，取得它的资源路径 /template/A.tpl，记为 tpl_path,加载并渲染 tpl_path 所指向的模板文件，即 /template/A.tpl，并输出它的 html 内容
    * 查看 A/A.tpl 资源的 deps 属性，发现它依赖资源 A/A.css,在表中查找 id 为 A/A.css 的资源，取得它的资源路径为 /static/css/A7defa41.css_，存入 uris 数组 中，并在 has 表 里标记已加载 A/A.css 资源，我们得到：

    ```javascript
    urls = [
        '/static/css/A_7defa41.css'
    ];

    has = {
        "A/A.css": true
    }
    ```
3. 依次执行 {widget name="B"}、{widget name="c"},步骤与上述步骤 3 相同，得到,

    ```javascript
    urls = [
        '/static/css/A_7defa41.css',
        '/static/css/B_33c5143.css',
        '/static/css/C_6a59c31.css'
    ];

    has = {
        "A/A.css": true,
        "B/B.css": true,
        "C/C.css": true
    }

    ```
4. 在要输出的 html 前面，我们读取 uris 数组的数据，生成静态资源外链，我们得到最终的 html 结果：

    ```html
    <html>
        <link rel="stylesheet" href="/static/css/A_7defa41.css">
        <link rel="stylesheet" href="/static/css/B_33c5143.css">
        <link rel="stylesheet" href="/static/css/C_6a59c31.css">
        <div>html of A</div>
        <div>html of B</div>
        <div>html of C</div>
    </html>
    ```
上面讲的是对模板和 CSS 资源的加载，用于描述静态资源加载的流程，下面我们再来详细讲解下对于 JavaScript 模块的处理，要想在前端实现类似“ commonJS ”一样的模块化开发体验需要前端模块化框架和后端模块化框架一起作用来实现，

**前端模块化框架**，原理上大家可以选择使用 requireJS 或 SeaJS 来作为模块化支持，但是我们并不建议这么做，我们建议大家使用一个 mininal AMD API，例如 requireJS 的 almond 版本或者其他的精简版本，requireJS 完整版有 2000 余行，而精简版模块化框架只需要 100 行代码左右就可以实现，只需要实现以下功能：

* 模块定义，只需要实现如下接口 define (id, factory)，因为 define 闭包是工具生成，所以我们不需要考虑匿名闭包的实现，同时也不需要考虑“依赖前置”的支持，我们只需要支持一种最简单直接的模块化定义即可
* 模块同步调用，require (id)，静态资源管理系统会保证所需的模块都已预先加载，因此 require 可以立即返回该模块
* 模块异步调用，考虑到有些模块无需再启动时载入，因此我们需要提供一个可以在运行时加载模块的接口 require.async (names, callback)，names 可以是一个 id，或者是数组形式的 id 列表。当所有都加载都完成时，callback 被调用，names 对应的模块实例将依次传入。
* 模块自执行，即 AMD 规范的提前执行，之所选择这样做的原因是考虑到 Template 模块的特殊性，一般 Template 模块都会依赖 JavaScript 模块来做初始化工作，选择模块自执行的方式我们就不需要显式的在 Template 页面上书写 require 依赖，静态资源系统会自动加载 Template 模块的依赖，当模块并行加载结束后会一次自执行。大家可能会认为如果页面存在一些用不到的模块那都自执行岂不会浪费资源，这里大家可以不用担心，静态资源系统投放到前端的模块都是页面初始化所需要的，不存在浪费资源的情况。
* Resource map 前端支持，主要用于为异步模块调用提供 uri 支持，resourceMap 为静态资源管理系统自动生成，无需人工调用，用于查询一个异步模块的真正 url，用于自动处理异步模块的 CDN、资源打包合并、强缓存问题，格式如下，

    ```javascript
    require.resourceMap({
        "res": {
            "common:widget/sidebar/sidebar.async.js": {
                "url": "/static/common/widget/sidebar/sidebar.async_449e169.js"
            }
        }
    });
    ```
* 处理循环引用，参照 nodeJS 处理循环引用的方式，在造成循环依赖的 require 之前把需要的东西 exports 出去，例如

    ```javascript
    // a.js
    console.log('a string');
    exports.done = false;
    var b = require('./b.js');
    console.log('in a, b.done = ' + b.done);
    exorts.done = true;
    console.log('b done');

    // b.js
    console.log('b starting');
    exports.done = false;

    var a = require('./a.js');
    console.log('in b, a.done = ' + a.done);
    exports.done = true;
    console.log('b done');

    // main.js
    console.log('main starting');
    var a = require('./a.js');
    var b = require('./b.js');
    console.log('in main. a.done = ' + a.done + ', b.done = ' + b.done);
    ```

    如果在加载 a 的过程中，有其他的代码（假设为 b）require a.js 的话，那么 b 可以从 cache 中直接取到 a 的 module，从而不会引起重复加载的死循环。但带来的代价就是在 load 过程中，b 看到的是不完整的 a。

后端模块加载框架，主要用于处理模块的依赖并生成模块静态资源外链，下面我们将以实例讲解静态资源管理系统是如何对 JavaScript 模块进行加载的，如下我们有一个 sidebar 模块，目录下有如下资源

```bash
├── sidebar.async.js
├── sidebar.css
├── sidebar.js
└── sidebar.tpl
```

sidebar.tpl 中的内容如下，

```html
<a id="btn-navbar" class="btn-navbar">
    <span class="icon-bar"></span>
    <span class="icon-bar"></span>
    <span class="icon-bar"></span>
</a>

{script}
    $('a.btn-navbar').click(function() {
        require.async('./sidebar.async.js', function( sidebar ) {
            sidebar.run();
        });
    });
{/script}
```

对项目编译后，自动化工具会分析模块的依赖关系，并生成 map.json，如下

```javascript
"common:widget/sidebar/sidebar.tpl": {
    "uri": "common/widget/sidebsr/sidebar.tpl",
    "type": "tpl",
    "extras": {
        "async": [
            "common:widget/sidebar/sidebar.async.js"
        ]
    },
    "deps": [
        "common:widget/sidebar/sidebar.js",
        "common:widget/sidebar/sidebar.css"
    ]
}
```

在 sidebar 模块被调用后，静态资源管理系统通过查询 map.json 可以得知，当前 sidebar 模块同步依赖 sidebar.js、sidebar.css，异步依赖 sdebar.async.js，在要输出的 html 前面，我们读取 uris 数组的数据，生成静态资源外链，我们得到最终的 html

```html
<script type="text/javascript">
    require.resourceMap({
        "res": {
            "common:widget/sidebar/sidebar.async.js": {
                "url": "/satic/common/widget/sidebar/sidebar.async_449e169.js"
            }
        }
    });
</script>
<script type="text/javascript" src="/static/common/widget/sidebar/sidebar_$12cd4.js"></script>
```

如上可见，后端模块化框架将同步模块的 script url 统一生成到页面底部，将 css url 统一生成在 head 中，对于异步模块(require.async)注册 resourceMap 代码，框架会通过{script}标签收集到页面所有 script，统一管理并按顺序输出 script 到相应位置。

## 自适应的性能优化
现在，当我们想对模块进行打包，该如何处理呢，我们首先使用一个 pack 配置项(下面是 fis 的打包配置项)，对网站的静态资源进行打包，配置文件大致为,

```javascript
fis.config.merge({
    pack: {
        'pkg/aio.css': '**.css'
    }
});
```
我们编译项目看一下产出的 map.json（resource map），有何变化，

```javascript
{
    "res": {
        "A/A.tpl": {
            "uri": "/template/A.tpl",
            "deps": ["A/A.css"]
        },
        "A/A.css": {
            "uri": "/static/csss/A_7defa41.css",
            "pkg": "p0"
        },
        "B/B.tpl": {
            "uri": "/template/B.tpl",
            "deps": ["B/B.css"]
        },
        "B/B.css": {
            "uri": "/static/csss/B_33c5143.css",
            "pkg": "p0"
        },
        "C/C.tpl": {
            "uri": "/template/C.tpl",
            "deps": ["C/C.css"]
        },
        "C/C.css": {
            "uri": "/static/csss/C_ba59c31.css",
            "pkg": "p0"
        },
    },
    "pkg": {
        "p0": {
            "uri": "/static/pkg/aio_0cb4a19.css",
            "has": ["A/A.css", "B/B.css", "C/C.css"]
        }
    }
}
```
大家注意到了么，表里多了一张 pkg 表，所有被打包的资源会有一个 pkg 属性 指向该表中的资源，而这个资源，正是我们配置的打包策略。这样静态资源管理系统在表中查找 id 为 A/A.css 的资源，我们发现该资源有 pkg 属性，表明它被备份在了一个打包文件中。

我们使用它的 pkg 属性值 p0 作为 key，在 pkg 表里读取信息，取的这个包的资源路径为 /static/pkg/aio0cb4a19.css_ 存入 uris 数组 中将 p0 包的 has 属性所声明的资源加入到 has 表，在要输出的 html 前面，我们读取 uris 数组 的数据，生成静态资源外链，我们得到最终的 html 结果：

```html
<html>
    <link href="/static/pkg/aio_0cb4a19.css">
    <div>html of A</div>
    <div>html of B</div>
    <div>html of C</div>
</html>
```

静态资源管理系统可以十分灵活的适应各种性能优化场景，我们还可以统计 {widget} 插件的调用情况，然后自动生成最优的打包配置，让网站可以自适应优化,这样工程师不用关心资源在哪，怎么来的，怎么没的，所有资源定位的事情，都交给静态资源管理系统就好了。静态资源路径都带 md5 戳，这个值只跟内容有关，静态资源服务器从此可以放心开启强缓存了！还能实现静态资源的分级发布，轻松回滚！我们还可以继续研究，比如根据国际化、皮肤，终端等信息约定一种资源路径规范，当后端适配到特定地区、特定机型的访问时，静态资源管理系统帮你送达不同的资源给不同的用户。说到这里，大家应该比较清楚整个“一体化”的模块化解决方案了，有人可能会问，这样做岂不是增加了后端性能开销？对于这个问题，我们实践过的经验是，这非常值得！其实这个后端开销很少，算法非常简单直白，但他所换来的前端工程化水平提高非常大！

## 总结

本文是 fis 前端工程系列文章中的一部分，其实在前端开发工程管理领域还有很多细节值得探索和挖掘，提升前端团队生产力水平并不是一句空话，它需要我们能对前端开发及代码运行有更深刻的认识，对性能优化原则有更细致的分析与研究。fis 团队一直致力于从架构而非经验的角度实现性能优化原则，解决前端工程师开发、调试、部署中遇到的工程问题，提供组件化框架，提高代码复用率，提供开发工具集，提升工程师的开发效率。在前端工业化开发的所有环节均有可节省的人力成本，这些成本非常可观，相信现在很多大型互联网公司也都有了这样的共识。

本文只是将这个领域中很小的一部分知识的展开讨论，抛砖引玉，希望能为业界相关领域的工作者提供一些不一样的思路。欢迎关注[fis](https://github.com/fex-team/fis-plus)项目，对本文有任何意见或建议都可以在[fis](https://github.com/fex-team/fis-plus)开源项目中进行反馈和讨论。