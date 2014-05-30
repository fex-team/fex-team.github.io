---
layout: post
title: 前端数据之美 -- 基础篇
author: zhangjunah
---

## 引言

> 对于一个成熟的产品来说，隐藏在产品背后的数据分析是非常重要的，也是必不可少的。特别是在重视用户体验的今天，需要我们及时了解产品的使用情况，分析数据中隐藏的信息，为产品的提升和改进提供数据支撑。

随着 web 技术的蓬勃发展，前端的展示、交互越来越复杂，在用户的访问、操作过程中产生了大量的数据。由此，前端的数据分析也变得尤为重要。当然，对于站长来说，你可以使用[百度统计](http://tongji.baidu.com)等各种已有的服务平台，但是，如果现有的统计平台不能满足你的需要，你想开发自己定制化的数据统计平台，或者你是一个纯粹的 geek，想了解背后隐藏的技术，又或者你对前端的数据统计感兴趣，本文就能满足你那颗好奇的心。下面就逐步描述前端有哪些数据、如何采集前端的数据、以及如何展示数据统计的结果。

## 有哪些？

前端的数据其实有很多，从大众普遍关注的 [PV](http://baike.baidu.com/subview/40888/5000818.htm)、[UV](http://baike.baidu.com/subview/595240/9307972.htm)、广告点击量，到客户端的网络环境、登陆状态，再到浏览器、操作系统信息，最后到页面性能、JS 异常，这些数据都可以在前端收集到。数据很多、很杂，不进行很好的分类肯定会导致统计混乱，也不利于统计代码的组织，下面就对几种普遍的数据需求进行了分类：

### 1、访问

访问数据是基于用户每次在浏览器上打开目标页面来统计的，它是**以 PV 为粒度的统计**，一个 PV 只统计一次访问数据。访问数据可以算作是最基础、覆盖面最广的一种统计，可以统计到很多的指标项，下面列出了一些较为常见的指标项：

+ **PV/UV**：最基础的 PV（页面访问数量）、UV（独立访问用户数量）
+ **页面来源**：页面的 refer，可以定位页面的入口
+ **操作系统**：了解用户的 OS 状况，帮助分析用户群体的特征，特别是移动端，iOS 和 Android 的分布就更有意义了
+ **浏览器**：可以统计到各种浏览器的占比，对于是否继续兼容 IE6、新技术（HTML5、CSS3 等）的运用等调研提供参考价值
+ **分辨率**：对页面设计提供参考，特别是[响应式设计](http://baike.baidu.com/view/9876268.htm)
+ **登录率**：百度也开始看重登陆，登陆用户具有更高的分析价值，引导用户登陆是非常重要的
+ **地域分布**：访问用户在地理位置上的分布，可以针对不同地域做运营、活动等
+ **网络类型**：wifi/3G/2G，为产品是否需要适配不同网络环境做决策
+ **访问时段**：掌握用户访问时间的分布，引导消峰填谷、节省带宽
+ **停留时长**：判断页面内容是否具有吸引力，对于需要长时间阅读的页面比较有意义
+ **到达深度**：和停留时长类似，例如[百度百科](http://baike.baidu.com/view/1758.htm)，用户浏览时的页面到达深度直接反映词条的质量

### 2、性能

页面 DOM 结构越来越复杂，但是又要追求用户体验，这就对页面的性能提出了更高的要求。性能的监控数据主要是用来衡量页面的流畅程度，也有一些主要的指标：

+ **白屏时间**：用户从打开页面开始到页面开始有东西呈现为止，这过程中占用的时间就是白屏时间
+ **首屏时间**：用户浏览器首屏内所有内容都呈现出来所花费的时间
+ **用户可操作时间**：用户可以进行正常的点击、输入等操作
+ **页面总下载时间**：页面所有资源都加载完成并呈现出来所花的时间，即页面 onload 的时间
+ **自定义的时间点**：对于开发人员来说，完全可以自定义一些时间点，例如：某个组件 init 完成的时间、某个重要模块加载的时间等等

这里只是解释了这些指标的含义，具体的判断、统计方式在后续发出的文章中会详细介绍。

### 3、点击

在用户的所有操作中，**点击**应该是最为主要的一个行为，包含了：pc 端鼠标的 click，移动端手指的 touch。用户的每次点击都是一次诉求，从点击数据中可以挖掘的信息其实有很多，下面只列出了我们目前所关注的指标：

+ **页面总点击量**
+ **人均点击量**：对于导航类的网页，这项指标是非常重要的
+ **流出 url**：同样，导航类的网页，直接了解网页导流的去向
+ **点击时间**：用户的所有点击行为，在时间上的分布，反映了用户点击操作的习惯
+ **首次点击时间**：同上，但是只统计用户的第一次点击，如果该时间偏大，是否就表明页面很卡导致用户长时间不能点击呢？
+ **点击热力图**：根据用户点击的位置，我们可以画出整个页面的点击热力图，可以很直观的了解到页面的热点区域

### 4、异常

这里的异常是指 JS 的异常，用户的浏览器上报 JS 的 bug，这会极大地降低用户体验，对于浏览器型号、版本满天飞的今天，再 NB 的程序员也难免会有擦枪走火的时候，当然 QA 能够覆盖到大部分的 bug，但肯定也会有一些 bug 在线上出现。JS 的异常捕获只有两种方式：**window.onerror**、**try/catch**，关于我们是如何做的将在后续的文章中有详细的描述，这里只列出捕获到异常时，一般需要采集哪些信息（主要用来 debug 异常）：

+ **异常的提示信息**：这是识别一个异常的最重要依据，如：'e.src' 为空或不是对象
+ **JS 文件名**
+ **异常所在行**
+ **发生异常的浏览器**
+ **堆栈信息**：必要的时候需要函数调用的堆栈信息，但是注意堆栈信息可能会比较大，需要截取

### 5、其他

除了上面提到的 4 类基本的数据统计需求，我们当然还可以根据实际情况来定义一些其他的统计需求，如用户浏览器对 canvas 的支持程度，再比如比较特殊的 -- 用户进行轮播图翻页的次数，这些数据统计需求都是前端能够满足的，每一项统计的结果都体现了前端数据的价值。

## 如何采集？

在前端，通过注入 JS 脚本，使用一些 JS API（如：!!window.localStorage 就可以检验浏览器是否支持 localStorage）或者监听一些事件（如：click、window.onerror、onload 等）就可以得到数据。捕获到这些数据之后，需要将数据发送回服务器端，一般都是采用访问一个固定的 url，把数据作为该 url 的 query string，如：http://www.baidu.com/u.gif?data1=hello&data2=hi。 

在实践的过程中我们抽离了一套用于前端统计的框架[alog](https://github.com/fex-team/alog)，方便开发者书写自己的统计脚本，具体的使用方法和 API 见[github](https://github.com/fex-team/alog)。下面就使用 alog 来简单说明如何进行前端数据的采集：

例如：**你需要统计页面的 PV，顺便加上页面来源（refer）**

```javascript
// 加载 alog，alog 是支持异步的
void function(e,t,n,a,o,i,m){
e.alogObjectName=o,e[o]=e[o]||function(){(e[o].q=e[o].q||[]).push(arguments)},e[o].l=e[o].l||+new Date,i=t.createElement(n),i.asyn=1,i.src=a,m=t.getElementsByTagName(n)[0],m.parentNode.insertBefore(i,m)
}(window,document,"script","http://uxrp.github.io/alog/dist/alog.min.js","alog");

// 定义一个统计模块 pv
alog('define', 'pv', function(){ 
   var pvTracker = alog.tracker('pv');
   pvTracker.set('ref', document.referrer); // 设定 ref 参数
   return pvTracker;
});

// 创建一个 pv 统计模块的实例
alog('pv.create', {
    postUrl: 'http://localhost/u.gif' // 指定上传数据的 url 地址
});

// 上传数据
alog('pv.send', "pageview"); // 指明是 pageview
```
在页面上部署上面的代码，浏览器将会发送下面的 http 请求：

```javascript
    http://localhost/u.gif?t=pageview&ref=yourRefer
```

再例如：**JS 异常的采集，需要进行事件监听**

```javascript
// 加载 alog
void function(e,t,n,a,o,i,m){
e.alogObjectName=o,e[o]=e[o]||function(){(e[o].q=e[o].q||[]).push(arguments)},e[o].l=e[o].l||+new Date,i=t.createElement(n),i.asyn=1,i.src=a,m=t.getElementsByTagName(n)[0],m.parentNode.insertBefore(i,m)
}(window,document,"script","http://uxrp.github.io/alog/dist/alog.min.js","alog");

// 定义一个统计模块 err
alog('define', 'err', function(){ 
   var errTracker = alog.tracker('err');
   window.onerror = function(message, file, line) { //监听 window.onerror
        errTracker.send('err', {msg:message, js:file, ln:line});
    };
   return errTracker;
});

// 创建一个 err 统计模块的实例
alog('err.create', {
    postUrl: 'http://localhost/u.gif'
});
```
这时，只要页面中 JS 发生异常，就会发送如下面的 HTTP 请求

```javascript
    http://localhost/u.gif?t=err&msg=errMessage&js=jsFileName&ln=errLine
```

## 如何展示

采集到数据之后，经过一系列的数据处理、汇总等操作之后，我们需要使用生动的图表来呈现数据，让用户（产品决策者、开发人员等）能够方便、快捷的看懂数据。我们推荐使用百度的开源 javascript 图表库[ECharts](http://echarts.baidu.com/)。下面列举几个常见的数据展示方式：

**浏览器的占比情况：**

![browser](/img/front_end-data/browser.png)

**用户的登陆情况**

![login](/img/front_end-data/login.png)

**用户的地理位置分布**

![location](/img/front_end-data/location.png)

有些时候需要看多天的波动情况，例如**浏览器的多天占比波动情况**

![stack](/img/front_end-data/stack.png)

还有些时候你可能需要使用一些表格来展示：

![feature](/img/front_end-data/feature.png)

![search](/img/front_end-data/search.png)

## 总结

前端的数据有很多的分析价值，它是线上用户的真实反馈，直接体现着产品的用户体验。根据文中描述的步骤，你完全可以搭建自己的前端数据平台。

该文写在[w3ctech](http://www.w3ctech.com/)的[走进名企 - 百度前端 FEX 专场](http://www.w3ctech.com/event/34)之后，分享时的 PPT 在[这里](https://speakerdeck.com/baidufe/bai-du-qian-duan-ji-chu-shu-ju-ping-tai-jie-shao)，视频在[这里](http://v.youku.com/v_show/id_XNjk2NDYyNDI0.html)。

