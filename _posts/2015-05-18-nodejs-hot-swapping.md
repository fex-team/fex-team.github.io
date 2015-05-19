---
layout: post
title: Node.js Web应用代码热更新的另类思路 
author: fangshi
shortname: nodejs-hot-swapping
---

## 背景

相信使用 Node.js 开发过 Web 应用的同学一定苦恼过新修改的代码必须要重启 Node.js 进程后才能更新的问题。习惯使用 PHP 开发的同学更会非常的不适用，大呼果然还是我大PHP才是世界上最好的编程语言。手动重启进程不仅仅是非常恼人的重复劳动，当应用规模稍大以后，启动时间也逐渐开始不容忽视。

当然作为程序猿，无论使用哪种语言，都不会让这样的事情折磨自己。解决这类问题最直接和普适的手段就是监听文件修改并重启进程。这个方法也已经有很多成熟的解决方案提供了，比如已经被弃坑的 [node-supervisor](https://github.com/isaacs/node-supervisor)，以及现在比较火的 [PM2](https://github.com/Unitech/PM2) ，或者比较轻量级的 [node-dev](https://github.com/fgnass/node-dev) 等等均是这样的思路。

本文则提供了另外一种思路，只需要很小的改造，就可以实现真正的0重启热更新代码，解决 Node.js 开发 Web 应用时恼人的代码更新问题。

## 总体思路

说起代码热更新，当下最有名的当属 Erlang 语言的热更新功能，这门语言的特色在于高并发和分布式编程，主要的应用场景则是类似证券交易、游戏服务端等领域。这些场景都或多或少要求服务拥有在运行中运维的手段，而代码热更新就是其中非常重要的一环，因此我们可以先简单的了解一下 Erlang 的做法。

由于我也没有使用过 Erlang ，以下内容均为道听途说，如果希望深入和准确的了解 Erlang 的代码热更新实现，最好还是查阅官方文档。

- `Erlang` 的代码加载由一个名为`code_server`的模块管理，除了启动时的一些必要代码外，大部分的代码均是由`code_server`加载。
- 当`code_server`发现模块代码被更新后，会重新加载模块，此后的新请求会使用新模块执行，而原有还在执行的请求则继续使用老模块执行。
- 老模块会在新模块加载后，被打上`old`标签，新模块则是`current`标签。当下一次热更新的时候，`Erlang` 会扫描还在执行老模块的进行并杀掉，再继续按照这个逻辑更新模块。
- `Erlang` 中并非所有代码均允许热更新，如 `kernel, stdlib, compiler` 等基础模块默认是不允许更新的

我们可以发现 Node.js 中也有与`code_server`类似的模块，即 `require` 体系，因此 Erlang 的做法应该也可以在 Node.js 上做一些尝试。通过了解 Erlang 的做法，我们可以大概的总结出在 Node.js 中解决代码热更新的关键问题点

- 如何更新模块代码
- 如何使用新模块处理请求
- 如何释放老模块的资源

那么接下来我们就逐个的解析这些问题点。

## 如何更新模块代码

要解决模块代码更新的问题，我们就需要去阅读 `Node.js` 的模块管理器实现，直接上链接 [module.js](https://github.com/joyent/node/blob/master/lib/module.js)。通过简单的阅读，我们可以发现核心的代码就在于 `Module._load` ，稍微精简一下代码贴出来。

```javascript
// Check the cache for the requested file.
// 1. If a module already exists in the cache: return its exports object.
// 2. If the module is native: call `NativeModule.require()` with the
//    filename and return the result.
// 3. Otherwise, create a new module for the file and save it to the cache.
//    Then have it load  the file contents before returning its exports
//    object.
Module._load = function(request, parent, isMain) {
  var filename = Module._resolveFilename(request, parent);

  var cachedModule = Module._cache[filename];
  if (cachedModule) {
    return cachedModule.exports;
  }

  var module = new Module(filename, parent);
  Module._cache[filename] = module;
  module.load(filename);
  
  return module.exports;
};

require.cache = Module._cache;
```

可以发现其中的核心就是 `Module._cache` ，只要清除了这个模块缓存，下一次 `require` 的时候，模块管理器就会重新加载最新的代码了。

写一个小程序验证一下

```javascript
// main.js
function cleanCache (module) {
    var path = require.resolve(module);
    require.cache[path] = null;
}

setInterval(function () {
    cleanCache('./code.js');
    var code = require('./code.js');
    console.log(code);
}, 5000);
```
<p></p>

```javascript
// code.js
module.exports = 'hello world';
```

我们执行一下 `main.js` ，同时取修改 `code.js` 的内容，就可以发现控制台中，我们代码成功的更新为了最新的代码。

![图片](http://bos.nj.bpc.baidu.com/v1/agroup/07a62b80376c32fc50100976e1e045dc141aa54b)

那么模块管理器更新代码的问题已经解决了，接下来再看看在 Web 应用中，我们如何让新的模块可以被实际执行。

## 如何使用新模块处理请求

为了更符合大家的使用习惯，我们就直接以 `Express` 为例来展开这个问题，实际上使用类似的思路，绝大部分 Web应用 均可适用。

首先，如果我们的服务是像 `Express` 的 DEMO 一样所有的代码均在同一模块内的话，我们是无法针对模块进行热加载的

```javascript
var express = require('express');
var app = express();

app.get('/', function(req, res){
  res.send('hello world');
});

app.listen(3000);
```

要实现热加载，和 Erlang 中不允许的基础库一样，我们需要一些无法进行热更新的基础代码控制更新流程。而且类似 `app.listen` 这类操作如果重新执行了，那么和重启 Node.js 进程也没太大的区别了。因此我们需要一些巧妙的代码将频繁更新的业务代码与不频繁更新的基础代码隔离开。

```javascript
// app.js 基础代码
var express = require('express');
var app = express();
var router = require('./router.js');

app.use(router);

app.listen(3000);
```
<p></p>

```javascript
// router.js 业务代码
var express = require('express');
var router = express .Router();

// 此处加载的中间件也可以自动更新
router.use(express.static('public'));

router.get('/', function(req, res){
  res.send('hello world');
});

module.exports = router;
```

然而很遗憾，经过这样处理之后，虽然成功的分离了核心代码， `router.js` 依然无法进行热更新。首先，由于缺乏对更新的触发机制，服务无法知道应该何时去更新模块。其次， `app.use` 操作会一直保存老的 `router.js` 模块，因此即使模块被更新了，请求依然会使用老模块处理而非新模块。

那么继续改进一下，我们需要对 `app.js` 稍作调整，启动文件监听作为触发机制，并且通过闭包来解决 `app.use` 的缓存问题

```javascript
// app.js
var express = require('express');
var fs = require('fs');
var app = express();

var router = require('./router.js');

app.use(function (req, res, next) {
    // 利用闭包的特性获取最新的router对象，避免app.use缓存router对象
    router(req, res, next);
});

app.listen(3000);

// 监听文件修改重新加载代码
fs.watch(require.resolve('./router.js'), function () {
    cleanCache(require.resolve('./router.js'));
    try {
        router = require('./router.js');
    } catch (ex) {
        console.error('module update failed');
    }
});

function cleanCache(modulePath) {
    require.cache[modulePath] = null;
}
```

再试着修改一下 `router.js` 就会发现我们的代码热更新已经初具雏形了，新的请求会使用最新的 `router.js` 代码。除了修改 `router.js` 的返回内容外，还可以试试看修改路由功能，也会如预期一样进行更新。

当然，要实现一个完善的热更新方案需要更多结合自身方案做一些改进。首先，在中间件的使用上，我们可以在 `app.use` 处声明一些不需要热更新或者说每次更新不希望重复执行的中间件，而在 `router.use` 处则可以声明一些希望可以灵活修改的中间件。其次，文件监听不能仅监听路由文件，而是要监听所有需要热更新的文件。除了文件监听这种手段外，还可以结合编辑器的扩展功能，在保存时向 Node.js 进程发送信号或者访问一个特定的 URL 等方式来触发更新。

## 如何释放老模块的资源

要解释清楚老模块的资源如何释放的问题，实际上需要先了解 Node.js 的内存回收机制，本文中并不准备详加描述，解释 Node.js 的内存回收机制的文章和书籍很多，感兴趣的同学可以自行扩展阅读。简单的总结一下就是当一个对象没有被任何对象引用的时候，这个对象就会被标记为可回收，并会在下一次GC处理的时候释放内存。

那么我们的课题就是，如何让老模块的代码更新后，确保没有对象保持了模块的引用。首先我们以 [如何更新模块代码](#如何更新模块代码) 一节中的代码为例，看看老模块资源不回收会出现什么问题。为了让结果更显著，我们修改一下 `code.js`

```javascript
// code.js
var array = [];

for (var i = 0; i < 10000; i++) {
    array.push('mem_leak_when_require_cache_clean_test_item_' + i);
}

module.exports = array;
```

<p></p>

```javascript
// app.js
function cleanCache (module) {
    var path = require.resolve(module);
    require.cache[path] = null;
}

setInterval(function () {
    var code = require('./code.js');
    cleanCache('./code.js');
}, 10);
```

好~我们用了一个非常笨拙但是有效的方法，提高了 `router.js` 模块的内存占用，那么再次启动 `main.js` 后，就会发现内存出现显著的飙升，不到一会 Node.js 就提示 `process out of memory`。然而实际上从 `app.js` 与 `router.js` 的代码中观察的话，我们并没发现哪里保存了旧模块的引用。

我们借助一些 `profile` 工具如 [node-heapdump](https://github.com/bnoordhuis/node-heapdump) 就可以很快的定位到问题所在，在 [module.js](https://github.com/joyent/node/blob/master/lib/module.js) 中我们发现 Node.js 会自动为所有模块添加一个引用

```javascript
function Module(id, parent) {
  this.id = id;
  this.exports = {};
  this.parent = parent;
  if (parent && parent.children) {
    parent.children.push(this);
  }

  this.filename = null;
  this.loaded = false;
  this.children = [];
}
```

因此相应的，我们可以调整一下cleanCache函数，将这个引用在模块更新的时候一并去除。

```javascript
// app.js
function cleanCache(modulePath) {
    var module = require.cache[modulePath];
    // remove reference in module.parent
    if (module.parent) {
        module.parent.children.splice(module.parent.children.indexOf(module), 1);
    }
    require.cache[modulePath] = null;
}

setInterval(function () {
    var code = require('./code.js');
    cleanCache(require.resolve('./code.js'));
}, 10); 
```

再执行一下，这次好多了，内存只会有轻微的增长，说明老模块占用的资源已经正确的释放掉了。

使用了新的 `cleanCache` 函数后，常规的使用就没有问题，然而并非就可以高枕无忧了。在 Node.js 中，除了 `require` 系统会添加引用外，通过 `EventEmitter` 进行事件监听也是大家常用的功能，并且 `EventEmitter` 有非常大的嫌疑会出现模块间的互相引用。那么 `EventEmitter` 能否正确的释放资源呢？答案是肯定的。

```javascript
// code.js
var moduleA = require('events').EventEmitter();

moduleA.on('whatever', function () {
});
```

当 `code.js` 模块被更新，并且所有引用被移出后，只要 `moduleA` 没有被其他未释放的模块引用， `moduleA` 也会被自动释放，包括我们在其内部的事件监听。

只有一种畸形的 `EventEmitter` 应用场景在这套体系下无法应对，即 `code.js` 每次执行的时候都会去监听一个全局对象的事件，这样会造成全局对象上不停的挂载事件，同时 Node.js 会很快的提示检测到过多的事件绑定，疑似内存泄露。

至此，可以看到只要处理好了 `require` 系统中 Node.js 为我们自动添加的引用，老模块的资源回收并不是大问题，虽然我们无法做到像 Erlang 一样实现下一次热更新对还留存的老模块进行扫描这样细粒度的控制，但是我们可以通过合理的规避手段，解决老模块资源释放的问题。

在 Web 应用下，还有一个引用问题就是未释放的模块或者核心模块对需要热更新的模块有引用，如 `app.use`，导致老模块的资源无法释放，并且新的请求无法正确的使用新模块进行处理。解决这个问题的手段就是控制全局变量或者引用的暴露的入口，在热更新执行的过程中手动更新入口。如 [如何使用新模块处理请求](#如何使用新模块处理请求) 中对 `router` 的封装就是一个例子，通过这一个入口的控制，我们在 `router.js` 中无论如何引用其他模块，都会随着入口的释放而释放。

> 另一个会引起资源释放问题的就是类似 `setInterval` 这类操作，会保持对象的生命周期无法释放，不过在 Web 应用中我们极少会使用这类技术，因此方案中并未关注。

## 尾声

至此，我们就解决了 Node.js 在 Web 应用下代码热更新的三大问题，不过由于 Node.js 本身缺乏对有效的留存对象的扫描机制，因此并不能100%的消除类似 `setInterval` 导致的老模块的资源无法释放的问题。也是由于这样的局限性，目前我们提供的 [YOG2](https://github.com/fex-team/yog2) 框架中，主要还是将此技术应用于开发调试期，通过热更新实现快速开发。而生产环境的代码更新依然使用重启或者 [PM2](https://github.com/Unitech/PM2) 的 `hot reload` 功能来保证线上服务的稳定性。

由于热更新实际上与框架和业务架构紧密相关，因此本文并未给出一个通用的解决方案。作为参考，简单的介绍一下在 [YOG2](https://github.com/fex-team/yog2) 框架中我们是如何使用这项技术的。由于 `YOG2` 框架本身就支持前后端子系统 `App` 拆分，因此我们的更新策略是以 `App` 为粒度更新代码。同时由于类似 `fs.watch` 这类操作会有兼容性问题，一些替代方案如 `fs.watchFile` 则会比较消耗性能，因此我们结合了 `YOG2` 的测试机部署功能，通过上传部署新代码的形式告知框架需要更新 `App` 代码。在以  `App` 为粒度更新模块缓存的同时，会更新路由缓存与模板缓存，来完成所有代码的更新工作。

如果你使用的是类似 `Express` 或者 `Koa` 这类框架，只需要按照文中的方法结合自身业务需要，对主路由进行一些改造，就可以很好的应用这项技术。

## 参考资料

- http://romeda.org/blog/2010/01/hot-code-loading-in-nodejs.html
- https://github.com/rlidwka/node-hotswap
- http://en.wikipedia.org/wiki/Hot_swapping
