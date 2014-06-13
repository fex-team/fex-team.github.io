---
layout: post
title: XSS 前端防火墙 —— 可疑模块拦截
author: zjcqoo
---

[上一篇](http://fex.baidu.com/blog/2014/06/xss-frontend-firewall-1/)介绍的系统，虽然能防御简单的内联 XSS 代码，但想绕过还是很容易的。

由于是在前端防护，策略配置都能在源代码里找到，因此很快就能试出破解方案。并且攻击者可以屏蔽日志接口，在自己电脑上永不发出报警信息，保证测试时不会被发现。

昨天提到最简单并且最常见的 XSS 代码，就是加载站外的一个脚本文件。对于这种情况，关键字扫描就无能为力了，因为代码可以混淆的千变万化，我们看不出任何异常，只能将其放行。

因此，我们还需增加一套可疑模块跟踪系统。


## 被动扫描

和之前说的一样，最简单的办法仍是遍历扫描。我们可以定时分析页面里的脚本元素，发现有站外地址的脚本就发送预警日志。

如果昨天说的内联事件使用定时扫描，或许还能在触发前拦截一部分，但对于脚本则完全不可能了。脚本元素一旦被挂载到主节点之下，就立即加载并执行了。除非定时器开的特别短，能在脚本加载的过程中将其销毁，或许还能拦截，否则一不留神就错过了。

我们得寻找更高端的浏览器接口，能在元素创建或添加时，进行分析和拦截。


## 主动防御

在无所不能的 HTML5 里，这当然是能办到的，它就是 [MutationEvent](http://www.w3.org/TR/DOM-Level-3-Events/#events-MutationEvent)。与其相关的有两个玩意：一个叫 DOMNodeInserted 的事件，另一个则是 MutationObserver 类。

前者虽然是个事件，但即使阻止冒泡它，或调用 preventDefault 这些方法，仍然无法阻止元素被添加；而后者就不用说了，看名字就是一个观察器，显然优先级会更低。

### MutationEvent 试探

但不管能否实现我们的目标，既然有这么个东西，就先测试看看究竟能有多大的本领。

```html
<script>
	var observer = new MutationObserver(function(mutations) {
		console.log('MutationObserver:', mutations);
	});
	observer.observe(document, {
		subtree: true,
		childList: true
	});

	document.addEventListener('DOMNodeInserted', function(e) {
		console.log('DOMNodeInserted:', e);
	}, true);
</script>

<script>console.warn('site-in xss 1');</script>
<script src="http://www.etherdream.com/xss/out.js"></script>
<script>console.warn('site-in xss 2');</script>

<button id="btn">创建脚本</button>
<script>
	btn.onclick = function() {
		var el = document.createElement('script');
		el.src = 'http://www.etherdream.com/xss/out.js?dynamic';
		document.body.appendChild(el);
	};
</script>
```
[Run](http://www.etherdream.com/blogs/xss-fw/MutationObserver.html)

出乎意料的是，MutationObserver 居然能逐一捕捉到页面加载时产生的静态元素，这在过去只能通过定时器才能勉强实现。同时为了更高效的记录，MutationObserver 并非发现新元素就立即回调，而是将一个时间片段里出现的所有元素，一起传过来。这对性能来说是件好事，但显然会损失一些优先级。

再看 DOMNodeInserted，它虽然无法捕获到静态元素，但在动态创建元素时，它比 MutationObserver 更早触发，拥有更高的优先级。

### 静态脚本拦截

接着再来尝试，能否利用这两个事件，销毁可疑的脚本元素，以达到主动拦截的效果。

```html
<script>
	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {

			var nodes = mutation.addedNodes;
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];

				if (/xss/.test(node.src) || /xss/.test(node.innerHTML)) {
					node.parentNode.removeChild(node);
					console.log('拦截可疑模块:', node);
				}
			}
		});
	});

	observer.observe(document, {
		subtree: true,
		childList: true
	});
</script>

<script>console.warn('site-in xss 1');</script>
<script src="http://www.etherdream.com/xss/out.js"></script>
<script>console.warn('site-in xss 2');</script>

<button id="btn">创建脚本</button>
<script>
	btn.onclick = function() {
		var el = document.createElement('script');
		el.src = 'http://www.etherdream.com/x\ss/out.js?dynamic';
		document.body.appendChild(el);
	};
</script>
```
[Run](http://www.etherdream.com/blogs/xss-fw/static_defense.html)

又是一个出人意料的结果，所有静态脚本被成功拦截了！

<div class="post-img"><img src="/img/xss-frontend-firewall-2/chrome.png" style="max-width:840px;" /></div>

<div class="post-img"><img src="/img/xss-frontend-firewall-2/ie.png" style="max-width:840px;" /></div>

然而这并非标准。FireFox 虽然拦截到脚本，但仍然执行代码了。

<div class="post-img"><img src="/img/xss-frontend-firewall-2/firefox.png" style="max-width:840px;" /></div>

不过对于预警系统来说，能够发现问题也足够了，可以拦截风险那就再好不过。


### 动态脚本拦截

刚刚测试了静态脚本的拦截，取得了不错的成绩。但在动态创建的元素上，和我们先前猜测的一样，MutationObserver 因优先级过低而无法拦截。

那就让 DOMNodeInserted 来试试：

```html
<script>
	document.addEventListener('DOMNodeInserted', function(e) {
		var node = e.target;

		if (/xss/.test(node.src) || /xss/.test(node.innerHTML)) {
			node.parentNode.removeChild(node);
			console.log('拦截可疑模块:', node);
		}
	}, true);
</script>

<button id="btn">创建脚本</button>
<script>
	btn.onclick = function() {
		var el = document.createElement('script');
		el.src = 'http://www.etherdream.com/xss/out.js?dynamic';
		document.body.appendChild(el);
	};
</script>
```
[Run](http://www.etherdream.com/blogs/xss-fw/dynamic_defense.html)

遗憾的是，DOMNodeInserted 也没能拦截动态脚本的执行 —— 尽管能检测到。经过一番尝试，所有浏览器都宣告失败。

当然，能实时预警已满足我们的需求了。但若能拦截动态脚本，整套系统防御力就更高了。

既然无法通过监控节点挂载来拦截，我们不妨换一条路。问题总有解决的方案，就看简单与否。


## 属性拦截

仔细分析动态脚本创建的所有步骤：

```js
var el = document.createElement('script');
el.src = 'http://www.etherdream.com/xss/out.js?dynamic';
document.body.appendChild(el);
```

是哪一步触发了挂载事件？显然是最后行。要获得比它更高的优先级，我们只能往前寻找。

既然是动态创建脚本，赋予它 src 属性必不可少。如果创建脚本只为赋值 innerHTML 的话，还不如直接 eval 代码更简单。

如果能在属性赋值时进行拦截，那么我们即可阻止赋予可疑的 src 属性。

类似 IE 有个 onpropertychange 事件，HTML5 里面也是有属性监听接口的，并且就是刚刚我们使用的那个：MutationEvent。甚至还是那两套方案：DOMAttrModified 和 MutationObserver。

在根节点上监听属性变化，肯定会大幅影响页面的性能，但我们还是先来看看是否可行。

先尝试 MutationObserver：

```js
var observer = new MutationObserver(function(mutations) {
	console.log(mutations);
});
observer.observe(document, {
	subtree: true,
	attributes: true
});

var el = document.createElement('script');
el.src = 'http://www.etherdream.com/xss/out.js?dynamic';
document.body.appendChild(el);
```

站外脚本执行了，但奇怪的是，回调却没有触发。原来，我们监控的是 document 下的元素，而脚本赋值时还处于离屏状态，显然无法将事件冒泡上来。

如果我们先 appendChild 再赋值 src 属性，倒是可以捕获到。但现实中调用顺序完全不是我们说了算的。

同样的，DOMAttrModified 也有这问题。

看来，事件这条路的局限性太大，我们得另辟蹊径。


## API 拦截

监控属性赋值的方式肯定不会错，只是我们不能再用事件那套机制了。

想在修改属性时触发函数调用，除了事件外，另一个在传统语言里经常用到的、并且主流 JavaScript 也支持的，那就是 Setter 访问器。

当我们设置脚本元素 src 属性时，理论上说 HTMLScriptElement.prototype.src 这个访问器将被调用。如果我们重写这个访问器，即可在设置脚本路径时将其拦截。

```html
<script>
	HTMLScriptElement.prototype.__defineSetter__('src', function(url) {
		console.log('设置路径:', url);
	});
</script>

<button id="btn">创建脚本</button>
<script>
	btn.onclick = function() {
		var el = document.createElement('script');
		el.src = 'http://www.etherdream.com/xss/out.js?dynamic';
		document.body.appendChild(el);
	};
</script>
```
[run](http://www.etherdream.com/blogs/xss-fw/accessor_overwrite.html)


如果这套方案可行的话，一切都将迎刃而解。而且我们只监听脚本元素的 src 赋值，其他元素和属性则完全不受影响，因此性能得到极大提升。

经测试，FireFox 和 IE 浏览器完全可行。我们事先保存原始的 setter 变量，然后根据策略，决定是否向上调用。

```html
<script>
	var raw_setter = HTMLScriptElement.prototype.__lookupSetter__('src');

	HTMLScriptElement.prototype.__defineSetter__('src', function(url) {
		if (/xss/.test(url)) {
			if (confirm('试图加载可疑模块：\n\n' + url + '\n\n是否拦截？')) {
				return;
			}				
		}
		raw_setter.call(this, url);
	});
</script>

<button id="btn">创建脚本</button>
<script>
	btn.onclick = function() {
		var el = document.createElement('script');
		el.src = 'http://www.etherdream.com/xss/out.js?dynamic';
		document.body.appendChild(el);
	};
</script>
```
[run](http://www.etherdream.com/blogs/xss-fw/accessor_hook.html)

<div class="post-img"><img src="/img/xss-frontend-firewall-2/access_hook.png" style="max-width:840px;" /></div>


效果非常漂亮，然而现实却令人遗憾 —— 我们的主流浏览器 Chrome 并不支持。由于无法操作原生访问器，即使在原型链上重写了 setter，实际赋值时仍不会调用我们的监控程序。

先不急，若是抛弃原型链，直接在元素实例上定义访问器又会如何？

```html
<button id="btn">创建脚本</button>
<script>
	btn.onclick = function() {
		var el = document.createElement('script');

		el.__defineSetter__('src', function(url) {
			console.log('设置路径:', url);
		});

		el.src = 'http://www.etherdream.com/xss/out.js?dynamic';
		document.body.appendChild(el);
	};
</script>
```
[run](http://www.etherdream.com/blogs/xss-fw/instance_hook.html)

这一回，Chrome 终于可以了。

<div class="post-img"><img src="/img/xss-frontend-firewall-2/instance_hook.png" style="max-width:840px;" /></div>


然而，这仅仅是测试。现实中哪有这样的机会，供我们装上访问器呢。

因此，我们只能把主动防御的时机再往前推，在元素创建时就调用我们的防御代码。我们得重写 createElement 这些能创建元素 API，只有这样，才能第一时间里，给实例装上我们的钩子程序，为 Chrome 实现动态模块的防御。

事实上，除了重写原生的访问器，我们还得考虑使用 setAttribute 赋值的情况。因此需整理出一套完善的浏览器钩子程序。

重写原生 API 看似很简单，但如何才能打造出一个无懈可击的钩子系统呢？明天继续讲解。
