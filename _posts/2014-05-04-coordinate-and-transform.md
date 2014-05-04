---
layout: post
title: 2D 绘图技术中的坐标系统与坐标变换
author: techird
---

本文介绍在 2D 绘图技术中的坐标系统和坐标变换的相关知识。同时介绍 Kity 在这方面提供的 API 。希望这些知识对于需要进行图形应用开发的同学会有所帮助。


## 锤子的故事

很久以前，有一个画家，他很擅长画锤子。他在画板上画了一个矩形，然后又画了一个矩形，如下图，然后锤子就出来了。

![锤子的绘制过程](/img/coordinate-and-transform/hammer.png)

后来画家转行当程序员，老板要求他把锤子在电脑上绘制出来。很自然地，他算好两个矩形应该在画布上的坐标，然后绘制了出来：

![锤子的绘制过程 2](/img/coordinate-and-transform/hammer2.png)

他的代码是这样的：

```js
var rect1 = new kity.Rect(w1, h1, x1, y1);
var rect2 = new kity.Rect(w2, h2, x2, y2);
paper.addShapes([rect1, rect2]);
```
有一天老板说，我要把锤子放在比较右边的位置。画家说，没问题，他把代码改成：

```js
var rect1 = new kity.Rect(w1, h1, x1 + 100, y1);
var rect2 = new kity.Rect(w2, h2, x2 + 100, y2);
paper.addShapes([rect1, rect2]);
```

聪明的画家看了一下代码，想到了一件事，假如说老板突然有一天让我画一把瑞士军刀，怎么办？假如哪一天，老板还让我旋转一下这把瑞士军刀，又怎么办。


老板的要求看起来并不是很过分，画家读了<a name="Recursive" href="#Recursive">这篇文章</a>之后恍然大悟，可以灵活应对老板的各种要求。

## 坐标系概述

坐标系统帮助我们在一个空间中定位图形和描述图形的几何属性。坐标系统有其维度属性，描述不同纬度的图形需要的坐标系也不同。本文针对的是 2D 绘图技术中的坐标系统，故文章后面坐标系统均指二维坐标系统。

在平面当中，最常见的坐标系统是[笛卡尔坐标系][笛卡尔坐标系]和[极坐标系][极坐标系]。[笛卡尔坐标系][笛卡尔坐标系]就是我们熟知的平面直角坐标系，在 2D 绘图技术中，使用平面直角坐标系来定位和描述图形。

平面直角坐标系使用两条互相垂直的数轴来表示，分别称为 X 轴和 Y 轴，它们的交点称为原点。

需要注意的是，在 2D 屏幕设备中，Y 轴方向都是向下的，这点跟数学上的习惯是相反的。Y 轴方向朝下的笛卡尔系会有以下特性：

1. Y 坐标越大，位置在越“下面”
2. 角度的扫描方向为顺时针方向（统一的描述为：从 X 轴正方向到 Y 轴正方向为正角）。

![屏幕坐标系（左）和数学坐标系（右）](/img/coordinate-and-transform/difference-between-math.png)

图：「屏幕坐标系」（左）「和数学坐标系」（右）

## 自身坐标系与参考坐标系

### 自身坐标系和参考坐标系

在计算机 2D 绘图技术中，每个绘图元素都有自己的一个坐标系，称为「自身坐标系」。当图形 A 放作为图形 B 的一个元素的时候，可以把图形 B 的自身坐标系作为图形 A 的参考坐标系。

为了下文描述方便，我们约定：

- 约定1. 图形 A 的自身坐标系记为 O<sub>A</sub>
- 约定2. 图形 A 在以图形 B 为参照物观察时使用的参考坐标系记为 O<sub>B</sub><sup>A</sup>

O<sub>A</sub> 直接称为 A 的坐标系。O<sub>B</sub><sup>A</sup> 本质上也是 O<sub>B</sub>，上标表示在描述 A 的时候使用。

需要注意「自身坐标系」和「参考坐标系」的差别。

#### 区别一：产生的场景不同

「自身坐标系」是图形天生带有的，并且只有一个，它独立存在图形中，不离不弃，忠实服务。创建一个图形，意味着创建了一个自身坐标系。

「参考坐标系」是图形复合时产生了从属关系之后的说法。考虑画家的锤子 C，它由两个矩形 A 和 B 组成。这里形成了 3 个自身坐标系。但是我们把 A 和 B 放进 C 里面的时候，A 和 B 不仅可以基于自身坐标系（O<sub>A</sub> 和 O<sub>B</sub>）来描述（观察），它还可以使用 C 的坐标系（O<sub>C</sub><sup>A</sup> 和 O<sub>C</sub><sup>B</sup>）来描述（观察）。

![锤子的坐标系](/img/coordinate-and-transform/hammer3.png)

重合的三个自身坐标系

> 这里从属关系不一定非要是同族从属，只要两个图形具有公共祖先就可以认为具有从属关系。像上述的锤子 C，它的两个部件 A 和 B 其实也具有从属关系，他们可以使用彼此的自身坐标系作为参考坐标系。
> 也不要求前驱后驱关系，锤子 C 也可以以部件 A 的坐标系为参考坐标系，只不过更常见的是局部的图形以全局图形的坐标系来观察。

#### 区别二：数量不同

对于每个图形，自身坐标系只有一个，而参考坐标系可以针对不同的情况选区不同的参考坐标系。

#### 区别三：使用的目的不同

「自身坐标系」是用于定义图形的，「参考坐标系」是用来观察图形的。

我们去绘制图形的时候，使用的坐标系都是「自身坐标系」，只有基于自身坐标系的图形定义。比如我们描述一个矩形，它的位置在 (10, 10)，大小是 (20, 30)。这些坐标以及长度，都是基于自身坐标系来描述的。这个描述是最原始的，在其它参考坐标系中观察的结果，都依赖于这个原始的描述。

「参考坐标系」是要来观察一个图形在某个坐标系中的呈现。比如一个在自身坐标系中坐标为 (0, 0) 的矩形，它在它父元素中的坐标可能是 (100, 100)。(100, 100) 只是一个观察结果，在参考坐标系中观察，一般是为了在参考坐标系中来描述其它图形时，需要参考被观察图形的情况。

### 实际例子

考虑下面一段使用 [Kity][kity] 绘图的代码：

```js
var a = new kity.Rect(50, 50, 0, 0);  // 在 (0, 0) 处创建一个 50 x 50 的矩形
var b = new kity.Paper();             // 创建 Paper 作为容器
b.addShape(a);                        // 讲矩形放置在容器里
a.setTranslate(30, 40);               // 把 a 的坐标系平移 (30, 40)
console.log(a.getBoundaryBox())       // 返回：{ x: 0, y: 0, width: 50, height: 50 }
console.log(a.getRenderBox())         // 返回：{ x: 30, y: 40, width: 50, height: 50 }
```

这段代码可以这样解读：

- 代码创建了图形 a，和绘图容器 b。
- 把 a 加到了 b 中
- 设置 a 的坐标变换：平移 (30, 40)。（后续详细介绍）
- `a.getBoundaryBox()` 忠实地返回图形 a 在 O<sub>a</sub> 中所占的矩形区域
- `a.getRenderBox()` 则返回了图形 a 在 O<sub>b</sub><sup>a</sup> 中所占的矩形区域。
- 定义 a 的位置和形状（x, y, width, height) 使用的是 O<sub>a</sub>
- 在 b 中观察 a 使用的是 O<sub>b</sub><sup>a</sup>

运行结果为（坐标系辅助线是人为加上的）：

![自身坐标系和参考坐标系](/img/coordinate-and-transform/reference-coordinate.png)

## 坐标变换

同一个图形在参考坐标系中观察的结果与在自身坐标系中不一样，是因为参考坐标系相对自身坐标系发生了「坐标变换」。

「坐标变换」是采用一定的数学方法将一个坐标系的坐标变换为另一个坐标系的坐标的过程。

我们来继续锤子的故事。画家希望他的锤子的参考点是两个矩形连接处的中心，于是他给两个矩形的坐标系进行了一个「坐标变换」：

![锤子的坐标变换](/img/coordinate-and-transform/hammer4.png)

那么这个变换是怎么做的？请看下文分解。

### 线性变换

「线性变换」是 2D 绘图领域中应用最广的「坐标变换」，它可以满足我们很大一部分对图形变换的需求，如平移、旋转、缩放、拉伸、镜像、对称等。

为了方便文章后续的描述，我们约定：

- 约定3：从 O<sub>A</sub> 到 O<sub>B</sub><sup>A</sup> 的线性变换记为 T<sub>A</sub><sup>B</sup>

T<sub>A</sub><sup>B</sup> 的意义为：(X, Y) 为 A 在 O<sub>A</sub> 中任意一点的坐标，(X', Y') 是 A 在 O<sub>B</sub><sup>A</sup> 中的坐标，线性变换 T<sub>A</sub><sup>B</sup> 由 6 个参数 (a, b, c, d, e, f) 来描述，变换的运算过程为：

```
X' = aX + cY + e
Y' = bX + dY + f
```

该方程可以写成矩阵形式：

![线性变换方程](/img/coordinate-and-transform/transfrom-equation.png)

这个矩阵称为「二维线性变换矩阵」，记为 M。矩阵 6 个参数的默认值是 (1, 0, 0, 1, 0, 0)。取该值的变换是无变换，因为

```
X' = X
Y' = Y
```

### 常用的线性变换

通过不同的线性变换参数，可以得到不同的变换效果。

#### 平移

考虑让 c = 0, y = 0, a = 1, d = 1。则变换方程变为：

```
X' = X + e
Y' = Y + f
```

X 坐标和 Y 坐标转换后都只是加了一个简单的常数。所以在参考坐标系中，可以看到原本的元素平移了。

![平移](/img/coordinate-and-transform/translate.png)

#### 旋转

旋转是以参考坐标系的原点为焦点的。

使用极坐标的参数方程可以很容易求出旋转的变换矩阵系数。自身坐标系的参数方程为：

```
X = r·cos(α)
Y = r·sin(α)
```

设旋转的角度是 ø, 则有：

```
X' = r·cos(α + ø) = r·cos(α)·cos(ø) - r·sin(α)·sin(ø) = cos(ø)·X + (-sin(ø))·Y + 0
Y' = r·sin(α + ø) = r·cos(α)·sin(ø) + r·sin(α)·cos(ø) = sin(ø)·X + cos(ø)·Y + 0
```

所以，旋转的线性变换矩阵系数是：a = cos(ø), b = sin(ø), c = -sin(ø), d = cos(ø)，e 和 f 为 0。

![旋转](/img/coordinate-and-transform/rotate.png)

#### 缩放

缩放是以参考坐标系的原点为焦点的。

a 和 d 是直接控制 X 坐标和 Y 坐标的缩放，让 a 和 d 为 2，其他系数为 0，图形在两个维度上都放大为原来的 2 倍。

![缩放](/img/coordinate-and-transform/scale.png)

### 线性变换列表

坐标经过一次线性变换 *M<sub>1</sub>* 之后，还可以继续经过线性变换 *M<sub>2</sub>*、*M<sub>3</sub>*、*M<sub>4</sub>* ... *M<sub>n</sub>*。最终变换出来的结果是这些变换矩阵的乘积：

*CTM* = *M<sub>n</sub>* · *M<sub>n-1</sub>* · ... · *M<sub>2</sub>* · *M<sub>1</sub>* · *M<sub>0</sub>*

注意，后面的变换要乘在前面。矩阵的乘法不具有交换律。这意味着先旋转再平移和先平移再旋转是不一样的结果。看下面一个实例：

```js
var a = new kity.Rect(30, 30).fill('red');
var b = new kity.Rect(30, 30).fill('blue');

paper.addShapes([a, b]);

a.setMatrix(new kity.Matrix().translate(50, 50).rotate(30));
b.setMatrix(new kity.Matrix().rotate(30).translate(50, 50));
```

![变换顺序](/img/coordinate-and-transform/transform-seq.png)

旋转始终围绕参考坐标系的原点进行。b 是先旋转再平移的，在旋转的时候，原点还是重合的。而 a 是先平移后旋转的，旋转的时候自身坐标的原点已经偏离了 b 的参考坐标系的原点。两个效果是有差别的。

### 线性变换在图形上的应用

#### 前驱坐标系和图形的变换矩阵

我们不可能为图形的每一个参考坐标系都设置一个变换矩阵。实际上，很多 2D 绘图引擎都有「前驱坐标系」的概念。「前驱坐标系」就是参照物为容器的参考坐标系。

我们约定：

- 约定4：使用数学上集合的概念来表示图形的包含关系，如果 A 是 B 的一个元素（或者说 B 是 A 的容器），表示为 A ∈ B
- 约定5：如果 A ∈ B，那么 O<sub>B</sub><sup>A</sup> 是 A 的「前驱坐标系」，表示为 O<sub>prev</sub><sup>A</sup>
- 约定6：从 O<sub>A</sub> 到 O<sub>prev</sub><sup>A</sup> 的线性变换为 T<sub>A</sub><sup>prev</sup>，该线性变换的矩阵为 M<sub>A</sub>

一系列的约定，其实是为了清楚的描述了图形 A 上的变换矩阵 M<sub>A</sub> 的含义。它表示从「自身坐标系」到「前驱坐标系」的线性变换。

#### 多层包含关系的变换组合

在计算相对某个参考坐标系的线性变换时，如果参照物不是图形的直接父级，需要把每一层图形的变换矩阵都计算上。考虑以下的图形层级：

```
paper
|--group
|  |--rect
.. .. ..
```

这种情况下，会有 T<sub>rect</sub><sup>paper</sup> = M<sub>group</sub> · M<sub>rect</sub>

看这个例子的 Live 版本：

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

rect 的变换矩阵是 `matrix(1, 0, 0, 1, 40, 30)`，group 的变换矩阵是 `matrix(1, 0, 0, 1, 30, 40)`。rect 计算相对于 paper 的坐标变换的时候，要把中间的每一层坐标变换都算上，最终的结果是 `matrix(1, 0, 0, 1, 70, 70)`。

#### 变来变去的锤子

现在画家的锤子可以随意变来变去了。

首先，画家把锤子放进了 paper 上：

![放进 paper 中的锤子](/img/coordinate-and-transform/hammer6.png)

可是画家发现锤子只剩下了半个手柄！他沉思了一会，想起来一件事。锤子 C 放到 paper 里的时候，锤子的坐标系 O<sub>C</sub> 和 paper 的坐标系是重合的，而锤子的部件 A 和 B 因为要以 O<sub>C</sub> 为中心定位，进行了一个坐标转换。所以现在 A 和 B 都有超出了 paper 视野的部分。于是乎，画家设置了锤子 C 的变换矩阵，让 O<sub>C</sub> 相对 O<sub>paper</sub> 进行了一个平移：

![放进 paper 中的锤子 2](/img/coordinate-and-transform/hammer7.png)

现在锤子已经在画布上了，当然画家不满足，他想把锤子旋转 45 度，然后他在现在的基础上把锤子旋转了 45 度，然后他看到：

![放进 paper 中的锤子 3](/img/coordinate-and-transform/hammer8.png)

画家有点懵，这跟他的预期不一样啊。他沉思了一会，想起来了另一件事。画家是先做的平移再旋转，因为旋转的时候 O<sub>C</sub> 的原点已经偏离了 O<sub>paper</sub> 的原点，所以是这种效果。于是画家连夜改代码，先进行旋转变换，再平移，于是乎：

![放进 paper 中的锤子 4](/img/coordinate-and-transform/hammer9.png)

画家大呼过瘾，原来用计算机绘图是如此的有趣。

现在不妨使用上面的知识分析一下画家最终画出来的锤子。

1. A 在 O<sub>A</sub> 中的坐标依然是 (0, 0)。

2. A 在 O<sub>C</sub><sup>A</sup> 中的坐标是 (-50, -50)，因为 M<sub>A</sub> = (1, 0, 0, 1, -50, -50)，坐标经行了变换

3. C 相对于 paper 进行了坐标变换 M<sub>C</sub>，M<sub>C</sub> 是两个变换组合的效果：

   M<sub>C</sub> = M<sub>C<sub>rotate</sub></sub> · M<sub>C<sub>translate</sub></sub> 

   这个组合表示先平移后旋转。

4. 计算 A 在 O<sub>paper</sub> 的坐标时，需要进行的坐标转换有两个：
   
   T<sub>A</sub><sup>paper</sup> = M<sub>C</sub> · M<sub>A</sub>

   因为 C ∈ paper，并且 A ∈ C

## 在 Kity 中使用坐标系和线性变换

[Kity][kity] 是百度社区基础技术部 [FEX][fex] 团队开发的一个矢量图形库。在 Kity 当中，提供了强大的坐标计算和变换能力。

### 获得相对于指定参考坐标系的线性变换

使用 `Shape.getTransform(refer)` 方法获得一个元素坐标系到指定参考物的坐标变换。`refer`  为指定的参照物，为空则使用父容器为参考物。例如：

```js
var a = new kity.Rect(100, 100, 0, 0)setTranslate(10, 10);
var g1 = new kity.Group().setTranslate(20, 20).addShape(a);
var g2 = new kity.Group().setTranslate(30, 30).addShape(g1);
paper.addShape(g2);

console.log(a.getTransform());      // {a: 1, b: 0, c: 0, d: 1, e: 10, f: 10}
console.log(g1.getTransform());     // {a: 1, b: 0, c: 0, d: 1, e: 20, f: 20}
console.log(g2.getTransform());     // {a: 1, b: 0, c: 0, d: 1, e: 30, f: 30}
console.log(a.getTransform(g2));    // {a: 1, b: 0, c: 0, d: 1, e: 30, f: 30}
console.log(a.getTransform(paper)); // {a: 1, b: 0, c: 0, d: 1, e: 60, f: 60}
```

### 获得图形在自身坐标系的边界

每个图形都有一个矩形边界，这个边界的意义是：

- x 表示图形 x 坐标的最小值
- y 表示图形 y 坐标的最小值
- width 表示图形 x 坐标最大的差值
- height 表示图形 y 坐标最大的差值

下图分别是一个矩形、一个三角形、一个圆形的 boundaryBox：

![boundaryBox](/img/coordinate-and-transform/bbox.png)

使用 `Shape.getBoundaryBox()` 获得元素在自身坐标系的边界。上图的 kity 代码是：

```js
var paper = new kity.Paper(document.body);

function bbox(shape) {
    var box = shape.getBoundaryBox();
    return new kity.Rect(box.width, box.height, box.x, box.y).stroke('red');
}

var rect = new kity.Rect(100, 50, 30, 30).fill('blue').setOpacity(0.5);
var triangle = new kity.RegularPolygon(3, 50, 200, 50).fill('blue').setOpacity(0.5);
var circle = new kity.Circle(40, 305, 60).fill('blue').setOpacity(0.5);
paper.addShapes([rect, triangle, circle]);
paper.addShapes([rect, triangle, circle].map(bbox));
```

### 获得图形在指定参考坐标系中的矩形区域

使用 `Shape.getRenderBox(refer)` 获得一个元素在指定的元素的坐标系中的矩形区域。`refer` 为参照物，为空则使用父容器为参考物。它的算法是这样的：

- 获得图形的 BoundaryBox
- 得到四个点 [x, y], [x + width, y], [x, y + height], [x + width, y + height]
- 获得图形相对于 refer 的线性变换 CTM
- 对四个点执行线性变换 CTM，得到另外四个点，称为 closurePoints
- 对 closurePoints 的每个点的坐标查找最大值和最小值，返回的 renderBox 为：
  - x = xMin
  - y = yMin
  - width = xMax - xMin
  - height = yMax - yMin
- 会同时返回 closurePoints

举个例子：

```js
var paper = new kity.Paper(document.body);

function rbox(shape) {
    var box = shape.getRenderBox();
    return new kity.Rect(box.width, box.height, box.x, box.y).stroke('green');
}

paper.setWidth(600).setHeight(400);

var rect = new kity.Rect(100, 50)
    .setTranslate(20, 20)
    .fill('blue').setOpacity(0.3);

var triangle = new kity.RegularPolygon(3, 50)
    .setTranslate(200, 50).setRotate(90)
    .fill('blue').setOpacity(0.3);

var circle = new kity.Circle(30, 205, 35)
    .setScale(1.5)
    .fill('blue').setOpacity(0.3);

paper.addShapes([rect, triangle, circle]);
paper.addShapes([rect, triangle, circle].map(rbox));
```

效果如下：

![renderBox](/img/coordinate-and-transform/rbox.png)

### 设置线性变换

Kity 在一个元素上允许同时设置四个变换矩阵分量：矩阵（M<sub>matrix</sub>）、平移（M<sub>translate</sub>）、旋转（M<sub>rotate</sub>）、缩放（M<sub>scale</sub>）。他们默认都是 null，即和父元素的坐标系重合。四个变换的接口分别是：

```js
shape.setMatrix(new kity.Matrix(a, b, c, d, e, f)) // 矩阵
shape.setScale(2, 2);       // 缩放
shape.setRotate(30);        // 旋转
shape.setTranslate(10, 20); // 平移
```

图形最终的变换矩阵 M = M<sub>matrix</sub> · M<sub>scale</sub> · M<sub>rotate</sub> · M<sub>translate</sub> 

也就是说，无论变换接口的调用顺序如何，Kity 都是以以下顺序变换的：

1. 矩阵变换
2. 缩放
3. 旋转
4. 平移

使用这个顺序的目的是为了保证最常用的平移始终保持在参考坐标系的方向上进行。如果需要精细控制变换，可以通过设置变换矩阵来实现。

## 延伸阅读

- [(SVG)Coordinate Systems, Transformations and Units](http://www.w3.org/TR/SVG/coords.html)


[笛卡尔坐标系]: http://zh.wikipedia.org/wiki/%E7%AC%9B%E5%8D%A1%E5%84%BF%E5%9D%90%E6%A0%87%E7%B3%BB
[极坐标系]: http://zh.wikipedia.org/wiki/%E6%9E%81%E5%9D%90%E6%A0%87%E7%B3%BB
[kity]: https://github.com/fex-team/kity
[fex]: http://fex.baidu.com