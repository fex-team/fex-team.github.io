---
layout: post
title: 2D 绘图技术中的坐标系统与坐标变换
author: techird
---

本文介绍在 2D 绘图技术中的坐标系统和坐标变换的相关知识。同时介绍 Kity 在这方面提供的 API 。希望这些知识对于需要进行图形应用开发的同学会有所帮助。


## 概述

坐标系统帮助我们在一个空间中定位物件和描述物件的几何属性。坐标系统有其维度属性，描述三维空间的物件我们需要三维的坐标系统，本文针对的是 2D 绘图技术中的坐标系统，故文章后面坐标系统均指二维坐标系统。

在平面当中，最常见的坐标系统是[笛卡尔坐标系][笛卡尔坐标系]和[极坐标系][极坐标系]。[笛卡尔坐标系][笛卡尔坐标系]就是我们熟知的平面直角坐标系，在 2D 绘图技术中，使用平面直角坐标系来定位和描述图形。

平面直角坐标系的概念读者应该比较熟悉，不在此赘述。需要注意的是，在 2D 屏幕设备中，使用的坐标系 y 轴方向都是向下的，这点跟数学上的习惯是相反的。这会让角度的扫描方向也是相反的（统一的描述为：从 x 轴正方向到 y 轴正方向为正角）。

![屏幕坐标系（左）和数学坐标系（右）](/img/coordinate-and-transform/difference-between-math.png)

## 当前坐标系与参照坐标系

在 2D 绘图中，每个绘图元素都有自己的一个坐标系，称为 `当前坐标系` 或 `自身坐标系`。当元素 A 作为容器元素 B 的一个子元素的时候，会很自然地把元素 B 的坐标系可以作为元素 A 的 `参照坐标系`。

默认情况下，A 的当前坐标系和其参照坐标系原点和轴是重合的。如果 A 进行了 `坐标变换` （文章后面会详细介绍），那么这两个坐标系不再重合，而且这个时候 A 在相对于 B 的 `参照坐标系` 中看起来也发生了变换。

考虑下面一段使用 [Kity][kity] 绘图的代码：

```js
var a = new kity.Rect(50, 50, 0, 0);  // 在 (0, 0) 处创建一个 50 x 50 的矩形
var b = new kity.Paper();             // 创建 Paper 作为容器
b.addShape(a);                        // 讲矩形放置在容器里
a.setTranslate(30, 40);               // 把 a 的坐标系平移 (40, 40)
console.log(a.getBoundaryBox())       // 返回：{ x: 0, y: 0, width: 50, height: 50 }
console.log(a.getRenderBox())         // 返回：{ x: 30, y: 40, width: 50, height: 50 }
```

![当前坐标系和参照坐标系](/img/coordinate-and-transform/reference-coordinate.png)

`getBoundaryBox()` 忠实地返回元素在当前坐标系中所占的矩形区域，而 `getRenderBox()` 则返回了元素在参照坐标系中所占的矩形区域。

细心的读者不难发现，参照坐标系是需要有一个参照物的，在上面的描述中，A 的参照物一直是其父容器 B。`getRenderBox()` 方法默认选择元素的父容器作为其参照物。

通俗来讲，元素在自身坐标系中的描述的是“我原本的样子”，而在参照坐标系中描述的是“我在别人眼里的样子”。“我的样子”在“别人眼中”改变了，不是因为我自己改变了，而是别人用了“特别的方式”看我。这里“特别的方式”就是别人把我的自身坐标转换为它的自身坐标。你可以这么认为：

```
参照坐标 = 坐标变换 ( 自身坐标, 变换系数 )
```

在元素上定义的坐标变换是相对于父容器的坐标变换，但是未必是最终相对于某个参照坐标系的坐标变换。这句话理解起来有点别扭，不妨看一个例子：

```js
var paper = new kity.Paper();
var group = new kity.Group();
var rect = new kity.Rect( 50, 50 );

paper.addShape(group);
group.addShape(rect);

rect.setTranslate(40, 30);
group.setTranslate(30, 40);

console.log(rect.getBoundaryBox());    // { x: 0, y: 0, width: 50, height: 50 }
console.log(rect.getRenderBox());      // { x: 40, y: 30, width: 50, height: 50 }
console.log(rect.getRenderBox(paper)); // { x: 70, y: 70, widht: 50, height: 50 }  
```

![多层变换](/img/coordinate-and-transform/deep-transform.png)

rect 相对于 group 的坐标变换是 `translate(40, 30)`，group 相对于 paper 的坐标变换是 `translate(40, 30)`。rect 计算相对于 paper 的坐标变换的时候，要把中间的每一层坐标变换都算上，最终的结果是 `translate(70, 70)`。

## 坐标变换

坐标变换是采用一定的数学方法将一个坐标系的坐标变换为另一个坐标系的坐标的过程。本文上面一部分内容已经涉及到了一些简单的坐标变换（平移）。

大多数 2D 绘图引擎针对 2D 坐标只支持线性变换。线性变换能解决很大一部分我们对图形变换的需求，比如平移、旋转、缩放、拉伸、镜像、对称等等。

线性变换的坐标转换过程是一个线性运算：

```
X' = aX + cY + e
Y' = bX + dY + f
```

该方程可以写成矩阵形式：

![线性变换方程](/img/coordinate-and-transform/transfrom-equation.png)

`X'` 和 `Y'` 元素是在参照坐标系中的坐标，`X` 和 `Y` 是元素在当前坐标系中的坐标。`a`、`b`、`c`、`d`、`e`、`f` 是线性变换方程的系数。而矩阵 [[a, c, e], [b, d, f], [0, 0, 1]] 被称为二维线性变换矩阵。

### 常用的变换。

#### 平移

考虑让 c = 0, y = 0, a = 1, d = 1。则变换方程变为：

```
X' = X + e
Y' = Y + f
```

X 坐标和 Y 坐标转换后都只是加了一个简单的常数。所以在参照坐标系中，可以看到原本的元素平移了。

![平移](/img/coordinate-and-transform/translate.png)

#### 旋转

设旋转的角度是 ø, 则线性变换系数是： a = cos(ø), b = sin(ø), c = -sin(ø), d = cos(ø)，e 和 f 为 0。旋转的线性变换系数可以通过余弦定理求出，有兴趣的同学可以自行证明。

![旋转](/img/coordinate-and-transform/rotate.png)

#### 缩放

a 和 d 是直接控制 X 坐标和 Y 坐标缩放的，让 a 和 d 为 2，其他系数为 0，图形在两个维度上都放大为原来的 2 倍。

![缩放](/img/coordinate-and-transform/scale.png)

### 变换列表

坐标经过一次变换 *M[1]* 之后，还可以继续经过变换 *M[2]*、*M[3]*、*M[4]* ... *M[n]*。最终变换出来的结果是这些变换矩阵的乘积：

*CTM* = *M[n]* · *M[n-1]* · ... · *M[2]* · *M[1]* · *M[0]*

注意，后面的变换要乘在前面。矩阵的乘法不具有交换律。这意味着先旋转再平移和先平移再旋转是不一样的结果。看下面一个实例：

```js
var a = new kity.Rect(30, 30).fill('red');
var b = new kity.Rect(30, 30).fill('blue');

paper.addShapes([a, b]);

a.setMatrix(new kity.Matrix().translate(50, 50).rotate(30));
b.setMatrix(new kity.Matrix().rotate(30).translate(50, 50));
```

![变换顺序](/img/coordinate-and-transform/transform-seq.png)

旋转始终围绕参照坐标系的原点进行。b 是先旋转再平移的，在旋转的时候，原点还是重合的。而 a 是先平移后旋转的，旋转的时候自身坐标的原点已经偏离了 b 的参照坐标系的原点。两个效果是有差别的。

变换列表在计算图形最终渲染结果的时候需要用到。计算具有层级结构的元素坐标变换需要把每个祖先的坐标变换算上。考虑一下的图形层级：

```
paper
|--g1
|  |--g2
|  |  |--rect
.. .. ..
```

则 rect 在渲染到 paper 的时候，进行了以下坐标变换：

*CTM<sub>rect</sub>* = *M<sub>g1</sub>* · *M<sub>g2</sub>* · *M<sub>rect</sub>*

## 在 Kity 中合理使用坐标系和线性变换

在 Kity 当中，提供了强大的坐标计算和变换能力。

### 获得相对于参照坐标系的坐标变换

使用 `Shape.getTransform(refer)` 方法获得一个元素坐标系到指定参照物的坐标变换。`refer`  为指定的参照物，为空则使用父容器为参照物。

### 获得在参照坐标系中的矩形区域

使用 `Shape.getRenderBox(refer)` 获得一个元素在指定的元素的坐标系中的矩形区域。`refer` 为参照物，为空则使用父容器为参照物。

### 设置相对于父容器的坐标变换

Kity 在一个元素上允许同时设置四个坐标变换：矩阵、平移、旋转、缩放。他们默认都是 null，即和父元素的坐标系重合。四个变换的接口分别是：

```js
shape.setMatrix(new kity.Matrix(a, b, c, d, e, f)) // 矩阵
shape.setScale(2, 2);       // 缩放
shape.setRotate(30);        // 旋转
shape.setTranslate(10, 20); // 平移
```

需要注意的是，无论变换接口的调用顺序如何，Kity 都是以以下顺序变换的：

1. 矩阵变换
2. 缩放
3. 旋转
4. 平移

这样是为了保证最常用的平移始终保持在参照坐标系的方向上进行。如果需要精细控制变换，可以通过设置变换矩阵来实现。

[笛卡尔坐标系]: http://zh.wikipedia.org/wiki/%E7%AC%9B%E5%8D%A1%E5%84%BF%E5%9D%90%E6%A0%87%E7%B3%BB
[极坐标系]: http://zh.wikipedia.org/wiki/%E6%9E%81%E5%9D%90%E6%A0%87%E7%B3%BB
[kity]: https://github.com/fex-team/kity