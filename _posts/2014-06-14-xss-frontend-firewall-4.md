---
layout: post
title: XSS 前端防火墙 —— 天衣无缝的防护
author: zjcqoo
---

[上一篇](http://fex.baidu.com/blog/2014/06/xss-frontend-firewall-1)讲解了钩子程序的攻防实战，并实现了一套对框架页的监控方案，将防护作用到所有子页面。

到目前为止，我们防护的深度已经差不多，但广度还有所欠缺。

例如，我们的属性钩子只考虑了 setAttribute，却忽视还有类似的 setAttributeNode。尽管从来不用这方法，但并不意味人家不能使用。

例如，创建元素通常都是 createElement，事实上 createElementNS 同样也可以。甚至还可以利用现成的元素 cloneNode，也能达到目的。因此，这些都是边缘方法都是值得考虑的。

下面我们对之前讨论过的监控点，进行逐一审核。


## 内联事件执行 eval

在第一篇文章结尾谈到，在执行回调的时候，最好能监控 eval，setTimeout('...') 这些能够解析代码的函数，以防止执行储存在其他地方的 XSS 代码。

先来列举下这类函数：

* eval

* setTimeout(String) / setInterval(String)

* Function

* execScript / setImmediate(String)

事实上，利用上一篇的钩子技术，完全可以把它们都监控起来。但现实并没有我们想象的那样简单。


### eval 重写有问题吗

eval 不就是个函数，为什么不可以重写？

```js
var raw_fn = window.eval;

window.eval = function(exp) {
	alert('eval: ' + exp);
	return raw_fn.apply(this, arguments);
};

console.log(eval('1+1'));
```

完全没问题啊。那是因为代码太简单了，下面这个 Demo 就可以看出山寨版 eval 的缺陷：

```js
function A() {
	eval('var a=1');
}
A();

alert(typeof a)
```

按理说应该 undefined 才对，结果却是 number。局部变量都跑到全局上来了。这是什么情况？事实上，eval 并不是真正意义的函数，而是一个关键字！想了解详情[请戳这里](http://www.cnblogs.com/index-html/archive/2011/11/08/ecma262_eval.html)。


### Function 重写有意义吗

Function 是一个全局变量，重写 window.Function 理论上完全可行吧。

```js
var raw_fn = window.Function;

window.Function = function() {
	alert('调用Function');
	return raw_fn.apply(this, arguments);
};

var add = Function('a', 'b', 'return a+b');
console.log( add(1, 2) );
```

重写确实可行。但现实却是不堪一击的：因为所有函数都是 Function 类的实例，所以访问任何一个函数的 constructor 即可得到原始的 Function。

例如 alert.constructor，就可以绕过我们的钩子。甚至可以用匿名函数：

```js
(function(){}).constructor
```

所以，Function 是永远钩不住的。


### 额外的执行方法

就算不用这类函数，仍有相当多的办法执行字符串，例如：

* 创建脚本，代码 => innerHTML

* 创建脚本，路径 => data:代码

* 创建框架，路径 => javascript:代码

* ......

看来，想完全把类似 eval 的行为监控起来，是不现实的。不过作为预警，我们只监控 eval，setTimeout/Interval 也就足够了。



## 可疑模块拦截

第二篇谈了站外模块的拦截。之所以称之『模块』而不是『脚本』，并非只有脚本元素才具备执行能力。框架页、插件都是可以运行代码的。

我们列举下，能执行远程模块的元素：

### 脚本

* ``<script src="...">``

### 框架

* ``<iframe src="...">``

* ``<frame src="...">``

### 插件（Flash）

* ``<embed src="...">``

* ``<object data="...">``

* ``<object><param name="moive|src" value="...">``

### 插件（其他）

* ``<applet codebase="">``


这些元素的路径属性，都应该作为排查的对象。不过，有这么个元素的存在，可能导致我们的路径检测失效，它就是：

```html
<base href="...">
```

它能重定义页面的相对路径，显然是不容忽视的。

事实上，除了通过元素下载执行站外的模块，还可以使用网络通信来获得站外的脚本代码，然后调用 eval 即可执行：

### AJAX

目前主流浏览器都支持跨域请求，只要服务端允许就可以。因此，我们需勾住 XMLHttpRequest::open 方法。如果请求的是站外地址，就得做策略匹配。

### WebSocket

WebSocket 和 XHR 类似，也能通过钩子的方法进行监控。

不过，值得注意的是，WebSocket 并非是个函数，而是一个类。因此，在返回实例的时候，**别忘了得将 constructor 改成自己的钩子**，否则就会泄露原始接口了：

```js
var raw_class = window.WebSocket;

window.WebSocket = function WebSocket(url, arg) {
	alert('WebSocket 请求：' + url);

	var ins = new raw_class(url, arg);
	ins.constructor = WebSocket;
	return ins;
};

var ws = new WebSocket('ws://127.0.0.1:1000');
```

另外，因为它是一个类，所以不要忽略了其静态方法或属性：

* WebSocket.CONNECTING

* WebSocket.OPEN

* ...

因此，还需将它们拷贝到钩子上面。


### 框架页消息

HTML5 赋予了框架页跨域通信的能力。如果没有为框架元素建立白名单的话，攻击者可以嵌入自己的框架页面，然后将 XSS 代码 postMessage 给主页面，进行 eval 执行。

不过为了安全考虑，HTML5 在消息事件里保存了来源地址，以识别消息是哪个页面发出的。

因为是个事件，我们可以使用第一篇文章里提到的方法，对其进行捕获。每当有消息收到时，可以根据策略，决定是否阻止该事件的传递。

```js
// 我们的防御系统
(function() {
    window.addEventListener('message', function(e) {
        if (confirm('发现来自[' + e.origin + ']的消息：\n\n' + e.data + '\n\n是否拦截？')) {
            e.stopImmediatePropagation();
        }
    }, true);
})();


window.addEventListener('message', function(e) {
	alert('收到:' + e.data)
})
postMessage('hello', '*');
```
[Run](http://jsfiddle.net/zjcqoo/4Huzt/)

<div class="post-img"><img src="/img/xss-frontend-firewall-4/msg_hook.png" style="max-width:840px;" /></div>

当然，如果配置了框架页的白名单，就能完全避免这回事了。所以这项防御可以选择性的开启。


### 事件源

HTML5 新增了一个叫 EventSource 的接口。不过其用法与 WebSocket 非常相似，因此可以使用类似的钩子进行防御。


到此，我们列举了各种能执行远程模块的方式。事实上，对其进行防御并不难，难的是找齐这些监控点，做到滴水不漏。


## API 钩子

对于动态创建的可执行模块，我们通过属性钩子，来监控其远程路径。

### 创建元素的方法

* createElement / createElementNS 无中生有

* cloneNode 克隆现有

* innerHTML / outerHTML 工厂创建

前两种，通过钩子程序很容易实现。

第三种，因为 inner/outerHTML 是元素的 property，而非 attribute。由于 Chrome 是无法获取原生访问器的，所以使用钩子会导致无法调用上级接口。

再者，inner/outerHTML 传进来的是字符串，标签和属性混杂，解析字符串肯定是不靠谱的。所以还得先调用原生 innerHTML 批量构建出节点，然后再扫描其中的元素。这个过程中，节点挂载事件已经触发了。

所以，无需考虑第三种情况。

你肯定还有疑问，既然用节点挂载事件都能搞定，为什么还要前前面的钩子？其实，在[第二篇文章](http://fex.baidu.com/blog/2014/06/xss-frontend-firewall-2)里已经详细讨论了，动态创建的脚本没法被事件拦截，所以才用钩子。

而 innerHTML 里面的脚本，是不会执行的！这点大家都听说过吧。


## 新页面环境

除了使用最简单的框架，其实还有其他可以获得新页面的途径。

### 弹窗

通过弹窗能获得新页面环境，大家都知道。但是窗口关闭，也随之销毁了，难道还能使用吗？不妨测试一下：

```html
<style> .aa { color: red }</style>
<button id="btn">POPUP</button>
<script>
	btn.onclick = function() {
		var win = window.open();
		var raw_fn = win.Element.prototype.setAttribute;

		win.close();

		setTimeout(function() {
			console.log(raw_fn);
			raw_fn.call(btn, 'class', 'aa');
		}, 1000);
	};
</script>
```
[Run](http://jsfiddle.net/zjcqoo/bA76h/)

尽管会有瞬间的闪动，但新窗口里的变量确实被保留下来了，并且依然起作用。因为我们有变量引用着它，所以即使窗口关闭了，仍然不会对其内存回收的。

现实中，可以把点击事件绑在 document 上，这样用户随便点哪里都能触发，以此获得纯净的环境。

因此，我们还得把弹窗函数，也通过钩子保护起来。

除了最常用的 window.open，其实还有：

* showModalDialog

* showModelessDialog

它们功能都是类似的，因此也得考虑。


### 来源页变量

如果当前网页是从其他页面点击打开的，无论是弹窗还是超链接，window.opener 都记录着来源页的环境。

如果是来源页和自己又是同源站点，甚至还能访问到来源页里面的变量。

这种情况相当常见。例如从帖子列表页，点开了一个帖子详情页，那么详情页是完全可以访问列表页的。

要解决这个问题也不难，直接给 window.opener 注入防护程序不就可以了，就像对待新出现的框架页那样。

但是，window.opener 可能也有自己的 opener，一层层递归上去或许有很多。每个页面也许又有自己的框架页，因此防护 window.opener 可能会执行非常多的代码。如果在初始化时就防护，也许会产生性能问题。

事实上，这个冷门的属性几乎不怎么用到。所以不如做一个延时策略：只有第一次访问 opener 的时候，才对其进行防护。

我们将 opener 进行重写，把它变成一个 getter 访问器：

```js
var raw_opener = window.opener;
var scanned;

window.__defineGetter__('opener', function() {
	if (!scanned) {
		installHook(raw_opener);
		scanned = true;
	}
	return raw_opener;
});
```

这样，只要不访问 opener，就不会触发对它的防护，做到真正按需执行。


## 后记

关于防护监控点，也没有一个完整的答案，能想到多少算多少，以后可以慢慢补充。

但是，装了那么多的钩子及事件，对页面的性能影响有多大呢？

所以，我们还得开发一个测试控制台，来跟踪这套系统。看看监控全开时，会对页面产生多大影响。

