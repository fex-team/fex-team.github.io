---
layout: post
title: 从 trim 原型函数看 JS 正则表达式的性能
author: rank
---

##问题

在 JS 里一般情况下用正则去除字符串头尾空格的 trim 函数的写法为：
{% highlight js %}
  String.prototype.trim = function () {
    return this.replace(/^[\s\t ]+|[\s\t ]+$/g, '');
  }
  s = ' this is a trim function test. ';
  alert(s.trim().length);
{% endhighlight %}

如果遇到大数据的变长字符串的话就会发现这个是很耗资源的。  
执行效率非但不高，且有效率无法忍受，看下面的例子：


{% highlight html %}
 <!Doctype html>
<html>
 <head>
 <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
 <title>rank's html</title>
 <meta http-equiv="pragma" content="no-cache"> 
 </head>
  <body>
  <textarea>请在这里写足够多的空格或者 tab 字符。</textarea>
  <script type="text/javascript">//<![CDATA[
  String.prototype.trim = function () {
    return this.replace(/^[\s\t ]+|[\s\t ]+$/g, '');
  }
  var s = document.getElementsByTagName('textarea')[0].value
  var d = new Date();
  s.trim();
  alert(new Date()-d);
//]]></script>
  </body>
</html>
{% endhighlight %}

##DFA 与 NFA

在解释这个原因的时候想起以前看到 《Master regular expression》 里面有提到过：

>NFA 和 DFA 引擎是有区别的。

>DFA 与 NFA 机制上的不同带来 5 个影响：

>1. DFA 对于文本串里的每一个字符只需扫描一次，比较快，但特性较少；
	* NFA 要翻来覆去吃字符、吐字符，速度慢，但是特性丰富，所以反而应用广泛。
	* 当今主要的正则表达式引擎，如 Perl、Ruby、Python 的 re 模块、Java 和 .NET 的 regex 库，都是 NFA 的。
2. 只有 NFA 才支持 lazy 和 backreference（后向引用）等特性；
3. NFA 急于邀功请赏，所以最左子正则式优先匹配成功，因此偶尔会错过最佳匹配结果；
	* DFA 则是“最长的左子正则式优先匹配成功”。
4. NFA 缺省采用 greedy 量词(就是对于/.*/、/\w+/这样的“重复 n ”次的模式，以贪婪方式进行，尽可能匹配更多字符，直到不得以罢手为止)，NFA 会优先匹配量词。
5. NFA 可能会陷入递归调用的陷阱而表现得性能极差。

从上面的结论容易看出，JS 是 NFA 引擎。

## NFA backtracking（回朔）

> 当 NFA 发现自己吃多了，一个一个往回吐，边吐边找匹配，这个过程叫做 backtracking。

由于存在这个过程，在 NFA 匹配过程中，特别是在编写不合理的正则式匹配过程中，文本被反复扫描，效率损失是不小的。  
明白这个道理，对于写出高效的正则表达式很有帮助。

## 分析

经过测试，有几个方法是可以化解 JS NFA 引擎的回朔次数：

* 去掉限定的量词，即改成
	{% highlight js %}
	 String.prototype.trim = function () {
	    return this.replace(/^[\s\t ]+|[\s\t ]$/g, '');
	 }
	{% endhighlight %}
	
* 去掉字符串尾匹配。
{% highlight js %}
 String.prototype.trim = function () {
    return this.replace(/^[\s\t ]+/g, '');
 }
{% endhighlight %}

* 加入多行匹配。
{% highlight js %}
String.prototype.trim = function () {
    return this.replace(/^[\s\t ]+|[\s\t ]+$/mg, '');
 }
{% endhighlight %}
	
从以上 3 种改法结合 NFA 资料，我们可以大概的知道 trim 性能出现问题的原因：

* 「量词限定」将优先匹配。
* 「量词限定」在结尾可能会使 JS 的正则引擎不停的回朔，出现递归的一个陷阱，这个递归的深度太深。  
如果字符串更大一点应该会出现栈溢出了。
* 多行匹配性能消耗不大，即化简递归深度。

##改良 trim 函数

首先，确定匹配字符串的开始部分正则表达式是没有任何效率问题的。  
而在匹配结束的部分会出现性能问题，那则可以用迭代查找空字符串改善 trim 性能问题。

{% highlight js %}
  String.prototype.trim = function () {
    var s = this.replace(/^[\s\t ]+/g, '');
    从 s 后端开始查找，并回循环到最后一个非空字符串，代码略。
  }
{% endhighlight %}

-- EOF --