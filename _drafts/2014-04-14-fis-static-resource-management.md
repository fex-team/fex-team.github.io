---
layout: post
title: 如何高效的管理网站静态资源
author: walter
---

##背景

随着互联网开发和迭代速度越来越快，网站也变得越来越庞大，存在大量静态资源，我们原有管理静态资源的方式变得越来越不适用，就如同封面图一样，静态资源之间的关系错综复杂，给工程师带来了很多麻烦：

- 人工管理依赖的噩梦，工程师需要频繁管理和维护每个页面需要的 JS & CSS 文件，包括静态资源之间的依赖关系以及加载顺序等。
- 性能优化成本高且不可持续性，为了提高网站性能，工程师总是在忙于优化页面静态资源的加载，包括动态加载静态资源、按需加载静态资源和修改静态资源合并策略等，但是过了一段时间性能又降下来了，又需要周而复始的重复。
- 静态资源差异化的挑战，PC和无线的适配，不同的网络和终端需要适配相应的静态资源；当网站需要支持国际化的时候，需要对不同的国家进行差异化处理，返回不同的静态资源，这些需求对原有的静态资源管理方式提出巨大挑战。
- 缺少快速迭代和试验新功能的有效支持，从开发到上线流程繁琐，导致项目迭代周期长


每天工程师都会提交大量的 new feature/bug fixes，每次项目发布和迭代都面临着以上的问题，是否可以有一套系统帮助我们管理/调度静态资源来减少人工管理静态资源成本和风险，来达到更快、更可靠、低成本的自动化项目交付。在实际项目开发中，我们进行了大量探索和试验，实现了一套 “静态资源管理系统”，对静态资源进行全流程的管理和调度：

- 帮助工程师管理静态资源间的依赖以及资源的加载
- 管理静态资源版本更新与缓存，自动处理CDN
- 自动生成最优的静态资源合并策略，实现网站自适应优化
- 实现静态资源的分级发布，快速迭代，轻松回滚
- 根据国际化和终端的差异，送达不同的资源给不同的用户

下面本文将会介绍我们是如何通过静态资源系统来高效管理静态资源的。

##架构

![arc](/img/fis-static-resource-management/arc.png)

静态资源管理系统主要包含Compile、Sourcemap、Backend-Framework、Frontend-Loader几个核心模块：

- Compile，对静态资源进行编译处理，包括对静态资源进行预处理，url 处理(添加md5戳、添加CDN前缀)，优化(压缩、合并)，生成 Sourcemap 等
- Sourcemap，在 compile 阶段系统会扫描静态资源，建立一张静态资源关系表，记录每个静态资源的部署路径以及依赖关系等信息
- Backend-Framework，后端运行时根据组件使用情况来调度静态资源，为前端返回页面渲染需要的资源。
- Frontend-Loader，前端运行时根据用户的交互行为动态请求静态资源。

静态资源管理系统通过自动化工具对静态资源进行预处理并产出 Sourcemap，SourceMap 中记录着静态资源的调度信息，这样框架在运行时会根据 SourceMap 中提供的调度信息自动为用户进行静态资源调度，不仅可以做到送达不同资源给不同用户，还可以自适应优化静态资源合并和加载。

##自动管理静态资源依赖

静态资源管理系统为工程师提供了声明依赖关系的语法和规则，在 compile 阶段系统会扫描静态资源，建立一张静态资源关系表，记录每个静态资源的部署路径以及依赖关系等信息。

###在html中声明依赖

在项目的 index.html 里使用注释声明依赖关系：

```
<!--
    @require demo.js
    @require "demo.css"
-->
```

在 SourceMap 中则可看到：

```
{
    "res" : {
        "demo.css" : {
            "uri" : "/static/css/demo_7defa41.css",
            "type" : "css"
        },
        "demo.js" : {
            "uri" : "/static/js/demo_33c5143.js",
            "type" : "js",
            "deps" : [ "demo.css" ]
        },
        "index.html" : {
            "uri" : "/index.html",
            "type" : "html",
            "deps" : [ "demo.js", "demo.css" ]
        }
    },
    "pkg" : {}
}
```

###在js中声明依赖

支持识别 js 文件中的 require 函数，或者 注释中的 @require 字段 标记的依赖关系，这些分析处理对 html 的 script 标签内容 同样有效。

```
//demo.js
/**
 * @require demo.css
 * @require list.js
 */
var $ = require('jquery');
```

在SourceMap中则可看到：

```
{
    "res" : {
        ...
        "demo.js" : {
            "uri" : "/static/js/demo_33c5143.js",
            "type" : "js",
            "deps" : [ "demo.css", "list.js", "jquery" ]
        },
        ...
    },
    "pkg" : {}
}
```

###在css中声明依赖

支持识别 css 文件 注释中的 @require 字段 标记的依赖关系，这些分析处理对 html 的 style 标签内容 同样有效。

```
//demo.js
/**
 * @require demo.css
 * @require list.js
 */
var $ = require('jquery');
```

在SourceMap中则可看到：

```
{
    "res" : {
        ...
        "demo.js" : {
            "uri" : "/static/js/demo_33c5143.js",
            "type" : "js",
            "deps" : [ "demo.css", "list.js", "jquery" ]
        },
        ...
    },
    "pkg" : {}
}
```

##按需加载静态资源

在静态资源管理系统接管了项目中的静态资源后，可以知道静态资源的运行情况以及依赖关系，然后可以做到自动为页面按需加载静态资源，下面通过一个例子来详细讲解：

sidebar.tpl 中的内容如下，

```
<!--
    @require "common:ui/dialog/dialog.css"
-->

<a id="btn-navbar" class="btn-navbar">
    <span class="icon-bar"></span>
    <span class="icon-bar"></span>
    <span class="icon-bar"></span>
</a>

{script}
    var sidebar = require("common:ui/dialog/dialog.js");
    sidebar.run();
{/script}

{script}
    $('a.btn-navbar').click(function() {
        require.async('common:ui/dialog/dialog.async.js', function( dialog ) {
            dialog.run();
        });
    });
{/script}
```

对项目编译后，自动化工具会分析依赖关系，并生成 sourcemap，如下

```
"common:widget/sidebar/sidebar.tpl": {
    "uri": "common/widget/sidebsr/sidebar.tpl",
    "type": "tpl",
    "extras": {
        "async": [
            "common:ui/dialog/dialog.async.js"
        ]
    },
    "deps": [
        "common:ui/dialog/dialog.js",
        "common:ui/dialog/dialog.css"
    ]
}
```

在 sidebar 模块被调用后，静态资源管理系统通过查询 sourcemap 可以得知，当前 sidebar 模块同步依赖 sidebar.js、sidebar.css，异步依赖 sdebar.async.js，在要输出的 html 前面，生成静态资源外链，我们得到最终的 html

```
<link rel="stylesheet" href="/static/ui/dialog/dialog_7defa41.css">

<a id="btn-navbar" class="btn-navbar">
    <span class="icon-bar"></span>
    <span class="icon-bar"></span>
    <span class="icon-bar"></span>
</a>

<script type="text/javascript" src="/static/common/ui/dialog/dialog$12cd4.js"></script>
<script type="text/javascript">
    require.resourceMap({
        "res": {
            "common:ui/dialog/dialog.async.js": {
                "url": "/satic/common/ui/dialog/dialog.async_449e169.js"
            }
        }
    });
</script>
<script type="text/javascript">
    var sidebar = require("common:ui/dialog/dialog.js");
    sidebar.run();

    $('a.btn-navbar').click(function() {
        require.async('common:ui/dialog/dialog.async.js', function( dialog ) {
            dialog.run();
        });
    });
</script>
```
如上可见，后端模块化框架将同步模块的 script url 统一生成到页面底部，将 css url 统一生成在 head 中，对于异步模块(require.async)注册 resourceMap 代码，框架会通过 {script} 标签收集到页面所有 script，统一管理并按顺序输出 script 到相应位置。

当我们想对模块进行打包，只需要使用一个 pack 配置项，对网站的静态资源进行打包，这样在 SourceMap 中，所有被打包的资源会有一个 pkg 属性指向该表中的资源，而这个资源，正是我们配置的打包策略。这样静态资源系统可以根据对应信息找到某个资源最终被合并后的 package 的 url，最后把这个 url 返回给页面。

##自动合并静态资源

静态资源管理系统可以根据产品线上静态资源使用的数据，自动完成静态资源合并工作，对工程师完全透明，解决手工维护的未及时排除废弃资源、不可持续、成本大等问题。

![arc](/img/fis-static-resource-management/autopackage.png)

详情请见 [静态资源自动合并](https://speakerdeck.com/baidufe/jing-tai-zi-yuan-zi-dong-he-bing-xi-tong);

##静态资源版本更新与缓存

静态资源管理系统采用基于文件内容的 hash 值来控制静态资源的版本更新，如下所示：

```
<script type="text/javascript" src="a_8244e91.js"></script>
```

其中”_82244e91 ”这串字符是根据 a.js 的文件内容进行 hash 运算得到的，只有文件内容发生变化了才会有更改。这样做的好处有：

- 线上的 a.js 不是同名文件覆盖，而是文件名 +hash 的冗余，所以可以先上线静态资源，再上线 html 页面，不存在间隙问题；
- 遇到问题回滚版本的时候，无需回滚 a.js，只须回滚页面即可；
- 由于静态资源版本号是文件内容的 hash，因此所有静态资源可以开启永久强缓存，只有更新了内容的文件才会缓存失效，缓存利用率大增；
- 修改静态资源后会在线上产生新的文件，一个文件对应一个版本，因此不会受到构造 CDN 缓存形式的攻击

静态资源管理系统会在 compile 阶段识别文件中的定位标记(url)，计算对应文件的 hash，并自动替换为 '文件名 + hash'，无需工程师手动修改。

##静态资源分级控制

静态资源管理系统可以对静态资源做进一步控制(Controlling Access to Features)以达到分级发布的效果，主要包括以下两块核心功能,

- feature flags, 用来控制 feature 对应的静态资源是否加载
- feature flippers, 可以灵活控制 feature，不仅仅是 on 或 off, 可以做到类似'3%用户可以访问此功能'、'对内部所有员工开放' 类似的效果

通过以上的控制我们可以轻松做到发布一个新功能，让这个功能只对部分用户可访问，当功能完善后对所有用户开放，如果功能出现问题直接一键回滚即可。

在项目中的类似代码如下：

```
{if $config.some eq 'Fred'}
    do something new and amazing here.
{elseif $config.some eq 'Wilma'}
    do the current boring stuff.
{else}
    whatever you are.
```

静态资源管理系统会根据配置在运行时对 $config.some 进行干预.实现对静态资源的访问权控制，通过运行时的配置(feature flag)来控制静态资源，还可以支持“主干开发”的方式，来达到更快的迭代速度。

我们还可以实现国际化的需求，原理同分级发布，在运行时的做一些更细致的差异化处理

```
{if $lang == 'zh-CN'}
    zh-CN
{/if}
```

##总结

静态资源管理系统的核心是对静态资源进行调度，可以很灵活的适应各种性能优化和差异化处理的场景，来达到更快、更可靠、低成本的自动化项目交付。但是同时这个系统十分复杂，承载着各种职责，这个系统本身会成为整个网站的关键节点和瓶颈。