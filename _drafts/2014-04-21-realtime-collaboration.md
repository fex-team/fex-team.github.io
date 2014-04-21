---
layout: post
title: 实时协同编辑的实现
author: nwind
---

在最近想做的某个项目中打算使用协同编辑来解决冲突问题，因此抽空调研了实现方案，结果发现要想真正做好是很不容易的，这里整理了一下我所看到的几种方法。

## 什么是实时协同编辑

通常提到实时协同编辑，最常见的例子就是 Google Docs，它能实现多人同时编辑同一份文档，别人做出修改后你能很快看到，而不用手动刷新页面。其实从广义上讲，网游也能称为是一种实时编辑的应用，因为它允许多人同时进行操作。

## 可选方案

### 编辑锁

这是实现协同编辑最简单的方法，当一个人开始编辑时，系统就会将这个文件先锁定，不让其他人同时编辑，这种方式虽然可以避免覆盖问题，但使用体验不好，所以这里就不讨论了。

### GNU diff-patch

最简单的方法就是使用 UNIX 下的 diff 命令，它能输出两个文本的不同之处，而合并可以使用 patch 命令，我们只要在 JS 中实现这两个算法就可以了，有了这两个函数，就能通过如下流程来实现协同编辑：

1. 每个用户进来时都建立长连接（最好是基于 WebSocket）
2. 有人编辑时，如果停顿 2 秒，就将这次修改的 diff 结果传给服务端
3. 服务端通过长连接将这个 diff 发给同时在编辑的其它用户，使用 patch 方法来更新当前文档

这种实现方法很简单，但如果我们仔细观察 diff 结果，就会发现它有严重的问题，比如两段文本

```console
[nwind@fex ~]$ cat old.txt
百度 Web

[nwind@fex ~]$ cat other-new.txt
百度 Web 前端
```

它们的 diff 结果是，其中 `old.txt` 代表原始版本，`other-new.txt` 代表别人修改的版本

```console
[nwind@fex ~]$ diff old.txt other-new.txt > old-to-other-new.patch
[nwind@fex ~]$ cat old-to-other-new.patch
1c1
< 百度 Web
---
> 百度 Web 前端
```

在这个 diff 结果中顶部的 `1c1` 的第一个「1」代表修改前的第一行，后面的「c」代表「修改」，第二个「1」代表修改后的行，也就是说将第一行的「百度 Web」改成「百度 Web 前端」，修改后的内容放第一行。从这里可以看出来，GNU diff 是基于行来进行比较的，如果两个人同时修改一行中的不同文字，即便这段文字可能不相关，合并也会失败，从如下测试就能看出来：

```console
[nwind@fex ~]$ cat my-new.txt
Web

[nwind@fex ~]$ patch my-new.txt < old-to-other-new.patch
patching file b-new.txt
Hunk #1 FAILED at 1.
1 out of 1 hunk FAILED -- saving rejects to file my-new.txt.rej

[nwind@fex ~]$ cat my-new.txt.rej
***************
*** 1
- 百度 Web--- 1 -----
+ 百度 Web 前端
```

其中 `my-new.txt` 可以认为是我修改的版本，我去掉了前面的「百度 」，只留下「Web」，但合并失败了，并生成了一个新文件 `my-new.txt.rej` 来描述失败原因，这种展现方式并不直观，需要打开两个文件比对，能否在一个文件中将冲突都显示出来呢？答案是可以，方法是使用 merge 命令，它的使用方法如下：

```console
[nwind@fex ~]$ merge my-new.txt old.txt other-new.txt
merge: warning: conflicts during merge

[nwind@fex ~]$ cat my-new.txt
<<<<<<< my-new.txt
Web=======
百度 Web 前端>>>>>>> other-new.txt
```

可以看到它有个冲突提示，并在 `my-new.txt` 中标识了那些地方是冲突的，比 patch 结果看起来要方便些，详细这个结果做开发的同学都会很熟悉，它其实是 Git 等工具[默认的合并算法](https://github.com/git/git/blob/master/Documentation/git-merge.txt#L211)。

然而使用 merge 有个很严重的问题，因为它必须基于 3 个完整的文本来进行比较，这将导致每次修改都得传递整个文档内容，因此它不适合实时协同编辑。既然 GNU diff 这种基于行的比较算法无法解决一行内的冲突，是否有基于字符粒度的 diff 算法呢？当然有，那就是我们接下来将介绍的 Myer's diff-patch。

### Myer's diff-patch

[Myer 算法](http://neil.fraser.name/software/diff_match_patch/myers.pdf)在细节处理方面效果会更好，Google 还开源了[各个语言版本的实现](https://code.google.com/p/google-diff-match-patch/)，具体算法可以阅读相关论文，我们用之前的例子来测试它的结果：

```javascript
var old_text = "百度 Web";
var new_text = "百度 Web 前端";

var dmp = new diff_match_patch();
var patch_list = dmp.patch_make(old_text, new_text);
patch_text = dmp.patch_toText(patch_list);

console.log(decodeURI(patch_text))
```

输出结果为

```
@@ -1,6 +1,9 @@
 百度 Web
+ 前端
```

其中第一行的 `-` 和 `+` 两个符号没有什么意义，这句话表示修改处之前的起始位置为 1（由于数组是从 0 开始的，所以内部计算时会先减一），长度为 6，后面的 `1,9`，表示修改后的起始位置为 1，长度为 9。在接下来的两段文本代表修改的地方，注意「百度 Web」前面有空格，这代表相等，也就是直接添加这个字符串，而后面的 `+` 代表添加文本，具体细节可以通过它的[实现源码](https://code.google.com/p/google-diff-match-patch/source/browse/trunk/javascript/diff_match_patch_uncompressed.js#2100)确认：

```javascript
if (sign == '-') {
  // Deletion.
  patch.diffs.push([DIFF_DELETE, line]);
} else if (sign == '+') {
  // Insertion.
  patch.diffs.push([DIFF_INSERT, line]);
} else if (sign == ' ') {
  // Minor equality.
  patch.diffs.push([DIFF_EQUAL, line]);
} else if (sign == '@') {
  // Start of next patch.
  break;
} else if (sign === '') {
  // Blank line?  Whatever.
} else {
  // WTF?
  throw new Error('Invalid patch mode "' + sign + '" in: ' + line);
}
```

可以看到它的 diff 策略是基于字符的，是否能解决我们之前遇到的冲突问题呢？我们使用它的 `patch_apply` 方法来测试一下，方法如下

```javascript
//相关代码同上
var patches = dmp.patch_fromText(patch_text);
var results = dmp.patch_apply(patches, "Web");

console.log(results[0]); //Web 前端
```

它的输出结果为 `Web 前端`，这个结果是正确的，也就是说它能很好地解决同一行不同位置修改的冲突问题，但如果是同一个位置的修改了？我做了如下实验：

```javascript
var old_text = "百度 Web";
var other_new_text = "百度 Web 后端";
var my_new_text = "百度 Web 前端";
...
//结果为「百度 Web 前端 后端」

===
var old_text = "百度 Web 前端";
var other_new_text = "百度 Web 后端";
var my_new_text = "百度 Web 全端";
...
//结果为「百度 Web 后端」

===
var old_text = "百度 Web";
var other_new_text = "Web 前端";
var my_new_text = "百度 FE";
//结果为「FE 前」 
```

第一个例子是在后面添加不同的字符，它的结果是两个添加都生效，第二个例子是在同一处修改成不同的字符，它的结果是别人的修改生效，最后一个例子出错了，丢失了「端」字，对于富文本这是不可接受的，比如 `<b>` 少了 `>` 就不是一个标签了。

整体上看 Myer 算法可以低成本地解决大部分问题，所以有些在线编辑器选择它来实现协同编辑功能，比如 [codebox](http://codebox.io)，它的客户端代码[在这](https://github.com/FriendCode/codebox/blob/master/client/utils/filesync.js)，服务端代码[在这](https://github.com/FriendCode/codebox/blob/master/core/cb.files.sync/models/document.js)，codebox 的编辑体验做得相当不错，很值得参考。

### Operational Transformation

是否还有更好的算法？很早之前 Google Wave 推出时就听说过它使用的 Operational Transformation 技术（下面简称 OT），它还用在 Google Docs 等产品中，所以是经过验证的，值得研究。

OT 给人的感觉是很复杂，因为它的相关介绍文章都写得很长，比如[这篇](http://www3.ntu.edu.sg/home/czsun/projects/otfaq/)及维基百科上的[介绍](http://en.wikipedia.org/wiki/Operational_transformation)，不过仔细看后发现它的原理并不复杂。

首先，我们可以将文本内容修改转成以下 3 种类型的操作(Operational)：

* retain(n)：保持 n 个字符，也就是说这 n 个字符不变
* insert(str)：插入字符 str
* delete(str)：删除字符 str

举个例子，假设 A 用户将「百度 Web」变成「Web 前端」，相当于产生了如下 3 个操作：

```
delete('百度 '),
retain(3),
insert(' 前端')
```

提取这些操作可以通过 Levenshtein distance（编辑距离）算法来实现，接下来介绍它是如何解决冲突的，假设同时 B 用户将「百度 Web」改成了「百度 FE」，B 所生产的操作步骤将会是如下：

```
retain(3),
delete('Web'),
insert('FE')
```

如果我们先应用 A 的操作，字符串变为「Web 前端」，再应用 B 的操作就会失效，B 的第一个操作是 `retain(3)`，这里不会报错，但在应用第二个操作 `delete('Web')` 时就不对了，因为从第四个字符开始是「 前端」，并没有「Web」，因此我们需要调整 B 的操作来适应新的字符串，比如调成如下：

```
delete('Web'),
insert('FE'),
retain(3)
```

这个调整是 OT 的核心，所以 OT 其实指的是一种思路，而不是具体的算法，这个思路就是首先将编辑转成操作(Operational)，然后多个操作通过转换(Transformation)算法来合并，而具体应该分为哪些操作以及转换规则都是可以自定义的，因此 OT 可以很灵活地支持各种协同编辑应用，比如非文本类的编辑。

对于文本操作的合并也有各种实现，我找到了一个开源库 [changesets](https://github.com/marcelklehr/changesets) ，以下是基于它实现合并的例子：

```javascript
var Changeset = require('changesets').Changeset;

var text = "百度 Web"
  , textA = "Web 前端"
  , textB = "百度 FE";

var csA = Changeset.fromDiff(text, textA);
var csB = Changeset.fromDiff(text, textB);

var csB_new = csB.transformAgainst(csA);

var textA_new = csA.apply(text);
console.log(csB_new.apply(textA_new)); //结果是「 前端FE」
```

发现结果是错的，正确的应该是「FE 前端」，我查看了一下 `csB_new` 的内容，发现它实际上是转换成了如下操作：

```
delete(3),   //注意 changesets 在这里的参数不是字符串而是数字，直接删掉 3 个字符，无论里面的内容是什么
retain(3),
insert('FE')
```

和之前的 Myer's diff 算法相比，虽然不够完美，但至少字符没丢，从我做的几个测试来看 OT 技术的结果都比 Myer's diff 要好，难怪 Google Docs 选择它了。

### 分布式 OT

如果看完上面的文章你觉得实现一个实时协同编辑似乎不难，那你错了，因为我们之前其实都没有考虑分布式的问题，OT 技术在学术界都研究 20 多年了，但也没人能总结出一个最好的方法，前 Google Wave 工程师在 [ShareJS](http://sharejs.org/) 首页上这样写道：

> Unfortunately, implementing OT sucks. There's a million algorithms with different tradeoffs, mostly trapped in academic papers. The algorithms are really hard and time consuming to implement correctly. We need some good libraries, so any project can just plug in OT if they need it.

接下来我们看看 3 个可能出现的问题及解决方法：

**顺序问题**

首先第一个问题是顺序问题，发送端必须保证请求是顺序发送的，不然就会出现如下问题：

![order-problem](/img/realtime-collaboration/order-problem.png)

假设我们发的是两个异步请求，很可能因为网络抽风导致第二个请求先到了，最终结果是服务器最终版本和 `Client A` 所看到的不一致，同样在服务器发往其它客户端的请求时也会出现乱序的问题，导致图中 `Client B` 也有问题。因此我们需要队列来保证顺序，保证在前一个请求结束后再发下一个请求。

**存储的原子操作**

如果有多台服务器，或者有多个线程/进程在同时处理请求时就会遇到冲突，因为读写数据库并不是原子操作，比如下面的例子：

![data-atomic](/img/realtime-collaboration/data-atomic.png)

由于数据读取和更新并不是原子操作，因此就很容易出现冲突，上面的例子中 `Web Server A` 的修改被覆盖了。

这是常见的数据冲突问题，解决办法可以有 3 种：

* 保证操作只在一个线程中执行，比如某个文档的更新只在某个固定的机器，使用 Node 这样的单线程模型提供服务，这样就不会出现并行修改某个文档的情况
* 使用事务(transaction)，如果数据库支持事务，这是最方便的解决方法
* 使用分布式锁，如果数据库不支持事务，就只能用分布式锁了，如 ZooKeeper

从实现角度，第一种和第二种都比较简单，第三种方法有可能导致文档被锁死，假如上锁后由于种种原因没有执行解锁操作，这个文档就会永远被锁住，所以还得加上超时限制等策略。

然而在解决了原子操作后，又将出现一个新的问题，那就是版本管理。

**版本管理**

在前面的例子中，两段新文本都是基于同一个旧版本的，如果旧版本不一样，结果就是错的，具体可以通过下面这张图来解释

![version-problem](/img/realtime-collaboration/version-problem.png)

在这个例子中，Web Server A 接收到操作命令是将「a」文本改成「aa」，Web Server B 接收到操作命令是将「a」文本改成「ab」，这里我们加上了锁机制来避免并行修改数据，Web Server A 得到了锁，然后修改并更新数据，而 Web Server B 需要等待数据解锁，等到解锁后再去获取数据会发现新的数据有变化，从「a」变成了「aa」，如果还按照 `retain(1), insert('b')`，数据将变成「ab」，而不是正确的「aab」，原因就是因为旧版本不一致，需要合并 Web Server A 的操作，变成 `retain(2), insert('b')`。

想要解决这个问题，就必须引入版本，每次修改后都需要存储下新版本，有了版本我们就能使用 diff 功能来计算不同版本的差异，得到其它人修改的内容，然后通过 OT 合并算法合并两个操作，如下所示：

![version-problem](/img/realtime-collaboration/version-solution.png)

可以看到要想支持分布式 OT 还是挺麻烦的，如果需要前后端整套解决方案，可以看看 [ShareJS](http://sharejs.org/) 或 [OpenCoweb Framework](https://github.com/opencoweb/coweb)。

另外之前提到的 Myer's diff 算法也有分布式的解决方案，具体细节可以参考[这篇文档](https://neil.fraser.name/writing/sync/)。

## 初步结论

* 如果你只是一个内部小项目，实时性要求不高，但对准确性要求比较高
    - 推荐用 merge 或 diff3 工具，出现同一行冲突时由用户来解决
* 如果想具备一定的实时性，流量不大，不想实现太复杂，且对少量的冲突可以忍受
    - 推荐用 Myer's diff，后端只开一个 Node 进程
* 如果想具备实时性，且有多台后端服务同时处理
    - 可以用 Operational Transformation 或 Myer's diff，但需要注意分布式带来的问题
* 如果需要很精细的控制，如支持富文本编辑等非单纯文本格式
    - 只能使用 Operational Transformation，但要自己实现操作合并算法，可以参考[这篇文章](http://www.codecommit.com/blog/java/understanding-and-applying-operational-transformation)

## 后续

除了文本合并，真正要做在线编辑还有很多细节处理：

* 支持选区，看到其他人选择的文本段，当然，这也有合并问题
* 指针要更随文本变化移动到正确的位置
* 支持 undo


