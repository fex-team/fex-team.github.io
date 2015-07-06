---
layout: post
title: 前端自动化测试探索
author: zhangtao
shortname: front-end-test
---


## 背景

测试是完善的研发体系中不可或缺的一环。前端同样需要测试，你的css改动可能导致页面错位、js改动可能导致功能不正常。由于前端偏向GUI软件的特殊性，尽管测试领域工具层出不穷，在前端的自动化测试上面却实施并不广泛，很多人依旧以手工测试为主。本文试图探讨前端自动化测试领域的工具和实践。

## 为什么需要自动化测试

一个项目最终会经过快速迭代走向以维护为主的状态，在合理的时机以合理的方式引入自动化测试能有效减少人工维护成本。自动化测试的收益可以简单总结为：

```
自动化的收益 = 迭代次数 * 全手动执行成本 - 首次自动化成本 - 维护次数 * 维护成本
```

对于自动化测试来说，相对于发现未知的问题，**更倾向于避免可能的问题**。

## 可测试方向 

首先本文**不会探讨单元测试方向**，因为单测已经有完善的工具体系。但前端开发中，除了一些框架和库，愿意去写单测的少之又少。另外单测维护成本较高，而且也没法满足前端测试的所有需求。

前端自动化测试可以在几个方向进行尝试：

 - **界面回归测试** 
   测试界面是否正常，这是前端测试最基础的环节
   
 - **功能测试**
   测试功能操作是否正常，由于涉及交互，这部分测试比界面测试会更复杂
   
 - **性能测试**
   页面性能越来越受到关注，并且性能需要在开发过程中持续关注，否则很容易随着业务迭代而下降。

 - **页面特征检测**
   有些动态区域无法通过界面对比进行测试、也没有功能上的异常，但可能不符合需求。例如性能测试中移动端大图素材检测就是一种特征检测，另外常见的还有页面区块静态资源是否符合预期等等。


## 业界开源工具

工欲善其事，必先利其器。业界在自动化测试领域已经有不少优秀的框架和库，善于利用能事半功倍。

### 界面回归测试

界面回归测试常见的做法有**像素对比**和**dom结构对比**两个方向。

#### 像素对比

像素对比基本的思想认为，如果网站没有因为你的改动而界面错乱，那么在截图上测试页面应当跟正常页面保持一致。可以跟线上正常页面对比或者页面历史记录对比。像素对比能直观的显示图像上的差异，如果达到一定阈值则页面可能不正常。

**[PhantomCSS](https://github.com/Huddle/PhantomCSS)**

像素对比比较出名的工具是[PhantomCSS](https://github.com/Huddle/PhantomCSS)。 PhantomCSS结合了
[Casperjs](http://casperjs.readthedocs.org/)截图和[ResembleJs](http://huddle.github.io/Resemble.js/) 图像对比分析。单纯从易用性和对比效果来说还是不错的。

![](/img/front-end-test/diff.png)

**不支持PhantomJS 2.0的问题**

由于PhantomJS 2.0暂时禁用了文件上传，PhantomCSS默认不支持PhantomJS 2.0 。如果还是想使用可以修改源码中获取图片文件的方式，改为通过ajax获取同域名下文件的方式，具体可以参考ResembleJs官网示例。

**如何测试多浏览器**

如果想测试多浏览器下的兼容性情况，只需要拿到多个浏览器下的截图即可。多浏览器测试最出名的当属[selenium](http://www.seleniumhq.org/) , selenium可以自动化的获取多个浏览器下的截图，前端工程师来说还可以借助Node的[webdriver](http://webdriver.io/) 来轻松开发测试脚本。

但selenium的安装和上手成本要稍大些，而且对于多浏览器来说，各个浏览器之间的兼容性对比容易出错。不同浏览器截图可能一像素的偏差就导致截屏对比失败，多浏览器可能**更适用回归性测试**。

**响应式页面测试**

国外有人将像素对比应用到了响应式页面上，如果您针对PC和移动设备使用同一个网页，响应式测试可以很快的回归你的页面在不同尺寸上的页面是否正常。与单纯针对移动端开发的响应式不同，同时支持PC移动的页面更容易发生错乱。

例如[BackstopJS][BackstopJS] 项目，便是通过PhantomJS、capserJS等工具在不同尺寸下截图然后根据resemberJS进行像素比对判断是否正常:

![](/img/front-end-test/BackstopJS.png)

**像素对比需要注意的问题**

 - 不建议对网站所有页面进行测试
   这只会导致很容易出现告警，但不一定是错误。针对重复使用的组件和样式、容易出问题的区域测试更加有效
 
 - 推荐测试区域而不是整个页面
   整个页面的测试导致任何一点文字、图像等动态的改变都可能导致不通过，而且真正的错误可能由于图像太大而被阈值忽略。图像越大对比也越容易超时。
  
 - 隐藏动态区域
  在选择器对应的区域如果有动态元素，可以同样通过选择器来隐藏

 - 界面对比只是一个环节，需与其他测试相结合
  没有银弹，合理结合才是关键





#### dom结构对比

像素对比虽然直观，但动态元素居多且无法保证测试页面与线上页面同步时有所局限。[@云龙][fouber]大牛针对这个问题提供了新的解决方案[page-monitor](https://github.com/fouber/page-monitor)，根据dom结构与样式的对比来对比整个页面的变动部分。
使用效果示例：

![](/img/front-end-test/pagemonitor.png)

通过page-monitor你可以很快的搭建一个监控系统，监控页面的文字、样式等变动情况。


像素对比和dom结构对比各有优势，但也无法解决全部问题。何不综合利用呢？FEX部门QA同事就结合了两种方式提供了pagediff平台，正在对外公测中！有兴趣可以体验一把吧~ http://pagediff.baidu.com

QA同学开发的平台都这么炫，作为前端怎么能不了解一点测试知识呢？

### 用户操作测试

上面提到界面回归测试**无法取代功能测试**。即便是界面正常，功能正常也是必须关注的部分。最直接的功能测试就是模拟用户操作，通过模拟正常的操作流程来判断页面展现是否符合预期。

**[Phantomjs](http://phantomjs.org/)、[CasperJS](http://casperjs.readthedocs.org/en/latest/)**

大名鼎鼎的PhantomJS当然要隆重介绍啦！前面界面对比测试基本都是基于PhantomJS开发的， Phantom JS是一个服务器端的 JavaScript API 的 WebKit。其支持各种Web标准： DOM 处理, CSS 选择器, JSON, Canvas, 和 SVG。对于web测试、界面、网络捕获、页面自动化访问等等方面可以说是信手拈来。

casperjs是对PhantomJS的封装，提供了更加易用的API, 增强了测试等方面的支持。例如通过CasperJS可以轻松实现贴吧的自动发帖功能：

```javascript
casper.test.begin('测试发帖功能', function suite(test) {   
    //登录百度
    casper.loginBaidu();//实现略，可以通过cookie或者表单登录实现
    casper.thenOpen('http://tieba.baidu.com/p/3817915520', function () {  
        var text = "楼主好人";
        //等待发帖框出现
        this.waitForSelector(
            '#ueditor_replace', 
            function() {
                //开始发帖
                this.echo("开始发帖。发帖内容: " + text,"INFO");
                //执行js
                this.page.evaluate(function(text) {
                    $("#ueditor_replace").text(text);
                    $("a.poster_submit").click();//点击提交
                },text);
            },function(){
                test.fail("找不到发帖框#ueditor_replace");
            }
        );
    })
    .run(function () {
        test.done();
    });
});
```

通过前端最熟悉的语言，短短几十行代码便可轻松实现自动发帖的功能，还可以在其中添加一些测试逻辑来完善case。

相对于单测来说，casperjs能用简单的API、从真实用户操作的角度来快速测试网站的功能是否正常，并且可以保留每一步测试的截图最终实现操作流可视化。例如下面这个[GitHub项目](https://github.com/magento-hackathon/hackathon-casperjs)便使用Casperjs测试一个电子商务网站的登录、下单等重要流程是否正常。case完善之后一条命令便可测试整个网站。

casperjs能监听测试和页面的各个状态进行截图等操作，如果针对测试运行结果稍作优化，便可以形成一个可视化操作流：

![](/img/front-end-test/casper_test.png)

通过这个能直观的看到各个操作的情况以及错误的步骤(如有错误图片将飘红)，下面则可以看到casper 测试的详细日志输出。


**不想维护case?**

除非有足够的QA同学来帮你完成测试工作，否则通过人工来回归肯定会消耗更多的精力。在项目功能基本稳定期，维护case会简单的多，而且同样建议针对网站核心功能而不是所有功能来添加case。


**浏览器兼容测试**

当然selenium同样支持操作测试，类似的工具还有[dalekjs](http://dalekjs.com/)等，如果想专门针对IE测试，可以考虑[triflejs]http://triflejs.org/,它提供了与PhantomJS基本类似的API。

**PhantomFlow操作对比测试**

有没有像图像对比一样直观，又能比较简单的写case的工具呢？可以考虑[PhantomFlow][PhantomFlow], PhantomFlow假定如果页面正常，那么`在相同的操作下，测试页面与正常页面的展现应该是一样`的。 基于这点，用户只需要定义一系列操作流程和决策分支，然后利用PhantomCSS进行截图和图像对比。最后在一个很赞的可视化报表中展现出来。可以看下作者所在公司进行的测试可视化图表：

![](/img/front-end-test/huddle-vis.png)

图片中代表不同的操作，每个操作有决策分支，每个绿色的点代表图像对比正常，如果是红色则代表异常。点击进去可以查看操作的详情：

![](/img/front-end-test/tree-vis.png)

不得不说这是一个不错的构思，它将操作测试的case浓缩成决策树，用户只需要定义进行何种操作并对关键部分进行截图即可。如果网站偏向静态或者能保证沙盒地址数据一致性，那么用这个测试工具能有效提高实施自动化测试的效率。


### 性能测试

网站展现性能也越来越成为人们关注的点，尤其是移动端性能始终是一个影响体验的重要因素。一般开发者都会利用自动化工具对资源进行合并压缩等优化，很多大公司也都搭建自己的性能监控系统指导优化工作。性能监控可以参考我的另一篇文章[七天打造前端性能监控系统](http://fex.baidu.com/blog/2014/05/build-performance-monitor-in-7-days/)。

需要注意的是性能并不是一个目标，而是开发、测试过程中需要持续关注的问题。我们有自动化的工具和框架在开发时进行优化，同样可以借助工具在测试时进行性能测试。

这里推荐一个通样是基于PhantomJS的工具[Phantomas](https://github.com/macbre/phantomas),它能运行测试页面获取很多性能指标，`加载时间、页面请求数、资源大小、是否开启缓存和Gzip、选择器性能、dom结构`等等诸多指标都能一次性得到，并且有相应的[grunt插件](https://github.com/stefanjudis/grunt-phantomas)。你也可以对检测指标进行二次开发，例如移动端定义一个最大图片大小的规则，在开发的时候如果使用了超过限制的大图则进行告警。不过如果把加载过程中的时间点作为常规的测试监控，则最好模拟移动端网络环境。


### 页面特征检测与实践

前面讲到性能测试中测试资源大小其实就属于一种资源特征，诸如此类我们还可以开发一些通用的测试规则，以测试页面是否正常。这种测试主要适用于在界面和操作上无法直接进行判断的元素。例如页面中广告部署是否正常。

#### 广告部署检测实践

第三方部署广告以及物料配置的时候容易出现问题，例如代码脚本升级出错、部署错误、物料尺寸格式不对、广告容器未适配多种屏幕大小、广告是否可见、时效广告是否展现等。已知的问题就有很多，如果出现问题时由广告系统的人员挨个检测是一个很耗费人力的过程。而这些特征都是跟实际运行环境相关的，大部分都可以通过casperjs之类的工具来进行检测。

另外与广告相关的还有屏蔽检测等，检测页面div广告区块(非iframe广告)是否被拦截插件所拦截。由于拦截插件使用的基本相同的拦截规则，而且对于div广告采用的是选择器屏蔽，检测过程中只需要根据相关的检测规则判断选择器是否存在页面中即可。这在casperjs中一个api即可搞定:

```javascript
if(casper.exist(selector)){
    casper.captureSelector(filename,selector);
}
```

这样便能直接截图被拦截的区域了。

#### 与自动化测试的结合

回到刚才的需求，如何通过casperjs实现这些检测需求呢。casperjs支持执行JS来获取返回结果：

```javascript

this.page.evaluate(function(text) {
    $("#ueditor_replace").text(text);
    $("a.poster_submit").click();//点击提交
},text);

```

而且可以主动注入jquery或者zepto等框架，这样你就可以以非常简单的方式来操作分析dom元素了。例如根据html结构特征获取部署类型、自动扫描广告检测容器宽度、获取广告的选择器来进行截屏等。如果页面有报错可以通过casper的api进行监听：

```javascript

casper.on("page.error", function(msg, trace) {
    this.echo(msg,'WARNING');
    //详细错误信息
    if(trace){
        this.echo("Error:    " + msg, "ERROR");
        this.echo("file:     " + trace[0].file, "WARNING");
        this.echo("line:     " + trace[0].line, "WARNING");
        this.echo("function: " + trace[0]["function"], "WARNING");
    }
});

```

还能捕获网络请求分析死链或者广告请求：

```javascript
//记录所有请求
casper.on('resource.requested', function(req,networkRequest) {
    //do something
});

```

更加赞的是你还可以进入到跨域的iframe里面去进行操作！

```javascript
casper.withFrame(id/name,function(){
    //now you are inside iframe
})
```
注意: iframe操作时推荐用name，id有时候会发生错位。

检测示例：

![](/img/front-end-test/ad.png)

可以说有这么赞的工具你能轻松实现很多意想不到的需求！

#### 配置化减小成本

在开发了检测工具之后，当然要想办法减小使用成本，如上面例子中，只需将广告检测的一些规则和检测页面进行配置化，用户使用的时候只需要关注需要测试哪些页面而已。工具会根据用户提交配置自动运行并将结果返还给用户。

#### 与CI的结合

讲到这里，上面这些步骤很像ci系统啦！如果能通过ci实现一系列的自动化部署测试等工作，使用上就更加顺畅了。

谈起ci肯定要介绍[jenkins](https://jenkins-ci.org/),稳定可靠，是很多大公司ci的首选。只是在前端的眼中它看起来会感觉。。丑了点和难用了点。。如果能像[travis-ci](https://travis-ci.org/)那样小清新和直观易用该多好哈哈。

当然如果你要自己实现一套类似ci的流程也不复杂，因为对于上面提到的自动化测试来说只需要一个队列系统处理批量提交的测试任务然后将运行结果反馈给用户即可。当然前端测试可能对于自定义的报表输出要求更高点。如果你想实现一套，使用[laravel](http://www.golaravel.com/)和[beanstalkd](https://github.com/kr/beanstalkd)能快速搭建一套完善的队列系统，laravel已经提供很多内置支持。各个服务的运行结果输出成html报表，就能实现一套轻量级且支持自定义展现的ci系统了。这方面有很多教程，可以自行搜索。

国外做的比较好的轻量级ci系统有: 

 - http://wercker.com/
 - https://semaphoreci.com/
 - https://codeship.com
 - https://circleci.com/
 - ...

良好的用户体验让人使用的心情愉悦没有障碍，如果想定制可以作为参考。


## 实践经验

前端自动化测试可以说还是一个在不断探索的领域，实施过程中也难免遇到问题。有些需要注意的点可以作为经验参考。

### 减小使用和维护成本

自动化测试为人诟病的地方无外乎使用效果和使用成本，使用效果可以对症下药选择合适的工具，而使用成本则可以通过一系列措施来减小到合理程度：

 * 与构建工具结合
   
    grunt、[FIS](http://fis.baidu.com)，将自动化测试与构建工具结合能更早的发现问题，也能减小使用和维护成本

 * 与持续基础结合

    与CI系统的结合能更大范围更有效的发挥自动化测试的作用

 * 与工作流结合 

    与日常工作流结合同样是为了减少使用成本，如将结果通过自定义的方式反馈给用户等。

 * 测试配置化

    测试配置化能让用户使用和维护更加简单、大部分情况下只需要维护配置脚本即可

### 注重细节提高问题定位能力

每个产品都有自身的特点，如果只是粗略的使用这些开源工具，可能达不到想要的效果，需要根据自身的情况选择合理的工具并进行一定的调优。只有不断提高自动化测试的问题定位能力，才能真正发挥自动化的价值。

### 利用开源力量、合理搭配使用

 1. 如果遇到问题，请寻找解决思路
 2. 根据思路寻找开源支持
 3. 如果找不到请参照第一条

开源世界已经有很多优秀的资源，不建议从头开开始造轮子，除非你能很好的维护下去。基于现有的优秀工具、库、平台，针对自身产品的特点进行优化和二次开发更有利于工具本身的发展。

## 总结

测试是研发重要环节，前端自动化测试虽然还在不断探索但已经有很多优秀的工具和库。

合理利用工具、针对性选择、减小使用和维护成本。



参考资料：

 - http://rupl.github.io/frontend-testing/#/6/2
 - http://www.phase2technology.com/blog/css-testing-with-phantomcss-phantomjs-casperjs-and-grunt/
 - http://blog.nodejitsu.com/npmawesome-page-metrics-with-phantomas/
 - http://fideloper.com/ubuntu-beanstalkd-and-laravel4
 - http://www.yegor256.com/2014/10/05/ten-hosted-continuous-integration-services.html
 - http://www.zhihu.com/question/19786019
 - http://www.zhihu.com/question/29922082



[BackstopJS]: http://garris.github.io/BackstopJS
[fouber]: https://github.com/fouber
[PhantomFlow]: https://github.com/Huddle/PhantomFlow