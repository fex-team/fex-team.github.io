---
layout: post
title: 关于 SVG text 元素处理连续空白字符的一个兼容性问题
author: zswang
---

2014 年随着 `XP` 的退役、移动互联网的蓬勃发展，HTML5 已经悄然成为 当今 Web 主流技术。但由于各个浏览器对标准支持的粒度不一，我们依旧要面临浏览器兼容问题。

====

标签: SVG WhiteSpace 空格 字符串

## 背景

`<svg>` 是 `HTML5` 新增的元素，可以方便地处理矢量图。基于 `<svg>` 元素构建图形库，是众多项目首选的技术方案。我们的 [脑图](http://naotu.baidu.com/)、[公式编辑器](http://fex.baidu.com/kityformula/editor.html) 等项目也基于 `SVG` 技术构建。

我们在做测试时发现一个 SVG `<text>` 元素在 `IE9+` 中出现了一个不常见的兼容性问题，需要使用一些技巧才能解决。

踩过的坑分享出来，供研究和使用 `SVG` 技术同学，多一种方案参考。

## 问题描述

### 需求

* 要在 `<svg>` 元素中动态显示一个文本。
* 文本中可能包括连续空格，显示时不能只占一个空格的宽度。

### 问题复现

需要显示的文本如：`'teamㄩㄩㄩmember'` // 为让空格可见，使用了 `ㄩ` 代替。

HTML 会这样写：

```html
<svg id="teest" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <text x="10" y="100">team   member</text>
</svg>
```

在所有浏览器中显示的文本空格都被合并了，变成：`teamㄩmember`

按以往的经验空格字符需要转义，`ㄩ` -> `'&nbsp;'`：

```html
<text x="10" y="100">team&nbsp;&nbsp;&nbsp;member</text>
```

可以兼容所有浏览器，轻松搞定。

需求是需要动态显示，所以就尝试这样写：

```javascript
document.querySelector('svg text').innerHTML = 'team&nbsp;&nbsp;&nbsp;member';
```

在 `Chrome`、`Safari` 里都是妥妥的，在 `IE9+` 发现没有效果！

问题来了：<span style="color: red;">怎么在各种高级浏览器中，让 `SVG` 动态正常显示含多个连续空格的文本？</span>

## 解决过程

### 查 W3C 标准

解决问题当然先看标准，不要知其然而不知其所以然。。。

在标准中找到关于空白字符处理的章节：[White space handling](http://www.w3.org/TR/SVG11/text.html#WhiteSpace)，发现有属性可以原样保留空白字符：`xml:space="preserve"` 尝试写一个静态的看看效果：

```html
<text x="10" y="080" xml:space="preserve">FEX   zswang</text>
```

在 Chrome、Safari 正常，`IE9 / 10` 又不支持。
静态不支持，动态就更不用说了。

### 看看别人有没有碰到过

搜一下关键词 “SVG text space” 找到一些资料说：在 `Firefox` 和 `IE`  环境 `SVG` 的元素不支持 `innerHTML` 属性。虽然可以通过 `textContent` 属性动态控制文本，但它不能处理 `HTML` 字符转义。

以史为鉴，看看成熟的 `SVG` 图像库有没有处理这类问题，拿 [Raphael](http://raphaeljs.com/) 试试：

```javascript
var r = Raphael("holder", 200, 300);
var t = r.text(10, 80, "FEX   zswang");
```
空白字符还是被合并显示

```javascript
var r = Raphael("holder", 200, 300);
var t = r.text(10, 80, "FEX&nbsp;&nbsp;&nbsp;zswang");
```
被原样显示，没有达到预期效果，看来没有可以借鉴地方。

### 自己摸索

之前经常运用 `SVG` + 前端模板的组合技术，所以想到了一种方案：
`SVG` 静态写法是可以支持 `&nbsp;`，那就利用其他元素的 `innerHTML` 能力，处理 `HTML` 转义，将目标元素替换成新元素。

测试代码如下：

```javascript
void function() {
  var html = 'FEX&nbsp;&nbsp;&nbsp;zswang'; // 要替换的文本
  var temp = document.createElement('div');
  temp.innerHTML = '<svg id="teest" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><text>' + html + '</text></svg>'
  var textOld = document.querySelector('svg text');
  var textNew = temp.querySelector('text');
  textNew.setAttribute('x', textOld.getAttribute('x'));
  textNew.setAttribute('y', textOld.getAttribute('y'));
  textOld.parentNode.replaceChild(textNew, textOld);
}();
```

经过测试可以正常显示，问题得到解决。实战中可以优雅地封装一下，这里就不详细罗列了。

本文分享的只是项目中一个小插曲，近期我们将有更多 `SVG` 实战技术会拿出来，期待和大家做更多的交流。

## 参考资料

* [innerHTML not writing into an svg group Firefox and IE](http://stackoverflow.com/questions/23275112/innerhtml-not-writing-into-an-svg-group-firefox-and-ie/)
