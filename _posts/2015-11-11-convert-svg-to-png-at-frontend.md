---  
layout: post  
title: '前端实现 SVG 转 PNG'
author: zhangbobell
---  

## 前言

svg 是一种矢量图形，在 web 上应用很广泛，但是很多时候由于应用的场景，常常需要将 svg 转为 png 格式，下载到本地等。随着浏览器对 HTML 5 的支持度越来越高，我们可以把 svg 转为 png 的工作交给浏览器来完成。

## 一般方式
1. 创建 imageimage，src = xxx.svg;
2. 创建 canvas，dragImage 将图片贴到 canvas 上；
3. 利用 toDataUrl 函数，将 canvas 的表示为 url；
4. new image, src = url, download = download.png；

但是，在转换的时候有时有时会碰到如下的如下的两个问题：

## 问题 1 ：浏览器对 canvas 限制
Canvas 的 W3C 的标准上没有提及 canvas 的最大高/宽度和面积，但是每个厂商的浏览器出于浏览器性能的考虑，在不同的平台上设置了最大的高/宽度或者是渲染面积，超过了这个阈值渲染的结果会是空白。测试了几种浏览器的 canvas 性能如下：

* chrome (版本 46.0.2490.80 (64-bit))
	 - 最大面积：268, 435, 456 px^2 = 16, 384 px * 16, 384 px
	 - 最大宽/高：32, 767 px

* firefox (版本 42.0)
	- 最大面积：32, 767 px * 16, 384 px
	- 最大宽/高：32, 767px

* safari (版本 9.0.1 (11601.2.7.2))
 - 最大面积： 268, 435, 456 px^2 = 16, 384 px * 16, 384 px

* ie 10(版本 10.0.9200.17414)
	- 最大宽/高： 8, 192px * 8, 192px

在一般的 web 应用中，可能很少会超过这些限制。但是，如果超过了这些限制，则会导致导出为空白或者由于内存泄露造成浏览器崩溃。

而且从另一方面来说，导出 png 也是一项很消耗内存的操作，粗略估算一下，导出 16, 384 px * 16, 384 px 的 svg 会消耗 16384 * 16384 * 4 / 1024 / 1024 = 1024 M 的内存。所以，在接近这些极限值的时候，浏览器也会反应变慢，能否导出成功也跟系统的可用内存大小等等都有关系。

对于这个问题，有如下两种解决方法：

1. 将数据发送给后端，在后端完成转换；
2. 前端将 svg 切分成多个图片导出；

第一种方法可以使用 PhantomJS、inkscape、ImageMagick 等工具，相对来说比较简单，这里我们主要探讨第二种解决方法。

###  svg 切分成多个图片导出
**思路**：浏览器虽然对 canvas 有尺寸和面积的限制，但是对于 image 元素并没有明确的限制，也就是第一步生成的 image 其实显示是正常的，我们要做的只是在第二步 `dragImage` 的时候分多次将 image 元素切分并贴到 canvas 上然后下载下来。
同时，应注意到 image 的载入是一个异步的过程。

**关键代码**：

```javascript
// 构造 svg Url，此处省略将 svg 经字符过滤后转为 url 的过程。
var svgUrl = DomURL.createObjectURL(blob);
var svgWidth = document.querySelector('#kity_svg').getAttribute('width');
var svgHeight = document.querySelector('#kity_svg').getAttribute('height');

// 分片的宽度和高度，可根据浏览器做适配
var w0 = 8192;
var h0 = 8192;

// 每行和每列能容纳的分片数
var M = Math.ceil(svgWidth / w0);
var N = Math.ceil(svgHeight / h0);

var idx = 0;
loadImage(svgUrl).then(function(img) {

	while(idx < M * N) {
		// 要分割的面片在 image 上的坐标和尺寸
		var targetX = idx % M * w0,
		    targetY = idx / M * h0,
		    targetW = (idx + 1) % M ? w0 : (svgWidth - (M - 1) * w0),
		    targetH = idx >= (N - 1) * M ? (svgHeight - (N - 1) * h0) : h0;

		var canvas = document.createElement('canvas'),
			ctx = canvas.getContext('2d');

			canvas.width = targetW;
			canvas.height = targetH;

			ctx.drawImage(img, targetX, targetY, targetW, targetH, 0, 0, targetW, targetH);

			console.log('now it is ' + idx);

			// 准备在前端下载
			var a = document.createElement('a');
			a.download = 'naotu-' + idx + '.png';
			a.href = canvas.toDataURL('image/png');

			var clickEvent = new MouseEvent('click', {
			    'view': window,
			    'bubbles': true,
			    'cancelable': false
			});

			a.dispatchEvent(clickEvent);

		idx++;
	}

}, function(err) {
	console.log(err);
});

// 加载 image
function loadImage(url) {
	return new Promise(function(resolve, reject) {
		var image = new Image();

		image.src = url;
		image.crossOrigin = 'Anonymous';
		image.onload = function() {
			resolve(this);
		};

		image.onerror = function(err) {
			reject(err);
		};
	});
}
```

说明：

1. 由于在前端下载有浏览器兼容性、用户体验等问题，在实际中，可能需要将生成后的数据发送到后端，并作为一个压缩包下载。
2. 分片的尺寸这里使用的是 8192 * 9192，在实际中，为了增强兼容性和体验，可以根据浏览器和平台做适配，例如在 iOS 下的 safari 的最大面积是 4096 *4096。

## 问题 2 ：导出包含图片的 svg
在导出的时候，还会碰到另一个问题：如果 svg 里面包含图片，你会发现通过以上方法导出的 png 里面，原来的图片是不显示的。一般认为是 svg 里面包含的图片跨域了，但是如果你把这个图片换成本域的图片，还是会出现这种情况。

![导出包含图片的 svg 示例](/img/convert-svg-to-png-at-frontend/example-with-pic.png)

图片中上部分是导出前的 svg，下图是导出后的 png。svg 中的图片是本域的，在导出后不显示。

### 问题来源
我们按照文章最开始提出的步骤，逐步排查，会发现在第一步的时候，svg 中的图片就不显示了。也就是，当 image 元素的 src 为一个 svg，并且 svg 里面包含图片，那么被包含的图片是不会显示的，即使这个图片是本域的。

W3C 关于这个问题并没有做说明，最后在 https://bugzilla.mozilla.org/show_bug.cgi?id=628747 找到了关于这个问题的说明。意思是：禁止这么做是出于安全考虑，svg 里面引用的所有 **外部资源** 包括 image, stylesheet, script 等都会被阻止。

里面还举了一个例子：假设没有这个限制，如果一个论坛允许用户上传这样的 svg 作为头像，就有可能出现这样的场景，一位黑客上传 svg 作为头像，里面包含代码：`<image xlink:href="http://evilhacker.com/myimage.png">`（假设这位黑客拥有对于 evilhacker.com 的控制权），那么这位黑客就完全能做到下面的事情：

- 只要有人查看他的资料，evilhacker.com 就会接收到一次 ping 的请求（进而可以拿到查看者的 ip）;
- 可以做到对于不同的 ip 地址的人展示不一样的头像；
- 可以随时更换头像的外观（而不用通过论坛管理员的审核）。

看到这里，大概就明白了整个问题的来龙去脉了，当然还有一点原因可能是避免图像递归。

### 解决办法
**思路**：由于安全因素，其实第一步的时候，图片已经显示不出来了。那么我们现在考虑的方法是在第一步之后遍历 svg 的结构，将所有的 image 元素的 url、位置和尺寸保存下来。在第三步之后，按顺序贴到 canvas 上。这样，最后导出的 png 图片就会有 svg 里面的 image。
**关键代码**：

```javascript
// 此处略去生成 svg url 的过程
var svgUrl = DomURL.createObjectURL(blob);
var svgWidth = document.querySelector('#kity_svg').getAttribute('width');
var svgHeight = document.querySelector('#kity_svg').getAttribute('height');

var embededImages = document.querySelectorAll('#kity_svg image');
// 由 nodeList 转为 array
embededImages = Array.prototype.slice.call(embededImages);
// 加载底层的图
loadImage(svgUrl).then(function(img) {

var canvas = document.createElement('canvas'),
ctx = canvas.getContext("2d");

canvas.width = svgWidth;
canvas.height = svgHeight;

ctx.drawImage(img, 0, 0);
	// 遍历 svg 里面所有的 image 元素
	embededImages.reduce(function(sequence, svgImg){

		return sequence.then(function() {
			var url = svgImg.getAttribute('xlink:href') + 'abc',
				dX = svgImg.getAttribute('x'),
				dY = svgImg.getAttribute('y'),
				dWidth = svgImg.getAttribute('width'),
				dHeight = svgImg.getAttribute('height');

			return loadImage(url).then(function(sImg) {
				ctx.drawImage(sImg, 0, 0, sImg.width, sImg.height, dX, dY, dWidth, dHeight);
			}, function(err) {
				console.log(err);
			});
		}, function(err) {
			console.log(err);
		});
	}, Promise.resolve()).then(function() {
		// 准备在前端下载
		var a = document.createElement("a");
		a.download = 'download.png';
		a.href = canvas.toDataURL("image/png");

		var clickEvent = new MouseEvent("click", {
		    "view": window,
		    "bubbles": true,
		    "cancelable": false
		});

		a.dispatchEvent(clickEvent);

		});

      }, function(err) {
	   	console.log(err);
   })

   // 省略了 loadImage 函数
   // 代码和第一个例子相同
```

**说明**：

1. 例子中 svg 里面的图像是根节点下面的，因此用于表示位置的 x, y 直接取来即可使用，在实际中，这些位置可能需要跟其他属性做一些运算之后得出。如果是基于 svg 库构建的，那么可以直接使用库里面用于定位的函数，比直接从底层运算更加方便和准确。
2. 我们这里讨论的是本域的图片的导出问题，跨域的图片由于「污染了」画布，在执行 `toDataUrl` 函数的时候会报错。


## 结语
在这里和大家分享了在前端将 svg 转为 png 的方法和过程中可能会遇到的两个问题，一个是浏览器对 canvas 的尺寸限制，另一个是导出图片的问题。当然，这两个问题还有其他的解决方法，同时由于知识所限，本文内容难免有纰漏，欢迎大家批评指正。最后感谢 [@techird](http://techird.com) 和 [@Naxior](https://github.com/Naixor) 关于这两个问题的讨论。

## 参考资料
1. StackOverflow 上关于 canvas 的尺寸限制：http://stackoverflow.com/questions/6081483/maximum-size-of-a-canvas-element
2. Chromium 关于 canvas 的 issue：https://code.google.com/p/chromium/issues/detail?id=339725
3. Chrome, Firefox 用到的图形库 skia : https://skia.org/
4. Safari 的关于 canvas 面积限制的源码： http://trac.webkit.org/browser/trunk/Source/WebCore/html/HTMLCanvasElement.cpp#L67
5. IE 关于 canvas 的限制说明：https://msdn.microsoft.com/en-us/library/ff975062(v=vs.85).aspx
6. SVG 加载外部资源的讨论：https://bugzilla.mozilla.org/show_bug.cgi?id=628747
