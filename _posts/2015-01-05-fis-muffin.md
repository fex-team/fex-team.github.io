---
layout: post
title: Muffin=FIS+Browserify
author: cheft
shortname: fis-muffin
---

## 前言

这段时间在做前端架构设计，需要选个好用的前端构建方案，之前[公司网站](http://www.zyeeda.com)有用过 [fis-pure](https://github.com/fex-team/fis-pure) ，因为这次需要用到 node 环境的一些自动化测试框架，pure 不太适合，因此就萌生出 [FIS](http://fis.baidu.com/) 集成 [Browserify](http://browserify.org/) 的想法。

## 特色

### 简化安装
执行 __npm install -g fis-muffin__ 命令便可安装

### 多语言支持
muffin 天生支持 __less__、__scss__、__coffee__、__react__ 多种语言

### NPM 管理库
项目采用 npm 管理 js 库依赖，方式跟 node 完全一样，下面是 [muffin-demo](https://github.com/cheft/muffin-demo) 的 package.json 配置；有了它，只要执行 __npm install__ 可安装所有依赖库

```js    
    {
      "name": "muffin-demo",
      "version": "1.0.0",
      "description": "fis-muffin demo",
      "author": "cheft",
      "license": "ISC",
      "devDependencies": {
        "coffee-reactify": "^2.1.0"
      },
      "dependencies": {
        "jquery": "^2.1.3",
        "bootstrap": "^3.3.1",
        "react": "^0.12.2"
      }
    }
```
> 如果你还要用到其它库，比如 underscore，可以用 __npm install underscore --save__ 安装
> 
> 或者你要用到其它插件，如 reactify，可以用 __npm install reactify --save-dev__ 安装


### 集成 Browserify
Browserify 可以让你使用类似于 node 的 requrie 方式来实现浏览器端 JavaScript 代码模块化

```js
    // hello.js
    var hello = function(name) {
        return 'Hello ' + name;
    }

    module.exports = hello;
```


```js
    //index.js
    var $ = require('jquery');
    var hello = require('./hello');

    $('body').append('<div>' + hello('Muffin') + '</div>');
```

muffin 默认是以 src/index.js 为入口文件，当然通过配置也可以修改

  ```js
       module.exports = {
          settings: {
              browserify: {
                  main: 'index.coffee',  // 入口文件
                  output: '_app.js',  // browserify 输出文件，不建议修改
                  transform: 'coffee-reactify', // browserify 插件，可支持数组
                  extension: '.coffee' // browserify 所要处理的文件
              }
          }
      }
  ```
> browserify 支持多种插件，常用的有 __coffee-reactify__、__reactify__ 等

### 命令简化
只需 __mfn__ 简单命令便可发布，__mfn start__ 即开启浏览器预览

![命令简化](/img/fis-muffin/command.jpg)

<table>
  <tr>
    <th style="width: 30%;text-align: left;">FIS 命令</th><th style="width: 30%;text-align: left;">Muffin 命令</th><th style="width: 40%;text-align: left;">作用</th>
  </tr>
  <tr>
    <td>fis release</td><td>mfn</td><td>简单发布</td>
  </tr>
  <tr>
    <td>fis release -w</td><td>mfn w</td><td>发布并监视</td>
  </tr>
  <tr>
    <td>fis release -wL</td><td>mfn wL</td><td>发布并监视浏览器刷新</td>
  </tr>
  <tr>
    <td>fis release -op</td><td>mfn op</td><td>压缩打包</td>
  </tr>
  <tr>
    <td>fis release -opm</td><td>mfn opm</td><td>压缩打包并加上md5文件戳</td>
  </tr>
  <tr>
    <td>fis server start</td><td>mfn start</td><td>启动服务打开浏览器</td>
  </tr>
  <tr>
    <td>fis server stop</td><td>mfn stop</td><td>停止服务</td>
  </tr>
  <tr>
    <td>fis server open</td><td>mfn open</td><td>打开发布目录</td>
  </tr>
  <tr>
    <td>fis server clean</td><td>mfn clean</td><td>清理发布目录</td>
  </tr>
</table>

> 如果上面命令不符合你的习惯，可以自己设置

```js
  module.exports = {
        settings: {
            command: {
                '': 'release -b',
                'w': 'release -bw',
                'wL': 'release -bwL',
                'op': 'release -bop',
                'opm': 'release -bopm',
                'start': 'server start',
                'stop': 'server stop',
                'open': 'server open'
                'clean': 'server clean'
            }
        }
    }
```

### CSS 模块化
不仅 js 可以模块化，css 同样可以。muffin 的静态资源目录是 assets，其中的样式文件都约定了 id。 因此在 css 或 js 中可通过 id 来引用样式文件：

```js
  /*
  * @require bootstrap.css
  */
```

在 coffee-script 中：

```coffee
    ###
    @require todo/todo.css
    ###
```

在 html 中：

```html
    <!-- @require index.css -->
```

如果觉得 muffin 提供的默认配置不符合需求，也可以自己配置：

```js
module.exports = {
    roadmap: {
        path: [
            {
              reg : /^\/modules\/([^\/]+)\/assets\/index\.(css|scss|sass|less)$/i,
              id : 'modules/$1.css',
              release : 'css/$1/index.css'
          },
          {
              reg : /^\/modules\/([^\/]+)\/assets\/(.*)$/i,
              release : 'img/$1/$2'
          }
        ]
    }
}
```
> 以上配置是将静态资源放在 modules 目录的每个模块下，每个模块自己管理静态资源；其它配置可自己扩展

### 性能优化
通过 __mfn op__ 命令可将 js 打包一个文件，css 也打包一个文件；一些细碎的图片(特别是svg)，建议 直接内嵌到css中，可大幅减少请求数量，提升前端性能。

![性能优化](/img/fis-muffin/chrome.jpg)

> 图中所请求图片资源其实是内嵌在css中，具体用法可看 [fis官方文档](http://fis.baidu.com/docs/more/fis-standard-inline.html#css)

### 文件监视 & 自动刷新
虽然集成了 Browserify，Muffin 也同样支持 watch 和 livereload 模式，而且速度还是很快。执行 __mfn wL__ 命令来启用。

### 支持 SourceMap
开发模式中，会自动加入 sourcemap，方便调试，可直接定位到源代码，使用 __mfn op__ 发布则会去掉 sourcemap

### 发布目录整理
执行 __mfn deploy__ 可将项目输出至 __./public__ 目录，目录非常整洁。

![发布目录整理](/img/fis-muffin/file.jpg)

### 自动测试
使用 Browserify 方式，一些代码可直接运行在 node 环境上；当然这样可以很轻松地模拟浏览器环境，做到自动化测试；常用的测试框架如 [jest](http://facebook.github.io/jest/docs/tutorial.html)

### 更多特色
因为 Muffin 是基于 FIS 二次开发，所有 FIS 的功能，如：静态资源加 md5 戳 & cdn 部署 等功能都能使用；具体请查看 [FIS 文档](http://fis.baidu.com/docs/beginning/getting-started.html)。

## 体验

如果你对这些 __特色__ 感兴趣，那么就从一个简单的 demo 开始体验 muffin 吧

* 安装 muffin

```bash
    npm install -g fis-muffin
```

* 下载 demo

```bash
    git clone https://github.com/cheft/muffin-demo.git
```

* 进入 muffin-demo 目录，安装第三方依赖库

```bash
    npm install
```

* 发布代码

```bash
    mfn
```

*启动服务并打开浏览器预览

```bash
    mfn start
```

## Roadmap
* 发布三种模式的源代码 __requirejs-seed__ 、__browserify-seed__、__global-seed__
* 更多等待您的反馈
