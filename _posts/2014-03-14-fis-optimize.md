---
layout: post
title: 前端工程与性能优化
author: walter
---

<div class="alignleft"><img src="/img/fis/image1.jpg" alt="book" style="width: 250px;"/></div>

每个参与过开发企业级web应用的前端工程师或许都曾思考过前端性能优化方面的问题。我们有雅虎14条性能优化原则，还有两本很经典的性能优化指导书：《高性能网站建设指南》、《高性能网站建设进阶指南》。经验丰富的工程师对于前端性能优化方法耳濡目染，基本都能一一列举出来。这些性能优化原则大概是在7年前提出的，对于web性能优化至今都有非常重要的指导意义。

然而，对于构建大型web应用的团队来说，要坚持贯彻这些优化原则并不是一件十分容易的事。因为优化原则中很多要求与工程管理相违背，比如“把css放在头部”和“把js放在尾部”这两条原则，我们不能让整个团队的工程师在写样式和脚本引用的时候都去修改同一份的页面文件。这会严重影响团队成员间并行开发的效率，尤其是在团队有版本管理的情况下，每天要花大量的时间进行代码修改合并，这项成本是难以接受的。因此在前端工程界，总会看到周期性的性能优化工作，辛勤的前端工程师们每到月圆之夜就会倾巢出动根据优化原则做一次最佳实践。

本文从一个全新的视角来思考web性能优化与前端工程之间的关系，通过解读百度前端集成解决方案小组（F.I.S）在打造高性能前端架构并统一百度40多条前端产品线的过程中所经历的技术尝试，揭示前端性能优化在前端架构及开发工具设计层面的实现思路。

## 性能优化原则及分类

笔者先假设本文的读者是有前端开发经验的工程师，并对企业级web应用开发及性能优化有一定的思考。因此我不会重复介绍雅虎14条性能优化原则，如果您没有这些前续知识的，请移步[这里](http://developer.yahoo.com/performance/rules.html)来学习。

首先，我们把雅虎14条优化原则，《高性能网站建设指南》以及《高性能网站建设进阶指南》中提到的优化点做一次梳理，如果按照优化方向分类可以得到这样一张表格：

| 优化方向        | 优化手段        |
| ------------- | ------------- |
| 请求数量 | 合并脚本和样式表，CSS Sprites，拆分初始化负载，划分主域 |
| 请求带宽 | 开启GZip，精简JavaScript，移除重复脚本，图像优化 |
| 缓存利用 | 使用CDN，使用外部JavaScript和CSS，添加Expires头，减少DNS查找，配置ETag，使AjaX可缓存 |
| 页面结构 | 将样式表放在顶部，将脚本放在底部，尽早刷新文档的输出 |
| 代码校验 | 避免CSS表达式，避免重定向 |

目前大多数前端团队可以利用[yui compressor](http://yui.github.io/yuicompressor/)或者[google closure compiler](https://code.google.com/p/closure-compiler/)等压缩工具很容易做到“精简javascript”这条原则，同样的，也可以使用图片压缩工具对图像进行压缩，实现“图像优化”原则，这两条原则是对单个资源的处理，因此不会引起任何工程方面的问题；很多团队也通过引入代码校验流程来确保实现“避免css表达式”和“避免重定向”原则；目前绝大多数互联网公司也已经开启了服务端的Gzip压缩，并使用CDN实现静态资源的缓存和快速访问；一些技术实力雄厚的前端团队甚至研发出了自动CSS Sprites工具，解决了CSS Sprites在工程维护方面的难题。使用“查找-替换”思路，我们似乎也可以很好的实现“划分主域”原则。

我们把以上这些已经成熟应用到实际生产中的优化手段去除掉，留下那些还没有很好实现的优化原则，再来回顾一下之前的性能优化分类:

| 优化方向        | 优化手段        |
| ------------- | ------------- |
| 请求数量 | 合并脚本和样式表，拆分初始化负载 |
| 请求带宽 | 移除重复脚本 |
| 缓存利用 | 添加Expires头，配置ETag，使Ajax可缓存 |
| 页面结构 | 将样式表放在顶部，将脚本放在底部，尽早刷新文档的输出 |

诚然，不可否认现在有很多顶尖的前端团队可以将上述还剩下的优化原则也都一一解决，但业界大多数团队都还没能很好的解决这些问题，因此接下来本文将就这些原则的解决方案做进一步的分析与讲解，从而为那些还没有进入前端工业化开发的团队提供一些基础技术建设意见，也借此机会与业界顶尖的前端团队在工业化工程化方向上交流一下彼此的心得。


## 静态资源版本更新与缓存

如表格2所示，在“缓存利用”分类中保留了“添加Expires头”和“配置ETag”两项，或许有些人会质疑，明明这两项只要配置了服务器的相关选项就可以实现，为什么说它们难以解决呢？确实，开启这两项很容易，但开启了缓存后，我们的项目就开始面临另一个挑战：如何更新这些缓存。

相信大多数团队也找到了类似的答案，它和《高性能网站建设指南》关于“添加Expires头”所说的原则一样——修订文件名。即：

思路没错，但要怎么改变链接呢？变成什么样的链接才能有效更新缓存，又能最大限度避免那些没有修改过的文件缓存不失效呢？

先来看看现在一般前端团队的做法：

```html
<script type="text/javascript" src="a.js?t=20130825"></script>
```

或者

```html
<script type="text/javascript" src="a.js?v=1.0.0"></script>
```

大家会采用添加query的形式修改链接。这样做是比较直观的解决方案，但在访问量较大的网站，这么做可能将面临一些新的问题。

通常一个大型的web应用几乎每天都会有迭代和更新，发布新版本也就是发布新的静态资源和页面的过程。以上述代码为例，假设现在线上运行着index.html文件，并且使用了线上的a.js资源。index.html的内容为：

```html
<script type="text/javascript" src="a.js?v=1.0.0"></script>
```

这次我们更新了页面中的一些内容，得到一个index.html文件，并开发了新的与之匹配的a.js资源来完成页面交互，新的index.html文件的内容因此而变成了：

```html
<script type="text/javascript" src="a.js?v=1.0.1"></script>
```

好了，现在要开始将两份新的文件发布到线上去。可以看到，a.html和a.js的资源实际上是要覆盖线上的同名文件的。不管怎样，在发布的过程中，index.html和a.js总有一个先后的顺序，从而中间出现一段或大或小的时间间隔。对于一个大型互联网应用来说即使在一个很小的时间间隔内，都有可能出现新用户访问，而在这个时间间隔中访问了网站的用户会发生什么情况呢：

1. 如果先覆盖index.html，后覆盖a.js，用户在这个时间间隙访问，会得到新的index.html配合旧的a.js的情况，从而出现错误的页面。
2. 如果先覆盖a.js，后覆盖index.html，用户在这个间隙访问，会得到旧的index.html配合新的a.js的情况，从而也出现了错误的页面。

这就是为什么大型web应用在版本上线的过程中经常会较集中的出现前端报错日志的原因，也是一些互联网公司选择加班到半夜等待访问低峰期再上线的原因之一。此外，由于静态资源文件版本更新是“覆盖式”的，而页面需要通过修改query来更新，对于使用CDN缓存的web产品来说，还可能面临CDN缓存攻击的问题。我们再来观察一下前面说的版本更新手段：

```html
<script type="text/javascript" src="a.js?v=1.0.0"></script>
```

我们不难预测，a.js的下一个版本是“1.0.1”，那么就可以刻意构造一串这样的请求“a.js?v=1.0.1”、“a.js?v=1.0.2”、……让CDN将当前的资源缓存为“未来的版本”。这样当这个页面所用的资源有更新时，即使更改了链接地址，也会因为CDN的原因返回给用户旧版本的静态资源，从而造成页面错误。即便不是刻意制造的攻击，在上线间隙出现访问也可能导致区域性的CDN缓存错误。

此外，当版本有更新时，修改所有引用链接也是一件与工程管理相悖的事，至少我们需要一个可以“查找-替换”的工具来自动化的解决版本号修改的问题。

对付这个问题，目前来说最优方案就是 基于文件内容的hash版本冗余机制 了。也就是说，我们希望工程师源码是这么写的：

```html
<script type="text/javascript" src="a.js"></script>
```

但是线上代码是这样的：

```html
<script type="text/javascript" src="a_8244e91.js"></script>
```

其中”_82244e91”这串字符是根据a.js的文件内容进行hash运算得到的，只有文件内容发生变化了才会有更改。由于版本序列是与文件名写在一起的，而不是同名文件覆盖，因此不会出现上述说的那些问题。那么这么做都有哪些好处呢？

1. 线上的a.js不是同名文件覆盖，而是文件名+hash的冗余，所以可以先上线静态资源，再上线html页面，不存在间隙问题；
2. 遇到问题回滚版本的时候，无需回滚a.js，只须回滚页面即可；
3. 由于静态资源版本号是文件内容的hash，因此所有静态资源可以开启永久强缓存，只有更新了内容的文件才会缓存失效，缓存利用率大增；
4. 修改静态资源后会在线上产生新的文件，一个文件对应一个版本，因此不会受到构造CDN缓存形式的攻击

虽然这种方案是相比之下最完美的解决方案，但它无法通过手工的形式来维护，因为要依靠手工的形式来计算和替换hash只，并生成相应的文件将是一项非常繁琐且容易出错的工作。因此，我们需要借助工具。有了这样的思路，我们下面就来了解一下fis是如何完成这项工作的。

首先，之所以有这种工具需求，完全是因为web应用运行的根本机制决定的：web应用所需的资源是以字面的形式通知浏览器下载而聚合在一起运行的。这种资源加载策略使得web应用从本质上区别于传统桌面应用的版本更新方式，也是大型web应用需要工具处理的最根本原因。为了实现资源定位的字面量替换操作，前端构建工具理论上需要识别所有资源定位的标记，其中包括：

* css中的@import url(path)、background:url(path)、backgournd-image:url(path)、filter中的src
* js中的自定义资源定位函数，在fis中我们将其规定为__uri(path)。
* html中的`<script src=”path”>`、`<link href=”path”>`、`<img src=”path”>`、已经embed、audio、video、object等具有资源加载功能的标签。

为了工程上的维护方便，我们希望工程师在源码中写的是相对路径，而工具可以将其替换为线上的绝对路径，从而避免相对路径定位错误的问题（比如js中需要定位图片路径时不能使用相对路径的情况）。

![image2](/img/fis/image2.png)

fis有一个非常棒的资源定位系统，它是根据用户自己的配置来指定资源发布后的地址，然后由fis的资源定位系统识别文件中的定位标记，计算内容hash，并根据配置替换为上线后的绝对url路径。

要想实现具备hash版本生成功能的构建工具不是“查找-替换”这么简单的，我们考虑这样一种情况：

![image3](/img/fis/image3.png)

由于我们的资源版本号是通过对文件内容进行hash运算得到，如上图所示，index.html中引用的a.css文件的内容其实也包含了a.png的hash运算结果，因此我们在修改index.html中a.css的引用时，不能直接计算a.css的内容hash，而是要先计算出a.png的内容hash，替换a.css中的引用，得到了a.css的最终内容，再做hash运算，最后替换index.html中的引用。

这意味着构建工具需要具备“递归编译”的能力，这也是为什么fis团队不得不放弃gruntjs等task-based系统的根本原因。针对前端项目的构建工具必须是具备递归处理能力的。此外，由于文件之间的交叉引用等原因，fis构建工具还实现了构建缓存等机制，以提升构建速度。

在解决了基于内容hash的版本更新问题之后，我们可以将所有前端静态资源开启永久强缓存，每次版本发布都可以首先让静态资源全量上线，再进一步上线模板或者页面文件，再也不用担心各种缓存和时间间隙的问题了！

## 静态资源管理与模板框架

让我们再来看看前面的优化原则表还剩些什么：


| 优化方向        | 优化手段        |
| ------------- | ------------- |
| 请求数量 | 合并脚本和样式表，拆分初始化负载 |
| 请求带宽 | 移除重复脚本 |
| 缓存利用 | 使Ajax可缓存 |
| 页面结构 | 将样式表放在顶部，将脚本放在底部，尽早刷新文档的输出 |

很不幸，剩下的优化原则都不是使用工具就能很好实现的。或许有人会辩驳：“我用某某工具可以实现脚本和样式表合并”。嗯，必须承认，使用工具进行资源合并并替换引用或许是一个不错的办法，但在大型web应用，这种方式有一些非常严重的缺陷，来看一个很熟悉的例子：

![image4](/img/fis/image4.png)

某个web产品页面有A、B、C三个资源

![image5](/img/fis/image5.png)

工程师根据“减少HTTP请求”的优化原则合并了资源

![image6](/img/fis/image6.png)

产品经理要求C模块按需出现，此时C资源已出现多余的可能

![image7](/img/fis/image7.png)

C模块不再需要了，注释掉吧！但C资源通常不敢轻易剔除

![image8](/img/fis/image8.png)

不知不觉中，性能优化变成了性能恶化……

事实上，使用工具在线下进行静态资源合并是无法解决资源按需加载的问题的。如果解决不了按需加载，则势必会导致资源的冗余；此外，线下通过工具实现的资源合并通常会使得资源加载和使用的分离，比如在页面头部或配置文件中写资源引用及合并信息，而用到这些资源的html组件写在了页面其他地方，这种书写方式在工程上非常容易引起维护不同步的问题，导致使用资源的代码删除了，引用资源的代码却还在的情况。因此，在工业上要实现资源合并至少要满足如下需求：

1. 确实能减少HTTP请求，这是基本要求（合并）
2. 在使用资源的地方引用资源（就近依赖），不使用不加载（按需）
3. 虽然资源引用不是集中书写的，但资源引用的代码最终还能出现在页面头部（css）或尾部（js）
4. 能够避免重复加载资源（去重）

将以上要求综合考虑，不难发现，单纯依靠前端技术或者工具处理的是很难达到这些理想要求的。现代大型web应用所展示的页面绝大多数都是使用服务端动态语言拼接生成的。有的产品使用模板引擎，比如smarty、velocity，有的则干脆直接使用动态语言，比如php、python。无论使用哪种方式实现，前端工程师开发的html绝大多数最终都不是以静态的html在线上运行的，接下来我会讲述一种新的模板架构设计，用以实现前面说到那些性能优化原则，同时满足工程开发和维护的需要，这种架构设计的核心思想就是：

考虑一段这样的页面代码：

```html
<html>
    <head>
        <title>hello world</title>
        <link rel="stylesheet" type="text/css" href="A.css">
        <link rel="stylesheet" type="text/css" href="B.css">
        <link rel="stylesheet" type="text/css" href="C.css">
    </head>
    <body>
        <div>html of A</div>
        <div>html of B</div>
        <div>html of C</div>
    </body>
</html>
```

根据资源合并需求中的第二项，我们希望资源引用与使用能尽量靠近，这样将来维护起来会更容易一些，因此，理想的源码是：

```html
<html>
    <head>
        <title>hello world</title>
    </head>
    <body>
        <link rel="stylesheet" type="text/css" href="A.css"><div>html of A</div>
        <link rel="stylesheet" type="text/css" href="B.css"><div>html of B</div>
        <link rel="stylesheet" type="text/css" href="C.css"><div>html of C</div>
    </body>
</html>
```

当然，把这样的页面直接送达给浏览器用户是会有严重的页面闪烁问题的，所以我们实际上仍然希望最终页面输出的结果还是如最开始的截图一样，将css放在头部输出。这就意味着，页面结构需要有一些调整，并且有能力收集资源加载需求，那么我们考虑一下这样的源码：

```html
<html>
    <head>
        <title>hello world</title>
        <!--[CSS LINKS PLACEHOLDER]-->
    </head>
    <body>
        {require name="A.css"}<div>html of A</div>
        {require name="B.css"}<div>html of B</div>
        {require name="C.css"}<div>html of C</div>
    </body>
</html>
```

在页面的头部插入一个html注释“`<!--[CSS LINKS PLACEHOLDER]-->`”作为占位，而将原来字面书写的资源引用改成模板接口（require）调用，该接口负责收集页面所需资源。require接口实现非常简单，就是准备一个数组，收集资源引用，并且可以去重。最后在页面输出的前一刻，我们将require在运行时收集到的“A.css”、“B.css”、“C.css”三个资源拼接成html标签，替换掉注释占位“`<!--[CSS LINKS PLACEHOLDER]-->`”，从而得到我们需要的页面结构。

经过fis团队的总结，我们发现模板层面只要实现三个开发接口，既可以比较完美的实现目前遗留的大部分性能优化原则，这三个接口分别是：

1. require(String id)：收集资源加载需求的接口，参数是资源id。
2. widget(String template_id)：加载拆分成小组件模板的接口。你可以叫它为load、component或者pagelet之类的。总之，我们需要一个接口把一个大的页面模板拆分成一个个的小部分来维护，最后在原来的大页面以组件为单位来加载这些小部件。
3. script(String code)：收集写在模板中的js脚本，使之出现的页面底部，从而实现性能优化原则中的“将js放在页面底部”原则。

实现了这些接口之后，一个重构后的模板页面的源代码可能看起来就是这样的了：

```html
<html>
    <head>
        <title>hello world</title>
        <!--[CSS LINKS PLACEHOLDER]-->
        {require name="jquery.js"}
        {require name="bootstrap.css"}
    </head>
    <body>
        {require name="A/A.css"}{widget name="A/A.tpl"}
        {script}console.log('A loaded'){/script}


        {require name="B/B.css"}{widget name="B/B.tpl"}
        {require name="C/C.css"}{widget name="C/C.tpl"}

        <!--[SCRIPTS PLACEHOLDER]-->
    </body>
</html>
```

而最终在模板解析的过程中，资源收集与去重、页面script收集、占位符替换操作，最终从服务端发送出来的html代码为：

```html
<html>
    <head>
        <title>hello world</title>
        <link rel="stylesheet" type="text/css" href="bootstrap.css">
        <link rel="stylesheet" type="text/css" href="A/A.css">
        <link rel="stylesheet" type="text/css" href="B/B.css">
        <link rel="stylesheet" type="text/css" href="C/C.css">
    </head>
    <body>
        <div>html of A</div>
        <div>html of B</div>
        <div>html of C</div>
        <script type="text/javascript" src="jquery.js"></script>
        <script type="text/javascript">console.log('A loaded');</script>
    </body>
</html>
```
不难看出，我们目前已经实现了“按需加载”，“将脚本放在底部”，“将样式表放在头部”三项优化原则。

前面讲到静态资源在上线后需要添加hash戳作为版本标识，那么这种使用模板语言来收集的静态资源该如何实现这项功能呢？答案是：静态资源依赖关系表。
假设前面讲到的模板源代码所对应的目录结构为下图所示：

![image9](/img/fis/image9.png)

那么我们可以使用工具扫描整个project目录，然后创建一张资源表，同时记录每个资源的部署路径，可以得到这样的一张表：

```javascript
{
    "res": {
        "A/A.css": {
            "uri": "/A/A_1688c82.css",
            "type": "css"
        },
        "B/B.css": {
            "uri": "/B/B_52923ed.css",
            "type": "css"
        },
        "C/C.css": {
            "uri": "/C/C_6dda653.css",
            "type": "css"
        },
        "bootstrap.css": {
            "uri": "bootstrap_08f2256.css",
            "type": "css"
        },
        "jquery.js": {
            "uri": "jquery_9155343.css",
            "type": "js"
        },
    },
    "pkg": {}
}
```

基于这张表，我们就很容易实现 {require name=”id”} 这个模板接口了。只须查表即可。比如执行{require name=”jquery.js”}，查表得到它的url是“/jquery_9151577.js”，声明一个数组收集起来就好了。这样，整个页面执行完毕之后，收集资源加载需求，并替换页面的占位符，即可实现资源的hash定位，得到：

```html
<html>
    <head>
        <title>hello world</title>
        <link rel="stylesheet" type="text/css" href="bootstrap_08f2256.css">
        <link rel="stylesheet" type="text/css" href="A/A_1688c82.css">
        <link rel="stylesheet" type="text/css" href="B/B_52923ed.css">
        <link rel="stylesheet" type="text/css" href="C/C_6dda653.css">
    </head>
    <body>
        <div>html of A</div>
        <div>html of B</div>
        <div>html of C</div>
        <script type="text/javascript" src="jquery_9155343.js"></script>
        <script type="text/javascript">console.log('A loaded');</script>
    </body>
</html>
```

接下来，我们讨论如何在基于表的设计思想上是如何实现静态资源合并的。或许有些团队使用过combo服务，也就是我们在最终拼接生成页面资源引用的时候，并不是生成多个独立的link标签，而是将资源地址拼接成一个url路径，请求一种线上的动态资源合并服务，从而实现减少HTTP请求的需求，比如：

```html
<html>
    <head>
        <title>hello world</title>
        <link rel="stylesheet" type="text/css" href="/combo?files=bootstrap_08f2256.css,A/A_1688c82.css,B/B_52923ed.css,C/C_6dda653.css">
    </head>
    <body>
        <div>html of A</div>
        <div>html of B</div>
        <div>html of C</div>
        <script type="text/javascript" src="jquery_9155343.js"></script>
        <script type="text/javascript">console.log('A loaded');</script>
    </body>
</html>
```

这个“/combo?files=file1,file2,file3,…”的url请求响应就是动态combo服务提供的，它的原理很简单，就是根据get请求的files参数找到对应的多个文件，合并成一个文件来响应请求，并将其缓存，以加快访问速度。

这种方法很巧妙，有些服务器甚至直接集成了这类模块来方便的开启此项服务，这种做法也是大多数大型web应用的资源合并做法。但它也存在一些缺陷：

1. 浏览器有url长度限制，因此不能无限制的合并资源。
2. 如果用户在网站内有公共资源的两个页面间跳转访问，由于两个页面的combo的url不一样导致用户不能利用浏览器缓存来加快对公共资源的访问速度。

对于上述第二条缺陷，可以举个例子来看说明：

* 假设网站有两个页面A和B
* A页面使用了a，b，c，d四个资源
* B页面使用了a，b，e，f四个资源
* 如果使用combo服务，我们会得：
    * A页面的资源引用为：/combo?files=a,b,c,d
    * B页面的资源引用为：/combo?files=a,b,e,f
* 两个页面引用的资源是不同的url，因此浏览器会请求两个合并后的资源文件，跨页面访问没能很好的利用a、b这两个资源的缓存。

很明显，如果combo服务能聪明的知道A页面使用的资源引用为“/combo?files=a,b”和“/combo?files=c,d”，而B页面使用的资源引用为“/combo?files=a,b”，“/combo?files=e,f”就好了。这样当用户在访问A页面之后再访问B页面时，只需要下载B页面的第二个combo文件即可，第一个文件已经在访问A页面时缓存好了的。

基于这样的思考，fis在资源表上新增了一个字段，取名为“pkg”，就是资源合并生成的新资源，表的结构会变成：

```javascript
{
    "res": {
        "A/A.css": {
            "uri": "/A/A_1688c82.css",
            "type": "css"
        },
        "B/B.css": {
            "uri": "/B/B_52923ed.css",
            "type": "css"
        },
        "C/C.css": {
            "uri": "/C/C_6dda653.css",
            "type": "css"
        },
        "bootstrap.css": {
            "uri": "bootstrap_08f2256.css",
            "type": "css"
        },
        "jquery.js": {
            "uri": "jquery_9155343.css",
            "type": "js"
        },
    },
    "pkg": {
        "p0": {
            "uri": "/pkg/utils_b967346.css",
            "type": "css",
            "has": ["bootstrap.css", "A/A.css"]
        },
        "p1": {
            "uri": "/pkg/others_0d4552a.css",
            "type": "css",
            "has": ["B/B.css", "C/C.css"]
        }
    }
}
```

相比之前的表，可以看到新表中多了一个pkg字段，并且记录了打包后的文件所包含的独立资源。这样，我们重新设计一下{require name=”id”}这个模板接口：在查表的时候，如果一个静态资源有pkg字段，那么就去加载pkg字段所指向的打包文件，否则加载资源本身。比如执行{require name=”bootstrap.css”}，查表得知bootstrap.css被打包在了“p0”中，因此取出p0包的url“/pkg/utils_b967346.css”，并且记录页面已加载了“bootstrap.css”和“A/A.css”两个资源。这样一来，之前的模板代码执行之后得到的html就变成了：


```html
<html>
    <head>
        <title>hello world</title>
        <link rel="stylesheet" type="text/css" href="pkg/utils_b967346.css">
        <link rel="stylesheet" type="text/css" href="pkg/others_0d4552a.css">
    </head>
    <body>
        <div>html of A</div>
        <div>html of B</div>
        <div>html of C</div>
        <script type="text/javascript" src="jquery_9155343.js"></script>
        <script type="text/javascript">console.log('A loaded');</script>
    </body>
</html>
```

css资源请求数由原来的4个减少为2个。
这样的打包结果是怎么来的呢？答案是配置得到的。
我们来看一下带有打包结果的资源表的fis配置：

```javascript
fis.config.set('pack', {
    'pkg/util.css': [ 'bootstrap.css', 'A/A.css'],
    'pkg/other.css': [ '**.css' ]
});
```

我们将“bootstrap.css”、“A/A.css”打包在一起，其他css另外打包，从而生成两个打包文件，当页面需要打包文件中的资源时，模块框架就会收集并计算出最优的资源加载结果，从而解决静态资源合并的问题。

这样做的原因是为了弥补combo在前面讲到的两点技术上的不足而设计的。但也不难发现这种打包策略是需要配置的，这就意味着维护成本的增加。但好在它有两个优势可以一定程度上弥补这个问题：

1. 打包的资源只是原来独立资源的备份。打包与否不会导致资源的丢失，最多是没有合并的很好而已。
2. 配置可以由工程师根据经验人工维护，也可以由统计日志生成，这为性能优化自适应网站设计提供了非常好的基础。

关于第二点，fis有这样辅助系统来支持自适应打包算法：

![image10](/img/fis/image10.png)

至此，我们通过基于表的静态资源管理系统和三个模板接口实现了几个重要的性能优化原则，现在我们再来回顾一下前面的性能优化原则分类表，剔除掉已经做到了的，看看还剩下哪些没做到的：

| 优化方向        | 优化手段        |
| ------------- | ------------- |
| 请求数量 | 拆分初始化负载 |
| 请求带宽 | 拆分初始化负载 |
| 缓存利用 | 使Ajax可缓存 |
| 页面结构 | 尽早刷新文档的输出 |

“拆分初始化负载”的目标是将页面一开始加载时不需要执行的资源从所有资源中分离出来，等到需要的时候再加载。工程师通常没有耐心去区分资源的分类情况，但我们可以利用组件化框架接口来帮助工程师管理资源的使用。还是从例子开始思考：

```html
<html>
<head>
    <title>hello world</title>
    {require name="jquery.js"}
</head>
<body>
    <button id="myBtn">Click Me</button>
    {script}
        $('#myBtn').click(function(){
            var dialog = require('dialog/dialog.js');
            dialog.alert('you catch me!');
        });
    {/script}

    <!--[SCRIPTS PLACEHOLDER]-->
</body>
</html>
```

在fis给百度内部团队开发的架构中，如果这样书写代码，页面最终的执行结果会变成：

```html
<html>
<head>
    <title>hello world</title>
</head>
<body>
    <button id="myBtn">Click Me</button>
    <script type="text/javascript" src="/jquery_9151577.js"></script>
    <script type="text/javascript" src="/dialog/dialog_ae8c228.js"></script>
    <script type="text/javascript">
    $('#myBtn').click(function(){
        var dialog = require('dialog/dialog.js');
        dialog.alert('you catch me!');
    });
    </script>

    <!--[SCRIPTS PLACEHOLDER]-->
</body>
</html>
```

fis系统会分析页面中require(id)函数的调用，并将依赖关系记录到资源表对应资源的deps字段中，从而在页面渲染查表时可以加载依赖的资源。但此时dialog.js是以script标签的形式同步加载的，这样会在页面初始化时出现资源的浪费。因此，fis团队提供了require.async的接口，用于异步加载一些资源，源码修改为：

```html
<html>
<head>
    <title>hello world</title>
    {require name="jquery.js"}
</head>
<body>
    <button id="myBtn">Click Me</button>
    {script}
        $('#myBtn').click(function() {
            require.async('dialog/dialog.js', function( dialog ) {
                dialog.alert('you catch me!');
            });
        });
    {/script}

    <!--[SCRIPTS PLACEHOLDER]-->
</body>
</html>
```

这样书写之后，fis系统会在表里以async字段来标准资源依赖关系是异步的。fis提供的静态资源管理系统会将页面输出的结果修改为：

```html
<html>
<head>
    <title>hello world</title>
</head>
<body>
    <button id="myBtn">Click Me</button>
    <script type="text/javascript" src="/jquery_9151577.js"></script>
    <script type="text/javascript" src="/dialog/dialog_ae8c228.js"></script>
    <script type="text/javascript">
    $('#myBtn').click(function() {
        require.async('dialog/dialog.js', function( dialog ) {
            dialog.alert('you catch me!');
        });
    });
    </script>

    <!--[SCRIPTS PLACEHOLDER]-->
</body>
</html>
```

dialog.js不会在页面以script src的形式输出，而是变成了资源注册，这样，当页面点击按钮触发require.async执行的时候，async函数才会查表找到资源的url并加载它，加载完毕后触发回调函数。

到目前为止，我们又以架构的形式实现了一项优化原则（拆分初始化负载），回顾我们的优化分类表，现在仅有两项没能做到了：

| 优化方向        | 优化手段        |
| ------------- | ------------- |
| 缓存利用 | 使Ajax可缓存 |
| 页面结构 | 尽早刷新文档的输出 |

剩下的两项优化原则要做到并不容易，真正可缓存的Ajax在现实开发中比较少见，而尽早刷新文档的输出的情况facebook在2010年的velocity上提到过，就是BigPipe技术。当时facebook团队还讲到了Quickling和PageCache两项技术，其中的PageCache算是比较彻底的实现Ajax可缓存的优化原则了。fis团队也曾与某产品线合作基于静态资源表、模板组件化等技术实现了页面的PipeLine输出、以及Quickling和PageCache功能，但最终效果没有达到理想的性能优化预期，因此这两个方向尚在探索中，相信在不久的将来会有新的突破。

## 总结

其实在前端开发工程管理领域还有很多细节值得探索和挖掘，提升前端团队生产力水平并不是一句空话，它需要我们能对前端开发及代码运行有更深刻的认识，对性能优化原则有更细致的分析与研究。fis团队一直致力于从架构而非经验的角度实现性能优化原则；解决前端工程师开发、调试、部署中遇到的工程问题；提供组件化框架，提高代码复用率；提供开发工具集，提升工程师的开发效率。在前端工业化开发的所有环节均有可节省的人力成本，这些成本非常可观，相信现在很多大型互联网公司也都有了这样的共识。
本文只是将这个领域中很小的一部分知识的展开讨论，抛砖引玉，希望能为业界相关领域的工作者提供一些不一样的思路。欢迎关注[fis](https://github.com/fex-team/fis-plus)项目，对本文有任何意见或建议都可以在fis开源项目中进行反馈和讨论。