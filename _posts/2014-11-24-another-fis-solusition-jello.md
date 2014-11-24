---
layout: post
title: 又一个强大的 FIS 解决方案 jello
author: 2betop
shortname: another-fis-solustion-jello
---

**又一个**？是的！[基于 FIS 的解决方案](http://oak.baidu.com/)已经有不少，有针对后端是 [php 的 fisp](http://oak.baidu.com/docs/fis-plus)、[node.js 的 yogurt](http://oak.baidu.com/docs/yogurt) 和 [GO 语言的 Gois](http://oak.baidu.com/docs/gois)，甚至更多。而接下来介绍的这个就是一个针对后端是 JAVA 采用 velocity 作为模板引擎的 [jello](https://github.com/fex-team/jello)。虽然出来有一段时间了，但是一直以来都没有很好的介绍过，希望借助这次机会能让大家更清楚地认识一下 [jello](https://github.com/fex-team/jello)。

## Features

### 前后端分离

这里有两层意义的前后分离。

1. 前后端编写分离

    由于采用的是 velocity 作为模板引擎，前端同学只用专注于 JS、CSS 以及模板逻辑的编写，而不用太关心后端数据以及页面逻辑。而后端同学则只需专注于后端页面应该渲染哪个模板，以及获取对应的模板数据。
2. 前后端开发分离

    这个是 Jello 的重点！正常来说，一个页面的正常渲染是离不开模板数据的，而页面模板数据的来源，往往都需要后端同学来提供。因此，前端的开发往往受后端的限制，需要等待后端提供一个可用的环境，然后基于此环境开发。而此环境，要让一个没有后端 j2ee 基础的同学来搭建，也是一件非常头疼的事情。

    Jello 针对这个问题，提供一个非常便利的开发环境。即：所有的 page 性质的 vm 模板文件，可以在此环境中直接预览，而且可以通过 json 或者 jsp 文件提供数据模拟。于是，项目开始前期，前后端的同学合力一起制定好数据接口，然后就可以并行独立开发了。具体操作可以查看[页面预览](http://106.186.23.103:8080/doc/rewrite)和[数据绑定](http://106.186.23.103:8080/doc/binding)相关的文档。

### 简化环境安装

传统的开发，为了能够正常开发，往往需要安装一系列 j2ee 环境。而 jello 提供的开发环境，只需要 `jello server start` 一个命令便能运行。实际上它是内嵌了一个简单个 tomcat 服务，在首次运行的时候，自动从服务器上下载。

因为所有的数据都是 mock 出来的，这也就无需去折腾 mysql 或者 oracle 或者其他数据库了。

![image2](/img/another-fis-solusition-jello/image2.png)

### 自动性能优化

我们基于 [velocity](http://velocity.apache.org/) 扩展了些标签 (directive)，如：html、head、body、script、style、widget... 如果你采用我们提供的标签 (directive) 组织代码，无论按什么顺序组织，我们可以保证所有 css 内容集中在头部输出，所有的 js 集中在底部输出，以达到一个性能优化的效果。

另外结合打包配置，可以让多个 js/css 资源合并成一个文件，更大程度的优化性能。

![image1](/img/another-fis-solusition-jello/image1.png)

(这个示例没有配置 css  打包，请忽略。)

### 模板继承机制

扩展 velocity 实现类 smarty 的模板继承功能，让模板能够得到更充分的复用。

将多个页面间相同的部分提取到一个骨架 layout.vm 文件里面，每个页面只需填充自己独有的内容。

此模板继承甚至比 smarty 提供的版本还要强，因为 velocity 里面可以支持条件语句。比如这个[Demo](http://106.186.23.103:8080/doc/layout).

```velocity
#set($layout = "page/layout/2columns-with-left-sidebar.vm")
#set($param = $request.getParameter("layout"))

#if ($param.equals("right"))
    #set($layout = "page/layout/2columns-with-right-sidebar.vm")
#end

#if ($param.equals("both"))
    #set($layout = "page/layout/3columns.vm")
#end

#extends($layout)
    ...
#end
```

![image3](/img/another-fis-solusition-jello/image3.png)

### 模块化开发

提供模块化开发机制，支持像想写 node.js 一样的方式去写页面 js。可以遵循 commonjs 规范任意拆分代码，而不用关心性能问题。

```javascript
require('bootstrap');
var $ = require('jquery');
var alert = require('libs/alert');

var app = module.exports = function(opt) {

    // from velocity data
    var vm = opt.vm;
    $(vm.btn).on('click', function() {
        alert('<pre>' + JSON.stringify(vm.data, null, 4) + '</pre>');
    });

    // ....
});
```

以上代码来自 [jello-demo](https://github.com/2betop/jello-demo) 下面的 /page/examples/data.js, 可以直接在线体验[运行结果](http://106.186.23.103:8080/examples/data)。

### 组件化开发

提供组件化机制，可以将页面间复用率比较高的内容，封装成组件（widget），然后通过 #widget() 标签使用，支持传入局部变量， 更多关于组件的使用，请参看[jello-demo](http://106.186.23.103:8080/doc/widget) 中文档。

### 更多 features.

因为是基于 [fis](http://fis.baidu.com/) 的二次开发，还有更多的 fetaures 也可以在 jello 中使用，如：前端三种语言能力、资源压缩、异构语言支持、静态资源加 md5 戳 & cdn 部署 等等。具体请查看 [fis 官网](http://fis.baidu.com/)。

## Getting started

如果以上的 features 也打动了你，不妨从一个简单的 [demo](http://106.186.23.103:8080/doc/widget) 开始 jello 之旅吧。

1. 安装 jello

    ```
    npm install -g jello
    ```
2. 安装插件

    ```
    npm install -g fis-parser-marked
    npm install -g fis-parser-utc
    npm install -g fis-parser-sass
    npm install -g fis-packager-depscombine
    ```
3.  下载  demo

    ```
    npm install -g lights
    lights install jello-demo

    #  或者

    git clone https://github.com/2betop/jello-demo.git

    ```
4. 进入当前目录后发布代码

    ```
    jello release
    jello server start
    ```
4. 自动打开浏览器预览页面
