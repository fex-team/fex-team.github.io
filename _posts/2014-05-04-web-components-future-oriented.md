---
layout: post
title: Web Components - 面向未来的组件标准
author: miller
---

> 首先需要说明的是这不是一篇 Web Components 的科普文章，如果对此了解不多推荐先读[《A Guide to Web Components》](http://css-tricks.com/modular-future-web-components/)。有句古话-“授人以鱼，不如授人以渔”，如果把组件比作“鱼”的话，对于前端开发者而言，W3C组织制定的HTML标准以及浏览器厂商的实现都是“鱼”而不是“渔”，开发者在需求无法满足的情况下通过现有技术创造了各种组件，虽然短期满足了需求但是由于严重缺乏标准，导致同一个组件有成千上万的相似实现但它们却无法相互重用，这很大程度上制约了组件化的最大价值-重用，Web Components则在组件标准化方面向前迈了一大步。

##现状与困境

组件化给前端开发带来了极大的效率提升，组件化的UI框架也因此层出不穷，从[EXTJs](http://extjs.com)、[YUI](https://yuilibrary.com/)到 [jQuery UI](http://jqueryui.com/) ，再到 [Bootstrap](http://getbootstrap.com/)、[React](http://facebook.github.io/react/)、[Ratchet](http://goratchet.com)、[Ionic](ionicframework.com)等等等等等等，几乎每年都有很多新的UI框架冒出来，它们或者借鉴或者颠覆其他已存在的框架。简单对比一下就会发现这些框架的很大一部分模块在功能上是重合的，但也仅仅在功能层面重合，代码层面确完全不兼容。

接下来选择 jQuery UI、[KendoUI](http://kendoui.com) 以及 Bootstrap 中的`Dialog`组件从初始化、方法调用以及事件响应方面进行简单的对比。

**jQuery UI**

```javascript
// 初始化
$( "#dialog" ).dialog({
  dialogClass: "no-close"
});

// 显示
$( ".selector" ).dialog({ show: { effect: "blind", duration: 800 } });

// 关闭事件
$( ".selector" ).on( "dialogclose",  function (e, ui) {
  // do something...
});
```

**Kendo UI**

```javascript
// 初始化
$("#dialog").kendoWindow({
  actions: [ "Minimize", "Maximize" ]
});

// 显示
var dialog = $("#dialog").data("kendoWindow");
dialog.open();

// 关闭事件
var dialog = $("#dialog").data("kendoWindow");
dialog.bind("close",  function (e) {
  // do something...
});
```

**Bootstrap**

```javascript
// 初始化
$('#myModal').modal({
    keyboard: false
});

// 显示
$('#myModal').modal('show');

// 关闭事件
$('#myModal').on('hidden.bs.modal', function (e) {
  // do something...
});
```

简单对比可以发现，几乎完全相同的功能在接口层面完全不兼容，导致使用者从某个实现切换到另一个实现时需要非常高的成本，这就是目前Web组件化方面无序和缺乏标准的一个写照。

再来看目前浏览器“内置”组件的现状，由标准化组织建立 HTML4、HTML5 等各种标准，浏览器厂商按照标准实现“内置”组件并声称兼容某某标准，开发者遵循标准来使用组件，使得代码可以在不同的浏览器里通过相同的方式来使用组件。

以“内置”组件`video`来简单示例：

```javascript
// 初始化（直接写<video>标签或者通过javascript创建）
var video = document.createElement('video');

// 播放
video.play();

// 播放事件
video.addEventListener("play", function () {
   // do something...
 }, false);

```
相比使用各种组件框架来说，“内置”组件也是由不同的开发者（浏览器厂商）开发，但是由于遵循了相同的标准使得“内置”组件的使用在跨浏览器方面的成本大幅降低。

综上所述，组件框架目前无序、缺乏标准以及低效复用方面的问题需要通过组件标准化来解决，而Web Components则是标准化的一个很好的选择。

##面向未来的组件标准

Web Components 的出现给组件标准化带来了很好的契机：

* WEB组件目前仍然依靠各种类似"Hack"的方式来模拟，模拟方式也各有不同，很难统一和标准化，而 Web Components 则直接提供了标准化的组件定义方式，这是组件标准化的基石，使得未来的组件能够统一创建、方法调用、事件监听、属性访问等。
* 基于标准化的组件定义方式，我们便可以像W3C等标准组织一样来定义组件标准，无需再依赖、等待“内置”组件，这也使得我们获得了“渔”的能力。

以上述的例子为例，未来可能会有一小撮人成立某个组件标准化组织-X，X的职责就是根据WEB组件的使用现状以及潜在的新需求来规范一个组件，包括组件的名称、方法、属性、事件。

例如《Dialog规范1.0》

> * 组件名：x-dialog
> * 属性：title 
> * 方法：show hide
> * 事件：hide show

随后出现的UI框架宣称支持《Dialog规范》，但在实现上完全没有制约，可以是完全不同的实现方式、或者更好的性能、更炫的UI，而对于开发者而言，只需要写如下代码即可：

```javascript
// 初始化(<x-dialog/>或者如下代码)
var dialog = document.createElement('x-dialog');

// 获取和设置title
var title = dialog.title;
dialog.title = title + '-_-';

// 显示
dialog.show();

// 关闭事件
dialog.addEventListener('hide', function( e ) {
    // do something...
}, false);

```

当用户不满意某个 Dialog 的实现而需要切换到其他实现版本时只需要引入不同的实现库，而不再需要重构代码。

```html
// bootstrap
<link rel="import" href="/components/bootstrap/dialog.html">

// jQuery UI
<link rel="import" href="/components/jqueryui/dialog.html">

// Kendo UI
<link rel="import" href="/components/kendoui/dialog.html">
```

##跨端的组件标准

[集鹄](http://weibo.com/zswang)在[跨端组件实践 - 移动时代的前端](http://fex.baidu.com/blog/2014/05/light-component/)一文中提到了跨端组件的概念。

跨端组件的实现同样面临着标准化的问题，Web Components 的标准化只规范接口，而底层的实现是完全自由的，自由到你可以使用 Web 技术来实现也可以使用 Native技术。

同样以 Dialog 为例，开发者可以在 Android 中用 Java 或者在 iOS 中用 Objective C 来开发声称兼容 《Dialog规范1.0》的组件，此时，Web 开发者的那段调用 Dialog 的代码不仅仅在 浏览器环境有效，在 Native 依然有效，而且调用的是 Native 实现，能够获得更为出色的性能。


##总结

回顾浏览器的发展历史，也曾经历混乱和无序，随着W3C标准化组织的出现这一局面有了翻天覆地的变化，而对于Web组件而言，Web Components 的出现才仅仅是这一变化的开始，随着更为复杂的多端环境的出现，组件标准化还有着更大的想象空间。
