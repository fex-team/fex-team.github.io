---
layout: post
title: 实现动态验证码的思路
author: zswang
---

## 示例

![示例1](/img/captcha-gif/201407-captcha.gif)

![示例2](/img/captcha-gif/zswang-captcha.gif)

## 背景

验证码主要是防止机器暴力破解。之前的验证码都是以静态为主，现在一些产品开始使用动态方式，增加破解的难度。动态方式以 gif 最为简单可靠。gif 兼容性好，尺寸小。这里分享的就是一种，用 JS 实现 gif 动态验证码的思路。感谢关注。

## 任务分解

1.  绘制旋转的文字
2.  计算每个字符出现位置和角度
3.  生成 gif 图片

## 逐步求精

### 如何绘制旋转的文字？

了解能用的 API

* ```context.rotate(angle)``` 使当前坐标系旋转 angle，单位弧度
* ```context.translate(x, y)``` 使当前坐标系偏移 x, y，单位像素
* ```context.font``` 设置字体
* ```context.strokeText(text, x, y [, maxWidth ])``` 给文本描边
* ```context.fillText(text, x, y [, maxWidth ])``` 给文本填充

怎么以文字的中心位置旋转？

```javascript
void function() {
  // ...
  var x = 100;
  var y = 100;
  var angle = 1 / 8 * Math.PI;
  context.translate(x, y);
  context.rotate(angle);
  context.strokeText('A', 0, 0);
  // ...
}()
```

运行效果不够理想，以文字的左下角为圆心旋转，不符合预期
![示例1](/img/captcha-gif/demo1.jpg)

本打算做一下偏移的计算，一想到要计算文本中心位置貌似还挺复杂。
还是看看其他人怎么做的，通过关键词 `canvas rotate text center` 找到一点线索。

```javascript
context.save();
context.translate(newx, newy);
context.rotate(-Math.PI / 2);
context.textAlign = "center";
context.fillText("Your Label Here", labelXposition, 0);
context.restore();
```

`textAlign` 是横向对齐，再根据标准找到了一个纵向对齐 `textBaseline`

```javascript
void function() {
  // ...
  context.textAlign = 'center'; // <<<<<<< insert
  context.textBaseline = 'middle'; // <<<<<<< insert
  var x = 100;
  var y = 100;
  var angle = 1 / 8 * Math.PI;
  context.translate(x, y);
  context.rotate(angle);
  context.strokeText('A', 0, 0);
  // ...
}()
```

![示例2](/img/captcha-gif/demo2.jpg)

按我的习惯就这种“常用”功能就封装成函数

```javascript
/**
 * 绘制旋转的文字
 * @param {CanvasRenderingContext2D} context 上下文
 * @param {String} text 文本
 * @param {Number} x 中心坐标 x
 * @param {Number} y 中心坐标 y
 * @param {Number} angle 角度，单位弧度
 */
function rotateText(context, text, x, y, angle) {
  if (!context) {
    return;
  }

  context.save(); // 保存上次的风格设置
  context.textAlign = 'center'; // 横向居中
  context.textBaseline = 'middle'; // 纵向居中
  context.translate(x, y); // 修改坐标系原点
  context.rotate(angle); // 旋转
  context.strokeText(text, 0, 0); // 绘制文本
  context.restore(); // 恢复上次的风格设置
}
```

### 如何计算每个字符出现位置和角度？

背景文字左右平移 + 旋转，生成随机的字符串计算中心坐标就好了

前景文字基本相似，只要上下来回移动和稍微摇摆，这里用的 cos 曲线控制摇摆。

### 如何生成 gif 图片

生成 gif 有第三方库可以使用 gifjs。
这里要注意的是，gifjs 用到 worker 技术，所以得在 `http://` 环境里调试，不能用 `file://` 环境

注意：由于添加的是同一个 canvas 对象，所以的是使用 `copy` 模式，将图像数据保留给每一帧。

```javascript
gif.addFrame(canvasTemp, { delay: 100, copy: true });
```

## 完整代码

* [线上演示](http://jssdk.com/demo/captcha-gif.html)
* [代码地址](https://github.com/zswang/zswang.github.com/blob/master/demo/captcha-gif.html)

```html

<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
canvas {
  border: black 1px solid;
}
  </style>
  <script src="../library/gif.js"></script>
</head>
<body>
  <div>
    Key: <input type="text" maxlength="8" /> <input type="button" value="build" />
  </div>
  <canvas width="300" height="70"></canvas>
  <img width="300" height="70" /><a download="captcha.gif">download...</a>
  <script>

/**
 * 绘制旋转的文字
 * @param {CanvasRenderingContext2D} context 上下文
 * @param {String} text 文本
 * @param {Number} x 中心坐标 x
 * @param {Number} y 中心坐标 y
 * @param {Number} angle 角度，单位弧度
 */
function rotateText(context, text, x, y, angle) {
  if (!context) {
    return;
  }

  context.save(); // 保存上次的风格设置
  context.textAlign = 'center'; // 横向居中
  context.textBaseline = 'middle'; // 纵向居中
  context.translate(x, y); // 修改坐标系原点
  context.rotate(angle); // 旋转
  context.strokeText(text, 0, 0); // 绘制文本
  context.restore(); // 恢复上次的风格设置
}

/**
 * 随机字符串
 * @param{String} chars 字符串
 * @param{Number} len 长度
 */
function randomText(chars, len) {
  var result = '';
  for (var i = 0; i < len; i++) {
    result += chars.charAt(parseInt(chars.length * Math.random()));
  }
  return result;
}

void function() {
  // @see http://www.w3.org/TR/2dcontext/
  var canvas = document.querySelector('canvas');
  var context = canvas.getContext('2d');

  context.font = '30px Verdana'; // 字体大小和字体名

  var lineHeight = 15; // 行高
  var backLength = 3;
  var backTexts = {};
  var backXOffsets = {};
  var keyYOffsets = {};
  var keyAOffsets = {};
  var backSpeed = 10000 + parseInt(100 * Math.random());
  var keySpeed = 12000 + parseInt(100 * Math.random());
  var key = '';
  
  function init(value) {
    key = String(value).toUpperCase();
    // 随机备件
    for (var i = 0; i < canvas.height / lineHeight; i++) {
      backTexts[i] = randomText('ABCDEFGHIJKLMNOPQRST0123456789', backLength);
      backXOffsets[i] = Math.random() * canvas.width;
    }
    for (var i = 0; i < key.length; i++) {
      keyYOffsets[i] = Math.random() * lineHeight / 2;
      keyAOffsets[i] = 0.05 - Math.random() * 0.1;
    }
  }

  function renderBack(now, context, text, y, xOffset) {
    var tick = now % backSpeed;
    for (var i = 0; i < backLength; i++) {
      var t = (xOffset + (tick / backSpeed) * canvas.width + 
        (canvas.width / backLength) * i) % canvas.width;
      rotateText(context, text[i], t, y,
          i / backLength * Math.PI * 2 + (tick / backSpeed) * Math.PI * 2);
    }
  }

  function render(now, context) {
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#000000';

    // 绘制背景文字
    for (var i = 0; i < canvas.height / lineHeight; i++) {
      renderBack(now, context, backTexts[i], lineHeight * i, backXOffsets[i]);
    }

    // 绘制 key
    var tick = now % keySpeed;
    var keyCharWidth = canvas.width / key.length;
    for (var i = 0; i < key.length; i++) {
      var tx = keyCharWidth + (((canvas.width - keyCharWidth) / key.length) * i) % canvas.width;
      var ty = Math.cos(now / 1000) * Math.PI * keyYOffsets[i];
      rotateText(context, key[i], tx,
        canvas.height / 2 - ty, Math.cos(now / 1000) * Math.PI * 0.1 + keyAOffsets[i]);
    }
  }
  init('zswang');
  setInterval(function() {
    render(Number(new Date), context);
  }, 100);


  document.querySelector('input[type=text]').addEventListener('input', function() {
    init(this.value);
  });

  document.querySelector('input[type=button]').addEventListener('click', function() {
    var self = this;
    self.disabled = true;
    var gif = new GIF({
      repeat: 0,
      workers: 2,
      quality: 10,
      workerScript: '../library/gif.worker.js'
    });

    var canvasTemp = document.createElement('canvas');
    canvasTemp.width = canvas.width;
    canvasTemp.height = canvas.height;
    var context = canvasTemp.getContext('2d');
    context.font = '30px Verdana'; // 字体大小和字体名
    context.textAlign = 'center';
    for (var i = 0; i < 5000; i += 100) {
      render(i, context);
      gif.addFrame(canvasTemp, { delay: 100, copy: true });
    }
    gif.on('finished', function(blob) {
      var url = URL.createObjectURL(blob);
      document.querySelector('img').src = url;
      document.querySelector('a').href = url;
      self.disabled = false;
    });
    gif.render();
  });
}();
  </script>
</body>
</html>
```

## 后记

功能比较简单，也写得比较简单，仅供参考。
如果要应用到实战，还有很多细节要考虑

* 缓存（背景效果可以重复利用一段时间）。
* 图片大小需要优化，目前是 200K（通过调整帧率和压缩比）。
* 提供方便的调用接口（模块化）。

## 参考资料

* [HTML Canvas 2D Context](http://www.w3.org/TR/2dcontext/)
* [JavaScript GIF encoding library](https://github.com/jnordberg/gif.js)
* [Drawing rotated text on a HTML5 canvas](http://stackoverflow.com/questions/3167928/drawing-rotated-text-on-a-html5-canvas)