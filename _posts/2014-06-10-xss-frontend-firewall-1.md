---
layout: post
title: XSS 前端防火墙 —— 内联事件拦截
author: zjcqoo
---

关于 XSS 怎样形成、如何注入、能做什么、如何防范，前人已有无数的探讨，这里就不再累述了。本文介绍的则是另一种预防思路。

几乎每篇谈论 XSS 的文章，结尾多少都会提到如何防止，然而大多万变不离其宗。要转义什么，要过滤什么，不要忘了什么之类的。尽管都是众所周知的道理，但 XSS 漏洞十几年来几乎从未中断过，不乏一些大网站也时常爆出，小网站更是家常便饭。

## 预警系统

事实上，至今仍未有一劳永逸的解决方案，要避免它依旧使用最古老的土办法，逐个的过滤。然而人总有疏忽的时候，每当产品迭代更新时，难免会遗漏一些新字段，导致漏洞被引入。

即使圣人千虑也有一失，程序出 BUG 完全可以理解，及时修复就行。但令人费解的是，问题出现到被发现，却要经过相当长的时间。例如不久前贴吧 XSS 蠕虫脚本，直到大规模爆发后经用户举报，最终才得知。其他网站大多也类似，直到白帽子们挖掘出漏洞，提交到安全平台上，最终厂商才被告知。若遇到黑客私下留着这些漏洞慢慢利用，那只能听天由命了。

因此，要是能有一套实时的预警系统，那就更好了。即使无法阻止漏洞的发生，但能在漏洞触发的第一时间里，通知开发人员，即可在最短的时间里修复，将损失降到最低。各式各样的应用层防火墙，也由此产生。

不过，和传统的系统漏洞不同，XSS 最终是在用户页面中触发的。因此，我们不妨尝试使用前端的思路，进行在线防御。


## DOM 储存型 XSS

先来假设一个有 BUG 的后台，没有很好处理用户输入的数据，导致 XSS 能被注入到页面：

{% highlight html %}
<img src="路径" />

<img src="路径" onload="alert(/xss/)" />
{% endhighlight %}

只转义尖括号，却忘了引号，是 XSS 里最为常见的。攻击者们可以提前关闭属性，并添加一个极易触发的内联事件，跨站脚本就这样被轻易执行了。

那么，我们能否使用前端脚本来捕获，甚至拦截呢？

## 被动扫描

最简单的办法，就是把页面里所有元素都扫描一遍，检测那些 on 开头的内联属性，看看是不是存在异常：

例如字符数非常多，正常情况下这是很少出现的，但 XSS 为了躲避转义有时会编码的很长；例如出现一些 XSS 经常使用的关键字，但在实际产品里几乎不会用到的。这些都可以作为漏洞出现的暗示，通知给开发人员。

不过，土办法终究存在很大的局限性。在如今清一色的 AJAX 时代，页面元素从来都不是固定的。伴随着用户各种交互，新内容随时都可能动态添加进来。即使换成定期扫描一次，XSS 也可能在定时器的间隔中触发，并销毁自己，那样永远都无法跟踪到了。况且，频繁的扫描对性能影响也是巨大的。

如同早期的安全软件一样，每隔几秒扫描一次注册表启动项，不仅费性能，而且对恶意软件几乎不起作用；但之后的主动防御系统就不同了，只有在真正调用 API 时才进行分析，不通过则直接拦截，完全避免了定时器的间隔遗漏。

因此，我们需要这种类似的延时策略 —— 仅在 XSS 即将触发时对其分析，对不符合策略的元素，进行拦截或者放行，同时发送报警到后台日志。


## 主动防御

主动防御，这概念放在前端脚本里似乎有些玄乎。但不难发现，这仅仅是执行优先级的事而已 —— 只要防御程序能运行在其他程序之前，我们就有了可进可退的主动权。对于无比强大的 HTML5 和灵活多变的 JavaScript，这些概念都可以被玩转出来。

继续回到刚才讨论的内联事件 XSS 上来。浏览器虽然没提供可操控内联事件的接口，但内联事件的本质仍是一个事件，无论怎样变化都离不开 DOM 事件模型。

扯到模型上面，一切即将迎刃而解。模型是解决问题的最靠谱的办法，尤其是像 [DOM-3-Event](http://www.w3.org/TR/DOM-Level-3-Events/) 这种早已制定的模型，其稳定性毋庸置疑。

即便没仔细阅读官方文档，但凡做过网页的都知道，有个 addEventListener 的接口，并取代了曾经一个古老的叫 attachEvent 的东西。尽管只是新增了一个参数而已，但正是这个差别成了人们津津乐道的话题。每当面试谈到和事件相关的话题时，总少不了考察下这个新参数的用途。尽管在日常开发中很少用到它。

<div class="post-img"><img src="http://www.blueidea.com/articleimg/2007/11/5079/01.png" style="max-width:840px;" /></div>

关于事件捕获和冒泡的细节，就不多讨论了。下面的这段代码，或许能激发你对『主动防御』的遐想。

{% highlight html %}
<button onclick="console.log('target')">CLICK ME</button>
<script>
	document.addEventListener('click', function(e) {
		console.log('bubble');
	});

	document.addEventListener('click', function(e) {
		console.log('capture');
		//e.stopImmediatePropagation();
	}, true);
</script>
{% endhighlight %}
[Demo](http://jsfiddle.net/zjcqoo/v9wm5/)


尽管按钮上直接绑了一个内联的事件，但事件模型并不买账，仍然得按标准的流程走一遍。capture，target，bubble，模型就是那样固执。

不过，把那行注释的代码恢复，结果就只剩 capture 了。这个简单的道理大家都明白，也没什么好解释的。

但仔细揣摩下，这不就是『主动防御』的概念吗？捕获程序运行在内联事件触发之前，并且完全有能力拦截之后的调用。

上面的 Demo 只是不假思索拦截了所有的事件。如果我们再加一些策略判断，或许就更明朗了：

{% highlight html %}
<button onclick="console.log('xss')">CLICK ME</button>
<script>
	document.addEventListener('click', function(e) {
		console.log('bubble');
	});

	document.addEventListener('click', function(e) {
		var element = e.target;
		var code = element.getAttribute('onclick');

		if (/xss/.test(code)) {
			e.stopImmediatePropagation();
			console.log('拦截可疑事件:', code);
		}
	}, true);
</script>
{% endhighlight %}
[Demo](http://jsfiddle.net/zjcqoo/r93Sv/)


我们先在捕获阶段扫描内联事件字符，若是出现了『xss』这个关键字，后续的事件就被拦截了；换成其他字符，仍然继续执行。同理，我们还可以判断字符长度是否过多，以及更详细的黑白名单正则。

怎么样，一个主动防御的原型诞生了吧。

不过，上面的片段还有个小问题，就是把事件的冒泡过程也给屏蔽了，而我们仅仅想拦截内联事件而已。解决办法也很简单，把 e.stopImmediatePropagation() 换成 element.onclick = null 就可以了。

当然，目前这只能防护 onclick，而现实中有太多的内联事件。鼠标、键盘、触屏、网络状态等等，不同浏览器支持的事件也不一样，甚至还有私有事件，难道都要事先逐一列出并且都捕获吗？是的，可以都捕获，但不必事先都列出来。

因为我们监听的是 document 对象，浏览器所有内联事件都对应着 document.onxxx 的属性，因此只需运行时遍历一下 document 对象，即可获得所有的事件名。

{% highlight html %}
<img src="*" onerror="console.log('xss')" />
<script>
	function hookEvent(onevent) {
		document.addEventListener(onevent.substr(2), function(e) {
			var element = e.target;
			if (element.nodeType != Node.ELEMENT_NODE) {
				return;
			}
			var code = element.getAttribute(onevent);
			if (code && /xss/.test(code)) {
				element[onevent] = null;
				console.log('拦截可疑事件:', code);
			}
		}, true);
	}

	console.time('耗时');
	for (var k in document) {
		if (/^on/.test(k)) {
			//console.log('监控:', k);
			hookEvent(k);
		}
	}
	console.timeEnd('耗时');
</script>
{% endhighlight %}
[Demo](http://jsfiddle.net/zjcqoo/yNH7V/)


现在，无论页面中哪个元素触发哪个内联事件，都能预先被我们捕获，并根据策略可进可退了。

或许有些事件没有必要捕获，例如视频播放、音量调节等，但就算全都捕捉也耗不了多少时间，基本都在 1ms 左右。

当然，注册事件本来就花不了多少时间，真正的耗费都算在回调上了。尽管大多数事件触发都不频繁，额外的扫描可以忽律不计。但和鼠标移动相关的那就不容忽视了，因此得考虑性能优化。

显然，内联事件代码在运行过程中几乎不可能发生变化。使用内联事件大多为了简单，如果还要在运行时 setAttribute 去改变内联代码，完全就是不可理喻的。因此，我们只需对某个元素的特定事件，扫描一次就可以了。之后根据标志，即可直接跳过。

{% highlight html %}
<div style="width:100%; height:100%; position:absolute" onmouseover="console.log('xss')"></div>
<script>
	function hookEvent(onevent) {
		document.addEventListener(onevent.substr(2), function(e) {
			var element = e.target;

			// 跳过已扫描的事件
			var flags = element['_flag'];
			if (!flags) {
				flags = element['_flag'] = {};
			}
			if (typeof flags[onevent] != 'undefined') {
				return;
			}
			flags[onevent] = true;

			if (element.nodeType != Node.ELEMENT_NODE) {
				return;
			}
			var code = element.getAttribute(onevent);
			if (code && /xss/.test(code)) {
				element[onevent] = null;
				console.log('拦截可疑代码:', code);
			}
		}, true);
	}

	for (var k in document) {
		if (/^on/.test(k)) {
			hookEvent(k);
		}
	}
</script>
{% endhighlight %}
[Demo](http://jsfiddle.net/zjcqoo/9chsb/)

这样，之后的扫描仅仅是判断一下目标对象中的标记而已。即使疯狂晃动鼠标，CPU 使用率也都忽略不计了。

到此，在 XSS 内联事件这块，我们已实现主动防御。

对于有着大量字符，或者出现类似 String.fromCharCode，$.getScript 这类典型 XSS 代码的，完全可以将其拦截；发现有 alert(/xss/)，alert(123) 这些测试代码，可以暂时放行，并将日志发送到后台，确定是否能够复现。

如果复现，说明已有人发现 XSS 并成功注入了，但还没大规模开始利用。程序猿们赶紧第一时间修 BUG 吧，让黑客忙活一阵子后发现漏洞已经修复了：）

## 字符策略的缺陷

但是，光靠代码字符串来判断，还是会有疏漏的。尤其是黑客们知道有这么个玩意存在，会更加小心了。把代码转义用以躲避关键字，并将字符存储在其他地方，以躲过长度检测，即可完全绕过我们的监控了：

{% highlight html %}
<img src="*" onerror="window['ev'+'al'](this.align)" align="alert('a mass of code...')">
{% endhighlight %}

因此，我们不仅需要分析关键字。在回调执行时，还需监控 eval、setTimeout('...') 等这类能解析代码的函数被调用。

不过，通常不会注入太多的代码，而是直接引入一个外部脚本，既简单又靠谱，并且能实时修改攻击内容。

明天将继续讨论，如何拦截可疑的外部模块。
