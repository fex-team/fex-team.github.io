---
layout: post
title: HHVM 是如何提升 PHP 性能的？
author: nwind
shortname: hvvm-and-php
---

## 背景

HHVM 是 Facebook 开发的高性能 PHP 虚拟机，宣称比官方的快 9 倍，我很好奇，于是抽空简单了解了一下，并整理出这篇文章，希望能回答清楚两方面的问题：

* HHVM 到底靠谱么？是否可以用到产品中？
* 它为什么比官方的 PHP 快很多？到底是如何优化的？

## 你会怎么做？

在讨论 HHVM 实现原理前，我们先设身处地想想：假设你有个 PHP 写的网站遇到了性能问题，经分析后发现很大一部分资源就耗在 PHP 上，这时你会怎么优化 PHP 性能？

比如可以有以下几种方式：

* 方案 1 ，迁移到性能更好的语言上，如 Java 、 C++、 Go 。
* 方案 2 ，通过 RPC 将功能分离出来用其它语言实现，让 PHP 做更少的事情，比如 Twitter 就将大量业务逻辑放到了 Scala 中，前端的 Rails 只负责展现。
* 方案 3 ，写 PHP 扩展，在性能瓶颈地方换 C/C++。
* 方案 4 ，优化 PHP 的性能。

*方案 1*几乎不可行，十年前 Joel 就 [ 拿 Netscape 的例子警告过 ](http://www.joelonsoftware.com/articles/fog0000000069.html) ，你将放弃是多年的经验积累，尤其是像 Facebook 这种业务逻辑复杂的产品， PHP 代码实在太多了，据称有 2 千万行（引用自 [PHP on the Metal with HHVM] ），修改起来的成本恐怕比写个虚拟机还大，而且对于一个上千人的团队，从头开始学习也是不可接受的。

*方案 2*是最保险的方案，可以逐步迁移，事实上 Facebook 也在朝这方面努力了，而且还开发了 Thrift 这样的 RPC 解决方案， Facebook 内部主要使用的另一个语言是 C++，从早期的 Thrift 代码就能看出来，因为其它语言的实现都很简陋，没法在生产环境下使用。

目前在 Facebook 中据称 PHP:C++ 已经从 9:1 [ 增加到 7:3 了 ](http://zh.reddit.com/r/IAmA/comments/1nl9at/i_am_a_member_of_facebooks_hhvm_team_a_c_and_d/ccjlvoq) ，加上有 Andrei Alexandrescu 的存在， C++ 在 Facebook 中越来越流行，但这只能解决部分问题，毕竟 C++ 开发成本比 PHP 高得多，不适合用在经常修改的地方，而且太多 RPC 的调用也会严重影响性能。

*方案 3*看起来美好，实际执行起来却很难，一般来说性能瓶颈并不会很显著，大多是不断累加的结果，加上 PHP 扩展开发成本高，这种方案一般只用在公共且变化不大的基础库上，所以这种方案解决不了多少问题。

可以看到，前面 3 个方案并不能很好地解决问题，所以 Facebook 其实没有选择的余地，只能去考虑 PHP 本身的优化了。

## 更快的 PHP

既然要优化 PHP ，那如何去优化呢？在我看来可以有以下几种方法：

* 方案 1 ， PHP 语言层面的优化。
* 方案 2 ，优化 PHP 的官方实现（也就是 Zend ）。
* 方案 3 ，将 PHP 编译成其它语言的 bytecode （字节码），借助其它语言的虚拟机（如 JVM ）来运行。
* 方案 4 ，将 PHP 转成 C/C++，然后编译成本地代码。
* 方案 5 ，开发更快的 PHP 虚拟机。

PHP 语言层面的优化是最简单可行的， Facebook 当然想到了，而且还开发了 [XHProf](http://pecl.php.net/package/xhprof) 这样的性能分析工具，对于定位性能瓶颈是很有帮助的。

不过 XHProf 还是没能很好解决 Facebook 的问题，所以我们继续看，接下来是方案 2 ，简单来看， Zend 的执行过程可以分为两部分：将 PHP 编译为 opcode 、执行 opcode ，所以优化 Zend 可以从这两方面来考虑。

优化 opcode 是一种常见的做法，可以避免重复解析 PHP ，而且还能做一些静态的编译优化，比如 [Zend Optimizer Plus](https://github.com/zendtech/ZendOptimizerPlus) ，但由于 PHP 语言的动态性，这种优化方法是有局限性的，乐观估计也只能提升 20%的性能。另一种考虑是优化 opcode 架构本身，如基于寄存器的方式，但这种做法修改起来工作量太大，性能提升也不会特别明显（可能 30%？），所以投入产出比不高。

另一个方法是优化 opcode 的执行，首先简单提一下 Zend 是如何执行的， Zend 的 interpreter （也叫解释器）在读到 opcode 后，会根据不同的 opcode 调用不同函数（其实有些是 switch ，不过为了描述方便我简化了），然后在这个函数中执行各种语言相关的操作（感兴趣的话可看看 [ 深入理解 PHP 内核 ](http://www.php-internals.com/book/?p=chapt02/02-03-02-opcode) 这本书），所以 Zend 中并没有什么复杂封装和间接调用，作为一个解释器来说已经做得很好了。

想要提升 Zend 的执行性能，就需要对程序的底层执行有所解，比如函数调用其实是有开销的，所以能通过 [Inline threading](http://dl.acm.org/citation.cfm?id=277743) 来优化掉，它的原理就像 C 语言中的 inline 关键字那样，但它是在运行时将相关的函数展开，然后依次执行（只是打个比方，实际实现不太一样），同时还避免了 CPU 流水线预测失败导致的浪费。

另外还可以像 [JavaScriptCore](http://trac.webkit.org/browser/trunk/Source/JavaScriptCore/llint/LowLevelInterpreter.asm) 和 [LuaJIT](http://repo.or.cz/w/luajit-2.0.git/blob_plain/HEAD:/src/vm_x86.dasc) 那样使用汇编来实现 interpreter ，具体细节建议看看 [Mike 的解释 ](http://www.reddit.com/r/programming/comments/badl2/luajit_2_beta_3_is_out_support_both_x32_x64/c0lrus0)

但这两种做法修改代价太大，甚至比重写一个还难，尤其是要保证向下兼容，后面提到 PHP 的特点时你就知道了。

开发一个高性能的虚拟机不是件简单的事情， JVM 花了 10 多年才达到现在的性能，那是否能直接利用这些高性能的虚拟机来优化 PHP 的性能呢？这就是方案 3 的思路。

其实这种方案早就有人尝试过了，比如 [Quercus](http://quercus.caucho.com/) 和 IBM 的 P8 ， Quercus 几乎没见有人使用，而 P8 [ 也已经死掉了 ](https://www.ibm.com/developerworks/community/forums/html/topic?id=77777777-0000-0000-0000-000014910522&ps=25) 。 Facebook 也曾经调研过这种方式，甚至还出现过不靠谱的 [ 传闻 ](http://nerds-central.blogspot.ie/2012/08/facebook-moving-to-jvm.html) ，但其实 Facebook 在 2011 年就放弃了。

因为方案 3 看起来美好，但实际效果却不理想，按照很多大牛的说法（比如 [Mike](http://lambda-the-ultimate.org/node/3851#comment-57805) ）， VM 总是为某个语言优化的，其它语言在上面实现会遇到很多瓶颈，比如动态的方法调用，关于这点在 [Dart 的文档中有过介绍 ](https://www.dartlang.org/articles/why-not-bytecode/) ，而且据说 Quercus 的性能与 Zend+APC 比差不了太多（ [ 来自 The HipHop Compiler for PHP] ），所以没太大意义。

不过 OpenJDK 这几年也在努力，最近的 [Grall](http://openjdk.java.net/projects/graal/) 项目看起来还不错，也有语言在上面取得了 [ 显著的效果 ](http://mail.openjdk.java.net/pipermail/graal-dev/2013-December/001250.html) ，但我还没空研究 Grall ，所以这里无法判断。

接下来是方案 4 ，它正是 HPHPc （ HHVM 的前身）的做法，原理是将 PHP 代码转成 C++，然后编译为本地文件，可以认为是一种 AOT （ ahead of time ）的方式，关于其中代码转换的技术细节可以参考 [The HipHop Compiler for PHP](http://dl.acm.org/citation.cfm?id=2384658) 这篇论文，以下是该论文中的一个截图，可以通过它来大概了解：

<div class="post-img"><img src="/img/articles/hiphop-vm.png" style="max-width:840px;" /></div>

这种做法的最大优点是实现简单（相对于一个 VM 来说），而且能做很多编译优化（因为是离线的，慢点也没事），比如上面的例子就将` - 1`优化掉了，但它很难支持 PHP 中的很多动态的方法，如 `eval()`、`create_function()`，因为这就得再内嵌一个 interpreter ，成本不小，所以 HPHPc 干脆就直接不支持这些语法。

除了 HPHPc ，还有两个类似的项目，一个是 [Roadsend](http://www.roadsend.com/) ，另一个是 [phc](http://phpcompiler.org/) ， phc 的做法是将 PHP 转成了 C 再编译，以下是它将 `file_get_contents($f)` 转成 C 代码的例子：

``` c
static php_fcall_info fgc_info;
php_fcall_info_init ("file_get_contents", &fgc_info);
php_hash_find (LOCAL_ST, "f", 5863275, &fgc_info.params);
php_call_function (&fgc_info);
```

话说 [phc 作者曾经在博客上哭诉 ](http://blog.paulbiggar.com/archive/a-rant-about-php-compilers-in-general-and-hiphop-in-particular/#bottom) ，说他两年前就去 Facebook 演示过 phc 了，还和那里的工程师交流过，结果人家一发布就火了，而自己忙活了 4 年却默默无闻，现在前途渺茫。。。

Roadsend 也已经不维护了，对于 PHP 这样的动态语言来说，这种做法有很多的局限性，由于无法动态 include ， Facebook 将所有文件都编译到了一起，上线时的文件部署居然达到了 1G ，越来越不可接受了。

另外有还有一个叫 [PHP QB](https://github.com/chung-leong/qb) 的项目，由于时间关系我没有看，感觉可能是类似的东东。

所以就只剩下一条路了，那就是写一个更快的 PHP 虚拟机，将一条黑路走到底，或许你和我一样，一开始听到 Facebook 要做一个虚拟机是觉得太离谱，但如果仔细分析就会发现其实也只有这样了。

## 更快的虚拟机

HHVM 为什么更快？在各种新闻报道中都提到了 JIT 这个关键技术，但其实远没有那么简单， JIT 不是什么神奇的魔法棒，用它轻轻一挥就能提升性能，而且 JIT 这个操作本身也是会耗时的，对于简单的程序没准还比 interpreter 慢，最极端的例子是 [LuaJIT 2](http://lua-users.org/lists/lua-l/2010-03/msg00305.html) 的 Interpreter 就稍微比 V8 的 JIT 快，所以并不存在绝对的事情，更多还是在细节问题的处理上， HHVM 的发展历史就是不断优化的历史，你可以从下图看到它是如何一点点超过 HPHPc 的：

<div class="post-img"><img src="/img/articles/hhvm-vs-hhpc.jpg" style="max-width:840px;" /></div>

值得一提的是在 Android 4.4 中新的虚拟机 ART 就采用的是 AOT 方案（还记得么？前面提到的 HPHPc 就是这种），结果比之前使用 JIT 的 Dalvik 快了一倍，所以说 JIT 也不一定比 AOT 快。

因此这个项目是有很大风险的，如果没有强大的内心和毅力，极有可能半途而废， [Google 就曾经想用 JIT 提升 Python 的性能 ](https://code.google.com/p/unladen-swallow/) ，但 [ 最终失败了 ](http://qinsb.blogspot.jp/2011/03/unladen-swallow-retrospective.html) ，对于 Google 来说用到 Python 的地方其实并没什么性能问题（好吧，以前 Google 是用 Python 写过 crawl [ 参考 In The Plex] ，但那都是 1996 年的事情了）。

比起 Google ， Facebook 显然有更大的动力和决心， PHP 是 Facebook 最重要的语言，我们来看看 Facebook 都投入了哪些大牛到这个项目中（不全）： 

* Andrei Alexandrescu ，『 Modern C++ Design 』和『 C++ Coding Standards 』的作者， C++ 领域无可争议的大神
* Keith Adams ，负责过 VMware 核心架构，当年 VMware 就派他一人去和 Intel 进行技术合作，足以证明在 [VMM](http://en.wikipedia.org/wiki/Virtual_Machine_Manager) 领域他有多了解了
* Drew Paroski ，在微软参与过 .NET 虚拟机开发，改进了其中的 JIT
* Jason Evans ，开发了 jemalloc ，减少了 Firefox 一半的内存消耗
* Sara Golemon ，『 Extending and Embedding PHP 』的作者， PHP 内核专家，这本书估计所有 PHP 高手都看过吧，或许你不知道其实她是女的

虽然没有像 Lars Bak 、 Mike Pall 这样在虚拟机领域的顶级专家，但如果这些大牛能齐心协力，写个虚拟机还是问题不大的，那么他们将面临什么样的挑战呢？接下来我们一一讨论。

### 规范是什么？

自己写 PHP 虚拟机要面临的第一个问题就是 PHP 没有语言规范，很多版本间的语法还会不兼容（甚至是小版本号，比如 5.2.1 和 5.2.3 ）， PHP 语言规范究竟如何定义呢？来看一篇来自 [IEEE](http://grouper.ieee.org/groups/plv/DocLog/000-099/060-thru-079/22-OWGV-N-0060/n0060.pdf) 的说法：

> The PHP group claim that they have the ﬁ nal say in the speci ﬁ cation of (the language) PHP. This groups speci ﬁ cation is an implementation, and there is no prose speci ﬁ cation or agreed validation suite.

所以唯一的途径就是老老实实去看 Zend 的实现，好在 HPHPc 中已经痛苦过一次了，所以 HHVM 能直接利用现成，因此这个问题并不算太大。

### 语言还是扩展？

实现 PHP 语言不仅仅只是实现一个虚拟机那么简单， PHP 语言本身还包括了各种扩展，这些扩展和语言是一体的， Zend 不辞辛劳地实现了各种你可能会用到的功能。如果分析过 PHP 的代码，就会发现它的 C 代码除去空行注释后居然还有 80+万行，而你猜其中 Zend 引擎部分有多少？只有不到 10 万行。

对于开发者来说这不是什么坏事，但对于引擎实现者来说就很悲剧了，我们可以拿 Java 来进行对比，写个 Java 的虚拟机只需实现字节码解释及一些基础的 JNI 调用， Java 绝大部分内置库都是用 Java 实现的，所以如果不考虑性能优化，单从工作量看，实现 PHP 虚拟机比 JVM 要难得多，比如就有人用 8 千行的 TypeScript 实现了一个 [JVM Doppio](https://github.com/int3/doppio) 。

而对于这个问题， HHVM 的解决办法很简单，那就是只实现 Facebook 中用到的，而且同样可以先用 HPHPc 中之前写过的，所以问题也不大。

### 实现 Interpreter

接下来是 Interpreter 的实现，在解析完 PHP 后会生成 HHVM 自己设计的一种 Bytecode ，存储在 `~/.hhvm.hhbc`（ SQLite 文件） 中以便重用，在执行 Bytecode 时和 Zend 类似，也是将不同的字节码放到不同的函数中去实现（这种方式在虚拟机中有个专门的称呼： [Subroutine threading](http://en.wikipedia.org/wiki/Threaded_code#Subroutine_threading) ）

Interpreter 的主体实现在 [bytecode.cpp](https://github.com/facebook/hhvm/blob/master/hphp/runtime/vm/bytecode.cpp) 中，比如 `VMExecutionContext::iopAdd` 这样的方法，最终执行会根据不同类型来区分，比如 add 操作的实现是在 [tv-arith.cpp](https://github.com/facebook/hhvm/blob/master/hphp/runtime/base/tv-arith.cpp) 中，下面摘抄其中的一小段

{% highlight c++ %}
if (c2.m_type == KindOfInt64)  return o(c1.m_data.num, c2.m_data.num);
if (c2.m_type == KindOfDouble) return o(c1.m_data.num, c2.m_data.dbl);
{% endhighlight %}

正是因为有了 Interpreter ， HHVM 在对于 PHP 语法的支持上比 HPHPc 有明显改进，理论上做到完全兼容官方 PHP ，但仅这么做在性能并不会比 Zend 好多少，由于无法确定变量类型，所以需要加上类似上面的条件判断语句，但这样的代码不利于现代 CPU 的执行优化，另一个问题是数据都是 boxed 的，每次读取都需要通过类似 `m_data.num` 和 `m_data.dbl` 的方法来间接获取。

对于这样的问题，就得靠 JIT 来优化了。

### 实现 JIT 及优化

首先值得一提的是 PHP 的 JIT 之前并非没人尝试过：

* 2008 年就有人 [ 用 LLVM 实验过 ](http://llvm.org/devmtg/2008-08/Lopes_PHP-JIT-InTwoDays.pdf) ，结果还比原来慢了 21 倍。。。
* 2010 年 IBM 日本研究院基于他们的 JVM 虚拟机代码开发了 P9 ，性能是官方 PHP 的 2.5 到 9.5 倍，可以看他们的论文 [Evaluation of a just-in-time compiler retrofitted for PHP](http://dl.acm.org/citation.cfm?id=1736015) 。
* 2011 年 Andrei Homescu 基于 RPython 开发过，还写了篇论文 [HappyJIT: a tracing JIT compiler for PHP](http://www.ics.uci.edu/~ahomescu/happyjit_paper.pdf) ，但测试结果有好有坏，并不理想。

那么究竟什么是 JIT ？如何实现一个 JIT ？

在动态语言中基本上都会有个 eval 方法，可以传给它一段字符串来执行， JIT 做的就是类似的事情，只不过它要拼接不是字符串，而是不同平台下的机器码，然后进行执行，但如何用 C 来实现呢？可以参考 Eli 写的 [ 这个入门例子 ](http://eli.thegreenplace.net/2013/11/05/how-to-jit-an-introduction/) ，以下是文中的一段代码：

``` c++
unsigned char code[] = {
  0x48, 0x89, 0xf8,                   // mov %rdi, %rax
  0x48, 0x83, 0xc0, 0x04,             // add $4, %rax
  0xc3                                // ret
};
memcpy(m, code, sizeof(code));
```

然而手工编写机器码很容易出错，所以最好的有一个辅助的库，比如的 Mozilla 的 [Nanojit](https://developer.mozilla.org/en-US/docs/Nanojit) 以及 LuaJIT 的 [DynASM](http://luajit.org/dynasm.html) ，但 HHVM 并没有使用这些，而是自己实现了一个只支持 x64 的（另外还在尝试用 [VIXL](https://github.com/armvixl/vixl) 来生成 ARM 64 位的），通过 mprotect 的方式来让代码可执行。

但为什么 JIT 代码会更快？你可以想想其实用 C++ 编写的代码最终编译出来也是机器码，如果只是将同样的代码手动转成了机器码，那和 GCC 生成出来的有什么区别呢？虽然前面我们提到了一些针对 CPU 实现原理来优化的技巧，但在 JIT 中更重要的优化是根据类型来生成特定的指令，从而大幅减少指令数和条件判断，下面这张来自 [TraceMonkey](https://hacks.mozilla.org/2009/07/tracemonkey-overview/) 的图对此进行了很直观的对比，后面我们将看到 HHVM 中的具体例子：

<div class="post-img"><img src="/img/articles/tracemonkey.png" style="max-width:840px;" /></div>

HHVM 首先通过 interpeter 来执行，那它会在时候使用 JIT 呢？常见的 JIT 触发条件有 2 种：

* trace ：记录循环执行次数，如果超过一定数量就对这段代码进行 JIT
* method ：记录函数执行次数，如果超过一定数量就对整个函数进行 JIT ，甚至直接 inline

关于这两种方法哪种更好在 Lambada 上 [ 有个帖子 ](http://lambda-the-ultimate.org/node/3851) 引来了各路大神的讨论，尤其是 Mike Pall （ LuaJIT 作者） 、 Andreas Gal （ Mozilla VP ） 和 Brendan Eich （ Mozilla CTO ）都发表了很多自己的观点，推荐大家围观，我这里就不献丑了。

它们之间的区别不仅仅是编译范围，还有很多细节问题，比如对局部变量的处理，在这里就不展开了

但 HHVM 并没有采用这两种方式，而是自创了一个叫 [tracelet](https://news.ycombinator.com/item?id=4856099) 的做法，它是根据类型来划分的，看下面这张图

<div class="post-img"><img src="/img/articles/tracelet.png" style="max-width:840px;" /></div>

可以看到它将一个函数划分为了 3 部分，上面 2 部分是用于处理 `$k` 为整数或字符串两种不同情况的，下面的部分是返回值，所以看起来它主要是根据类型的变化情况来划分 JIT 区域的，具体是如何分析和拆解 Tracelet 的细节可以查看 [Translator.cpp](https://github.com/facebook/hhvm/blob/master/hphp/runtime/vm/jit/translator.cpp) 中的 `Translator::analyze` 方法，我还没空看，这里就不讨论了。

当然，要实现高性能的 JIT 还需进行各种尝试和优化，比如最初 HHVM 新增的 tracelet 会放到前面，也就是将上图的 A 和 C 调换位置，后来尝试了一下放到后面，结果性能提示了 14%，因为测试发现这样更容易提前命中响应的类型

JIT 的执行过程是首先将 HHBC 转成 SSA (hhbc-translator.cpp) ，然后对 SSA 上做优化（比如 Copy propagation ），再生成本地机器码，比如在 X64 下是由 [translator-x64.cpp](https://github.com/facebook/hhvm/blob/master/hphp/runtime/vm/jit/translator-x64.cpp) 实现的。

我们用一个简单的例子来看看 HHVM 最终生成的机器码是怎样的，比如下面这个 PHP 函数：

``` php
<?php
function a($b){
  echo $b + 2;
}
```

编译后是这个样子：

``` nasm
mov rcx,0x7200000
mov rdi,rbp
mov rsi,rbx
mov rdx,0x20
call 0x2651dfb <HPHP::Transl::traceCallback(HPHP::ActRec*, HPHP::TypedValue*, long, void*)>
cmp BYTE PTR [rbp-0x8],0xa
jne 0xae00306
; 前面是检查参数是否有效

mov rcx,QWORD PTR [rbp-0x10]           ; 这里将 %rcx 被赋值为 1 了
mov edi,0x2                            ; 将 %edi （也就是 %rdi 的低 32 位）赋值为 2
add rdi,rcx                            ; 加上 %rcx
call 0x2131f1b <HPHP::print_int(long)> ; 调用 print_int 函数，这时第一个参数 %rdi 的值已经是 3 了

; 后面暂不讨论
mov BYTE PTR [rbp+0x28],0x8
lea rbx,[rbp+0x20]
test BYTE PTR [r12],0xff
jne 0xae0032a
push QWORD PTR [rbp+0x8]
mov rbp,QWORD PTR [rbp+0x0]
mov rdi,rbp
mov rsi,rbx
mov rdx,QWORD PTR [rsp]
call 0x236b70e <HPHP::JIT::traceRet(HPHP::ActRec*, HPHP::TypedValue*, void*)>
ret 
```

而 HPHP::print_int 函数的实现是这样的：

``` c++
void print_int(int64_t i) {
  char buf[256];
  snprintf(buf, 256, "%" PRId64, i);
  echo(buf);
  TRACE(1, "t-x64 output(int): %" PRId64 "\n", i);
}
```

可以看到 HHVM 编译出来的代码直接使用了 `int64_t`，避免了 interpreter 中需要判断参数和间接取数据的问题，从而明显提升了性能，最终甚至做到了和 C 编译出来的代码区别不大。

需要注意： HHVM 在 server mode 下，只有超过 12 个请求就才会触发 JIT ，启动过 HHVM 时可以通过加上如下参数来让它首次请求就使用 JIT ：

    -v Eval.JitWarmupRequests=0

所以在测试性能时需要注意，运行一两次就拿来对比是看不出效果的。

### 类型推导很麻烦，还是逼迫程序员写清楚吧

JIT 的关键是猜测类型，因此某个变量的类型要是老变就很难优化，于是 HHVM 的工程师开始考虑在 PHP 语法上做手脚，加上类型的支持，推出了一个新语言 - Hack （吐槽一下这名字真不利于 SEO ），它的样子如下：

``` php
<?hh
class Point2 {
  public float $x, $y;
  function __construct(float $x, float $y) {
    $this->x = $x;
    $this->y = $y;
  }
}
//来自： https://raw.github.com/strangeloop/StrangeLoop2013/master/slides/sessions/Adams-TakingPHPSeriously.pdf
```

注意到 `float` 关键字了么？有了静态类型可以让 HHVM 更好地优化性能，但这也意味着和 PHP 语法不兼容，只能使用 HHVM 。

其实我个人认为这样做最大的优点是让代码更加易懂，减少无意的犯错，就像 Dart 中的可选类型也是这个初衷，同时还方便了 IDE 识别，据说 Facebook 还在开发一个 [ 基于 Web 的 IDE](https://twitter.com/jpetazzo/status/308294205598474240) ，能协同编辑代码，可以期待一下。

## 你会使用 HHVM 么？

总的来说，比起之前的 HPHPc ，我认为 HHVM 是值得一试的，它是真正的虚拟机，能够更好地支持各种 PHP 的语法，所以改动成本不会更高，而且因为能无缝切换到官方 PHP 版本，所以可以同时启动 FPM 来随时待命， HHVM 还有 [FastCGI](https://github.com/facebook/hhvm/wiki/FastCGI) 接口方便调用，只要做好应急备案，风险是可控的，从长远来看是很有希望的。

性能究竟能提升多少我无法确定，需要拿自己的业务代码来进行真实测试，这样才能真正清楚 HHVM 能带来多少收益，尤其是对整体性能提升到底有多少，只有拿到这个数据才能做决策。

最后整理一下可能会遇到的问题，有计划使用的可以参考：

* 扩展问题：如果用到了 PHP 扩展，肯定是要重写的，不过 HHVM 扩展写起来比 Zend 要简单的多，具体细节可以看 [wiki 上的例子 ](https://github.com/facebook/hhvm/wiki/Extension-API) 。
* HHVM Server 的稳定性问题：这种多线程的架构运行一段时间可能会出现内存泄露问题，或者某个没写好的 PHP 直接导致整个进程挂掉，所以需要注意这方面的测试和容灾措施。
* 问题修复困难： HHVM 在出现问题时将比 Zend 难修复，尤其是 JIT 的代码，只能期望它比较稳定了。

P.S. 其实我只了解基本的虚拟机知识，也没写过几行 PHP 代码，很多东西都是写这篇文章时临时去找资料的，由于时间仓促水平有限，必然会有不正确的地方，欢迎大家评论赐教 :)

2014 年 1 月补充：目前 HHVM 在鄙厂的推广势头很不错，推荐大家在 2014 年尝试一下，尤其是现在兼容性测试已经达到 98.58%了，修改成本进一步减小。

<!--
http://lambda-the-ultimate.org/node/3851#comment-57760

LuaJIT also does: constant folding, constant propagation, copy propagation, algebraic simplifications, reassociation, common-subexpression elimination, alias analysis, load-forwarding, store-forwarding, dead-store elimination, store sinking, scalar replacement of aggregates, scalar-evolution analysis, narrowing, specialization, loop inversion, dead-code elimination, reverse-linear-scan register allocation with a blended cost-model, register hinting, register renaming, memory operand fusion.
-->

## 引用

* [Andrei Alexandrescu on AMA](http://zh.reddit.com/r/IAmA/comments/1nl9at/i_am_a_member_of_facebooks_hhvm_team_a_c_and_d/?limit=500)
* [Keith Adams 在 HN 上的蛛丝马迹 ](https://news.ycombinator.com/threads?id=kmavm)
* [How Three Guys Rebuilt the Foundation of Facebook](http://www.wired.com/wiredenterprise/2013/06/facebook-hhvm-saga/all/)
* [PHP on the Metal with HHVM](http://www.infoq.com/presentations/PHP-HHVM-Facebook)
* [Making HPHPi Faster](https://www.facebook.com/note.php?note_id=10150336948348920)
* [HHVM Optimization Tips](http://www.hhvm.com/blog/713/hhvm-optimization-tips)
* [The HipHop Virtual Machine (hhvm) PHP Execution at the Speed of JIT](http://www.oscon.com/oscon2012/public/schedule/detail/25828)
* [Julien Verlaguet, Facebook: Analyzing PHP statically](http://cufp.org/conference/sessions/2013/julien-verlaguet-facebook-analyzing-php-statically)
* [Speeding up PHP-based development with HHVM](https://www.facebook.com/notes/facebook-engineering/speeding-up-php-based-development-with-hiphop-vm/10151170460698920)
* [Adding an opcode to HHBC](http://www.hhvm.com/blog/311/adding-an-opcode-to-hhbc)