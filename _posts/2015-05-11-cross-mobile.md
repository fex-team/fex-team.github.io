---
layout: post
title: 聊聊移动端跨平台开发的各种技术
author: nwind
---

## 介绍

最近出现的 React Native 再次让跨平台移动端开发这个话题火起来了，曾经大家以为在手机上可以像桌面那样通过 Web 技术来实现跨平台开发，却大多因为性能或功能问题而放弃，不得不针对不同平台开发多个版本。

但这并没有阻止人们对跨平台开发技术的探索，毕竟谁不想降低开发成本，一次编写就处处运行呢？除了 React Native，这几年还出现过许多其它解决方案，本文我将会对这些方案进行技术分析，供感兴趣的读者参考。

为了方便讨论，我将它们分为了以下 4 大流派：

* Web 流：也被称为 Hybrid 技术，它基于 Web 相关技术来实现界面及功能
* 代码转换流：将某个语言转成 Objective-C、Java 或 C#，然后使用不同平台下的官方工具来开发
* 编译流：将某个语言编译为二进制文件，生成动态库或打包成 apk/ipa/xap 文件
* 虚拟机流：通过将某个语言的虚拟机移植到不同平台上来运行

## Web 流

Web 流是大家都比较了解的了，比如著名的 [PhoneGap/Cordova](http://phonegap.com/)，它将原生的接口封装后暴露给 JavaScript，可以运行在系统自带的 WebView 中，也可以自己内嵌一个 [Chrome 内核](https://crosswalk-project.org) 。

作为这几年争论的热点，网上已经有很多关于它的讨论了，这里我重点聊聊大家最关心的性能问题。

Web 流最常被吐槽的就是性能慢（这里指内嵌 HTML 的性能，不考虑网络加载时间），可为什么慢呢？常见的看法是认为「DOM 很慢」，然而从浏览器实现角度来看，其实 DOM 就是将对文档操作的 API 暴露给了 JavaScript，而 JavaScript 的调用这些 API 后就进入内部的 C++ 实现了，这中间并没有多少性能消耗，所以从理论上来说浏览器的 DOM 肯定比 Android 的「DOM」快，因为 Android 的展现架构大部分功能是用 Java 写的，在实现相同功能的前提下，C++ 不大可能比 Java 慢（某些情况下 JIT 编译优化确实有可能做得更好，但那只是少数情况）。

所以从字面意思上看「DOM 很慢」的说法是错误的，这个看法之所以很普遍，可能是因为大部分人对浏览器实现不了解，只知道浏览器有 DOM，所以不管什么问题都只能抱怨它了。

那么问题在哪呢？在我看来有三方面的问题：

* 早期浏览器实现比较差，没有进行优化
* CSS 过于复杂，计算起来更耗时
* DOM 提供的接口太有限，使得难以进行优化

第一个问题是最关键也是最难解决的，现在说到 Web 性能差主要说的是 Android 下比较差，在 iOS 下已经很流畅了，在 Android 4 之前的 WebView 甚至都没有实现 GPU 加速，每次重绘整个页面，有动画的时候不卡才怪。

浏览器实现的优化可以等 Android 4.4 慢慢普及起来，因为 4.4 以后就使用 Chrome 来渲染了。

而对于最新的浏览器来说，渲染慢的原因就主要是第二个问题：CSS 过于复杂，因为从实现原理上看 Chrome 和 Android View 并没有本质上的差别，但 CSS 太灵活功能太多了，所以计算成本很高，自然就更慢了。

那是不是可以通过简化 CSS 来解决？实际上还真有人这么尝试了，比如 [Famo.us](http://famo.us/)，它最大的特色就是不让你写 CSS，只能使用固定的几种布局方法，完全靠 JavaScript 来写界面，所以它能有效避免写出低效的 CSS，从而提升性能。

而对于复杂的界面及手机下常见的超长的 ListView 来说，第三个问题会更突出，因为 DOM 是一个很上层的 API，使得 JavaScript 无法做到像 Native 那样细粒度的控制内存及线程，所以难以进行优化，则在硬件较差的机器上会比较明显。对于这个问题，我们一年前曾经尝试过[嵌入原生组件](http://fex.baidu.com/blog/2014/05/light-component/)的方式来解决，不过这个方案需要依赖应用端的支持，或许以后浏览器会自带几个优化后的 Web Components 组件，使用这些组件就能很好解决性能问题。

现阶段这三个问题都不好解决，所以有人想干脆不用 HTML/CSS，自己来画界面，比如 [React canvas](https://github.com/Flipboard/react-canvas) 直接画在 Canvas 上，但在我看来这只是现阶段解决部分问题的方法，在后面的章节我会详细介绍自己画 UI 的各种问题，这里说个历史吧，6 年前浏览器还比较慢的时候，[Bespin](http://www.wikiwand.com/en/Mozilla_Skywriter) 就这么干过，后来这个项目被使用 DOM 的 ACE 取代了，目前包括 TextMirror 和 Atom 在内的主流编辑器都是直接使用 DOM，甚至 W3C 有人专门写了篇文章[吐槽用 Canvas 做编辑器的种种缺点](http://www.w3.org/wiki/No_edit_change_proposal_for_canvas_text_editing)，所以使用 Canvas 要谨慎。

另外除了 Canvas，还有人以为 WebGL 快，就尝试绘制到 WebGL 上，比如 [HTML-GL](https://github.com/PixelsCommander/HTML-GL)，但它目前的实现太偷懒了，简单来说就是先用 [html2canvas](http://html2canvas.hertzen.com/) 将 DOM 节点渲染成图片，然后将这个图片作为贴图放在 WebGL 中，这等于将浏览器中用 C++ 写的东东在 JavaScript 里实现了一遍，渲染速度肯定反而更慢，但倒是能用 GLSL 做特效来忽悠人。

> 硬件加速不等同于「快」，如果你以为硬件加速一定比软件快，那你该抽空学学计算机体系结构了

其实除了性能问题，我认为在 Web 流更严重的问题是功能缺失，比如 iOS 8 就新增 4000+ API，而 Web 标准需要漫长的编写和评审过程，根本赶不上，即便是 Cordova 这样自己封装也忙不过来，所以为了更好地使用系统新功能，写 Native 代码是必须的。

## 代码转换流

前面提到写 Native 代码是必须的，但不同平台下的官方语言不一样，这会导致同样的逻辑要写两次以上，于是就有人想到了通过代码转换的方式来减少工作量，比如将 Java 转成 Objective-C。

这种方式虽然听起来不是很靠谱，但它却是成本和风险都最小的，因为代码转换后就可以用官方提供的各种工具了，和普通开发区别不大，因此不用担心遇到各种诡异的问题，不过需要注意生成的代码是否可读，不可读的方案就别考虑了。

接下来看看目前存在的几种代码转换方式。

### 将 Java 转成 Objective-C

[j2objc](http://j2objc.org/) 能将 Java 代码转成 Objective-C，据说 Google 内部就是使用它来降低跨平台开发成本的，比如 Google Inbox 项目就号称通过它[共用了 70% 的代码](http://arstechnica.com/information-technology/2014/11/how-google-inbox-shares-70-of-its-code-across-android-ios-and-the-web/)，效果很显著。

可能有人会觉得奇怪，为何 Google 要专门开发一个帮助大家写 Objective-C 的工具？还有媒体说 Google 做了件好事，其实吧，我觉得 Google 这算盘打得不错，因为基本上重要的应用都会同时开发 Android 和 iOS 版本，有了这个工具就意味着，你可以先开发 Android 版本，然后再开发 iOS 版本。。。

既然都有成功案例了，这个方案确实值得尝试，而且关键是会 Java 的人多啊，可以通过它来快速移植代码到 Objective-C 中。

### 将 Objective-C 转成 Java

除了有 Java 转成 Objective-C，还有 Objective-C 转成 Java 的方案，那就是 [MyAppConverter](https://www.myappconverter.com/)，比起前面的 j2objc，这个工具更有野心，它还打算将 UI 部分也包含进来，从它[已转换的列表](https://www.myappconverter.com/coverage)中可以看到还有 UIKit、CoreGraphics 等组件，使得有些应用可以不改代码就能转成功，不过这点我并不看好，对于大部分应用来说并不现实。

由于目前是收费项目，我没有尝试过，对技术细节也不了解，所以这里不做评价。

### 将 Java 转成 C&#35;

Mono 提供了一个将 Java 代码转成 C# 的工具 [Sharpen](https://github.com/mono/sharpen)，不过似乎用的人不多，Star 才 118，所以看起来不靠谱。

还有 [JUniversal](http://juniversal.org/) 这个工具可以将 Java 转成 C#，但目前它并没有发布公开版本，所以具体情况还待了解，它的一个特色是自带了简单的跨平台库，里面包括文件处理、JSON、HTTP、OAuth 组件，可以基于它来开发可复用的业务逻辑。

比起转成 Objective-C 和 Java 的工具，转成 C# 的这两个工具看起来都非常不成熟，估计是用 Windows Phone 的人少。

### 将 Haxe 转成其它语言

说到源码转换就不得不提 Haxe 这个奇特的语言，它没有自己的虚拟机或可执行文件编译器，所以只能通过转成其它语言来运行，目前支持转成 Neko（字节码）、Javascript、Actionscript 3、PHP、C++、Java、C# 和 Python，尽管有人实现了[转成 Swift](https://github.com/ralcr/swift-target) 的支持，但还是非官方的，所以要想支持 iOS 开发目前只能通过 Adobe AIR 来运行。

在游戏开发方面做得不错，有个跨平台的游戏引擎 [OpenFL](http://www.openfl.org/) 的，最终可以使用 HTML5 Canvas、OpenGL 或 Flash 来进行绘制，OpenFL 的开发体验做得相当不错，同一行代码不需要修改就能编译出不同平台下的可执行文件，因为是通过转成 C++ 方式进行编译的，所以在性能和反编译方面都有优势，可惜目前似乎并不够稳定，不然可以成为 Cocos2d-x 的有利竞品。

在 OpenFL 基础上还有个跨平台的 UI 组件 [HaxeUI](http://haxeui.org/)，但界面风格我觉得特别丑，也就只能在游戏中用了。

所以目前来看 Haxe 做跨平台游戏开发或许可行，但 APP 开发就别指望了，而基于它来共用代码实在就更不靠谱了，因为熟悉它的开发者极少，反而增加成本。

### XMLVM

除了前面提到的源码到源码的转换，还有 [XMLVM](http://xmlvm.org/overview/) 这种与众不同的方式，它首先将字节码转成一种基于 XML 的中间格式，然后再通过 XSL 来生成不同语言，目前支持生成 C、Objective-C、JavaScript、C#、Python 和 Java。

虽然基于一个中间字节码可以方便支持多语言，然而它也导致生成代码不可读，因为很多语言中的语法糖会在字节码中被抹掉，这是不可逆的，以下是一个简单示例生成的 Objective-C 代码，看起来就像汇编：

```
XMLVM_ENTER_METHOD("org.xmlvm.tutorial.ios.helloworld.portrait.HelloWorld", "didFinishLaunchingWithOptions", "?")
XMLVMElem _r0;
XMLVMElem _r1;
XMLVMElem _r2;
XMLVMElem _r3;
XMLVMElem _r4;
XMLVMElem _r5;
XMLVMElem _r6;
XMLVMElem _r7;
_r5.o = me;
_r6.o = n1;
_r7.o = n2;
_r4.i = 0;
_r0.o = org_xmlvm_iphone_UIScreen_mainScreen__();
XMLVM_CHECK_NPE(0)
_r0.o = org_xmlvm_iphone_UIScreen_getApplicationFrame__(_r0.o);
_r1.o = __NEW_org_xmlvm_iphone_UIWindow();
XMLVM_CHECK_NPE(1)
...
```

在我看来这个方案相当不靠谱，万一生成的代码有问题基本没法修改，也没法调试代码，所以不推荐。

### 小结

虽然代码转换这种方式风险小，但我觉得对于很多小 APP 来说共享不了多少代码，因为这类应用大多数围绕 UI 来开发的，大部分代码都和 UI 耦合，所以公共部分不多。

在目前的所有具体方案中，只有 j2objc 可以尝试，其它都不成熟。

## 编译流

编译流比前面的代码转换更进一步，它直接将某个语言编译为普通平台下的二进制文件，这种做法有明显的优缺点：

* 优点
     - 可以重用一些实现很复杂的代码，比如之前用 C++ 实现的游戏引擎，重写一遍成本太高
     - 编译后的代码反编译困难
     - 或许性能会好些（具体要看实现）
* 缺点
     - 如果这个工具本身有 Bug 或性能问题，定位和修改成本会很高
     - 编译后体积不小，尤其是如果要支持 ARMv8 和 x86 的话

接下来我们通过区分不同语言来介绍这个流派下的各种方案。

### C++ 类

C++ 是最常见的选择，因为目前 Android、iOS 和 Windows Phone 都提供了 C++ 开发的支持，它通常有三种做法：

* 只用 C++ 实现非界面部分，这是官方比较推崇的方案，目前有很多应用是这么做的，比如 [Mailbox](http://channel9.msdn.com/Events/CPP/C-PP-Con-2014/Practical-Cross-Platform-Mobile-CPP-Development-at-Dropbox) 和 [Microsoft Office](http://channel9.msdn.com/Events/CPP/C-PP-Con-2014/024-Microsoft-w-C-to-Deliver-Office-Across-Different-Platforms-Part-I)。
* 使用 2D 图形库来自己绘制界面，这种做法在桌面比较常见，因为很多界面都有个性化需求，但在移动端用得还不多。
* 使用 OpenGL 来绘制界面，常见于游戏中。

使用 C++ 实现非界面部分比较常见，所以这里就不重复介绍了，除了能提升性能和共用代码，还有人使用这种方式来隐藏一些关键代码（比如密钥），如果你不知道如何构建这样的跨平台项目，可以参考 Dropbox 开源的 [libmx3](https://github.com/libmx3/mx3) 项目，它还内嵌了 json 和 sqlite 库，并通过调用系统库来实现对简单 HTTP、EventLoop 及创建线程的支持。

而如果要用 C++ 实现界面部分，在 iOS 和 Windows Phone 下可以分别使用 C++ 的超集 Objective-C++ 和 [C++/CX](https://msdn.microsoft.com/en-us/library/windows/apps/hh699871.aspx)，所以还比较容易，但在 Android 下问题就比较麻烦了，主要原因是 Android 的界面绝大部分是 Java 实现的，所以用 C++ 开发界面最大的挑战是如何支持 Android，这有两种做法：通过 JNI 调用系统提供的 Java 方法或者自己画 UI。

第一种做法虽然可行，但代码太冗余了比如一个简单的函数调用需要写那么多代码：

```C++
JNIEnv* env;
jclass testClass = (*env)->FindClass(env, "com/your/package/name/Test"); // get Class
jmethodID constructor = (*env)->GetMethodID(env, cls, "<init>", "()V");
jobject testObject = (*env)->NewObject(env, testClass, constructor);
methodID callFromCpp = (*env)->GetMethodID(env, testClass, "callFromCpp", "()V"); //get methodid
(*env)->CallVoidMethod(env, testObject, callFromCpp);
```

那自己画 UI 是否会更方便点？比如 [JUCE](http://www.juce.com/) 和 [QT](https://www.qt.io/) 就是自己画的，我们来看看 QT 的效果：

![qt-example](/img/cross-mobile/qtquickcontrols-example-gallery-android-dark.png)

看起来很不错是吧？不过在 Android 5 下就悲剧了，很多效果都没出来，比如按钮[没有涟漪效果](https://bugreports.qt.io/browse/QTBUG-42520)，甚至边框都没了，根本原因在于它是通过 [Qt Quick Controls 的自定义样式来模拟的](https://github.com/qtproject/qtquickcontrols/tree/5.4/src/controls/Styles/Android)，而不是使用系统 UI 组件，因此它享受不到系统升级自动带来的界面优化，只能自己再实现一遍，工作量不小。

反而如果最开始用的是 Android 原生组件就什么都不需要做，而且还能用新的 [AppCompat](https://developer.android.com/tools/support-library/features.html) 库来在 Android 5 以下实现 Material Design 效果。

最后一种做法是使用 OpenGL 来绘制界面，因为 EGL+OpenGL 本身就是跨平台，所以基于它来实现会很方便，目前大多数跨平台游戏底层都是这么做的。

既然可以基于 OpenGL 来开发跨平台游戏，是否能用它来实现界面？当然是可行的，而且 Android 4 的界面就是基于 OpenGL 的，不过它并不是只用 OpenGL 的 API，那样是不现实的，因为 OpenGL API 最初设计并不是为了画 2D 图形的，所以连画个圆形都没有直接的方法，因此 Android 4 中是通过 Skia 将路径转换为位置数组或纹理，然后再交给 OpenGL 渲染的。

然而要完全实现一遍 Android 的 UI 架构工作量不小，以下是其中部分相关代码的代码量：

路径  | 代码行数
------------- | -------------
frameworks/base/core/java/android/widget/  | 65622
frameworks/base/core/java/android/view/ | 49150
frameworks/base/libs/hwui/ | 16375
frameworks/base/graphics/java/android/graphics/ | 18197

其中光是文字渲染就非常复杂，如果你觉得简单，那只能说明你没看过这个世界有多大，或许你知道中文有编码问题、英语有连字符(hyphen)折行，但你是否知道繁体中文有竖排版、阿拉伯文是从右到左的、日语有平假名注音(ルビ)、印度语有元音附标文字(abugida አቡጊዳ)……？

而相比之下如果每个平台单独开发界面，看似工作量不小，但目前在各个平台下都会有良好的官方支持，相关工具和文档都很完善，所以其实成本没那么高，而且可以给用户和系统风格保持一致的良好体验，所以我认为对于大多数应用来说自己画 UI 是很不划算的。

不过也有特例，对于 UI 比较独特的应用来说，自己画也是有好处的，除了更灵活的控制，它还能使得不同平台下风格统一，这在桌面应用中很常见，比如 Windows 下你会发现几乎每个必备软件的 UI 都不太一样，而且好多都有换肤功能，在这种情况下很适合自己画 UI。

### Xamarin

[Xamarin](http://xamarin.com/) 可以使用 C# 来开发 Android 及 iOS 应用，它是从 [Mono](http://www.mono-project.com/) 发展而来的，目前看起来商业运作得不错，相关工具及文档都挺健全。

因为它在 iOS 下是以 AOT 的方式编译为二进制文件的，所以把它归到编译流来讨论，其实它在 Android 是[内嵌了 Mono 虚拟机](http://developer.xamarin.com/guides/android/under_the_hood/architecture/) 来实现的，因此需要装一个 17M 的运行环境。

在 UI 方面，它可以通过调用系统 API 来使用系统内置的界面组件，或者基于 [Xamarin.Forms](http://xamarin.com/forms) 开发定制要求不高的跨平台 UI。

对于熟悉 C# 的团队来说，这还真是一个看起来很不错的，但这种方案最大的问题就是相关资料不足，遇到问题很可能搜不到解决方案，不过由于时间关系我并没有仔细研究，推荐看看[这篇文章](http://www.estaun.net/blog/some-thoughts-after-almost-a-year-of-real-xamarin-use/)，其中谈到它的优缺点是：

* 优点
     - 开发 app 所需的基本功能全部都有
     - 有商业支持，而且这个项目对 Windows Phone 很有利，微软会大力支持
* 缺点
     - 如果深入后会发现功能缺失，尤其是定制 UI，因为未开源使得遇到问题时不知道如何修复
     - Xamarin 本身有些 Bug
     - 相关资源太少，没有原生平台那么多第三方库
     - Xamarin studio 比起 Xcode 和 Android Studio 在功能上还有很大差距

### Objective-C 编译为 Windows Phone

微软知道自己的 Windows Phone 太非主流，所以很懂事地推出了将 [Objective-C 项目编译到 Windows Phone](https://dev.windows.com/en-US/uwp-bridges/project-islandwood) 上运行的工具，目前这个工具的相关资料很少，鉴于 Visual Studio 支持 Clang，所以极有可能是使用 Clang 的前端来编译，因此我归到编译流。

而对于 Android 的支持，微软应该使用了虚拟机的方式，所以放到下个章节介绍。

### RoboVM

[RoboVM](http://robovm.com/) 可以将 Java 字节码编译为可在 iOS 下运行的机器码，这有点类似 [GCJ](https://gcc.gnu.org/java/)，但它的具体实现是先使用 [Soot](http://sable.github.io/soot/) 将字节码编译为 LLVM IR，然后通过 LLVM 的编译器编译成不同平台下的二进制文件。

比如简单的 `new UITextField(new CGRect(44, 32, 232, 31))` 最后会变如下的机器码(x86)：

```asm
call imp___jump_table__[j]org.robovm.apple.uikit.UITextField[allocator][clinit]
mov esi, eax
mov dword [ss:esp], ebx
call imp___jump_table__[j]org.robovm.apple.coregraphics.CGRect[allocator][clinit]
mov edi, eax
mov dword [ss:esp+0x4], edi
mov dword [ss:esp], ebx
mov dword [ss:esp+0xc], 0x40460000
...
```

基于字节码编译的好处是可以支持各种在 JVM 上构建的语言，比如 Scala、Kotlin、Clojure 等。

在运行环境上，它使用的 GC 和 GCJ 一样，都是 [Boehm GC](http://www.hboehm.info/gc/)，这是一个保守 GC，会有内存泄露问题，尽管官方说已经优化过了影响不大。

在 UI 的支持方面，它和 Xamarin 挺像，可以直接用 Java 调用系统接口来创建界面（最近支持 Interface Builder 了），比如上面的示例就是。另外还号称能使用 [JavaFX](http://javafxports.org/page/home)，这样就能在 iOS 和 Android 上使用同一套 UI 了，不过目前看起来很不靠谱。

在我看来 RoboVM 目前最大的用途就是使用 [libGDX](http://libgdx.badlogicgames.com/) 开发游戏了，尽管在功能上远不如 Cocos2d-x（尤其是场景及对象管理），但不管怎么说用 Java 比 C++ 还是方便很多（别跟我说没人用 Java 做游戏，价值 25 亿美元的 [Minecraft](https://minecraft.net/) 就是），不过本文主要关心的是 UI 开发，所以这方面的话题就不深入讨论了，

RoboVM 和 Xamarin 很像，但 RoboVM 风险会小些，因为它只需要把 iOS 支持好就行了，对优先开发 Android 版本的团队挺适用，但目前官方文档太少了，而且不清楚 RoboVM 在 iOS 上的性能和稳定性怎样。

### Swift - Apportable/Silver

[apportable](http://www.apportable.com/) 可以直接将 Swift/Objective-C 编译为机器码，但它官网的[成功案例](https://dashboard.apportable.com/customers)全部都是游戏，所以用这个来做 APP 感觉很不靠谱。

所以后来它又推出了 [Tengu](http://www.tengu.com/) 这个专门针对 APP 开发的工具，它的比起之前的方案更灵活些，本质上有点类似 C++ 公共库的方案，只不过语言变成了 Swift/Objective-C，使用 Swift/Objective-C 来编译生成跨平台的 SO 文件，提供给 Android 调用。

另一个类似的是 [Silver](http://elementscompiler.com/elements/silver/)，不过目前没正式发布，它不仅支持 Swift，还支持 C# 和自创的 Oxygene 语言（看起来像 Pascal），在界面方面它还有个跨平台非 UI 库 [Sugar](https://github.com/remobjects/sugar)，然而目前 Star 数只有 17，太非主流了，所以实在懒得研究它。

使用 Swift 编译为 SO 给 Android 用虽然可行，但目前相关工具都不太成熟，所以不推荐使用。

### Go

Go 是最近几年很火的后端服务开发语言，它语法简单且高性能，目前在国内有不少用户。

Go 从 1.4 版本开始支持开发 [Android 应用](https://godoc.org/golang.org/x/mobile)（并将在 1.5 版本支持 [iOS](https://github.com/golang/go/blob/master/doc/go1.5.txt)），不过前只能调用很少 的 API，比如 OpenGL 等，所以只能用来开发游戏，但我感觉并不靠谱，现在还有谁直接基于 OpenGL 开发游戏？大部分游戏都是基于某个框架的，而 Go 在这方面太缺乏了，我只看到一个桌面端 [Azul3D](https://azul3d.org/)，而且非常不成熟。

因为 Android 的 [View](https://github.com/android/platform_frameworks_base/blob/master/core/java/android/view/View.java) 层完全是基于 Java 写的，要想用 Go 来写 UI 不可避免要调用 Java 代码，而这方面 Go 还没有简便的方式，目前 Go 调用外部代码只能使用 cgo，通过 cgo 再调用 jni，这需要写很多中间代码，所以目前 Go 1.4 采用的是[类似 RPC 通讯的方式](http://golang.org/s/gobind)来做，[从它源码中例子](https://github.com/golang/mobile/blob/master/bind/java/testpkg/Testpkg.java)可以看出这种方式有多麻烦，性能肯定有不小的损失。

而且 cgo 的[实现](https://github.com/golang/go/blob/master/src/runtime/cgocall.go)本身就对性能有损失，除了各种无关函数的调用，它还会锁定一个 Go 的系统线程，这会影响其它 gorountine 的运行，如果同时运行太多外部调用，甚至会导致所有 gorountine 等待。

这个问题的根源在于 Go 的栈是可以自动扩充的，这种方式有利于创建无数 gorountine，但却也导致了无法直接调用 C 编译后的函数，需要[进行栈切换](https://docs.google.com/document/d/1wAaf1rYoM4S4gtnPh0zOlGzWtrZFQ5suE8qr2sD8uWQ/pub)。

所以使用 Go 开发跨平台移动端应用目前不靠谱。

话说 Rust 没有 Go 的性能，它调用 C 函数是[没有性能损耗的](http://blog.rust-lang.org/2015/04/24/Rust-Once-Run-Everywhere.html)，但目前 Rust 还没提供对 iOS/Android 的官方支持，尽管有人还是[尝试过](https://github.com/servo/servo/wiki/Building-for-Android)是可行的，但现在还不稳定，从 Rust 语言本身的设计来看，它挺适合取代 C++ 来做这种跨平台公共代码，但它的缺点是语法复杂，会吓跑很多开发者。

### Xojo

我之前一直以为 BASIC 挂了，没想到还有这么一个特例，[Xojo](https://www.xojo.com/) 使用的就是 BASIC，它有看起来很强大的 IDE，让人感觉像是在用 VisualBasic。

它的定位应该是给小朋友或业余开发者用的，因为似乎看起来学习成本低，但我不这么认为，因为用得人少，反而网上资料会很少，所以恐怕成本会更高。

因为时间关系，以及对 BASIC 无爱，我并没有怎么研究它。

### 小结

从目前分析的情况看，C++ 是比较稳妥的选择，但它对团队成员有要求，如果大家都没写过 C++，可以试试 Xamrin 或 RoboVM。

## 虚拟机流

除了编译为不同平台下的二进制文件，还有另一种常见做法是通过虚拟机来支持跨平台运行，比如 JavaScript 和 Lua 都是天生的内嵌语言，所以在这个流派中很多方案都使用了这两个语言。

不过虚拟机流会遇到两个问题：一个是性能损耗，另一个是虚拟机本身也会占不小的体积。

### Java 系

说到跨平台虚拟机大家都会想到 Java，因为这个语言一开始就是为了跨平台设计的，Sun 的 J2ME [早在 1998 年就有了](http://support.novell.com/techcenter/articles/dnd19980510.html)，在 iPhone 出来前的手机上，很多小游戏都是基于 J2ME 开发的，这个项目至今还活着，能运行在 Raspberry Pi 上。

前面提到微软提供了将 Objective-C 编译在 Windows Phone 上运行的工具，在对 Android 的支持上我没找到的详细资料，所以就暂时认为它是虚拟机的方式，从 [Astoria](https://dev.windows.com/en-US/uwp-bridges/project-astoria) 项目的介绍上看它做得非常完善，不仅能支持 NDK 中的 C++，还实现了 Java 的 debug 接口，使得可以直接用 Android Studio 等 IDE 来调试，整个开发体验和在 Android 手机上几乎没区别。

另外 BlackBerry 10 也是通过内嵌虚拟机来支持直接运行 Android 应用，不过据说比较卡。

不过前面提到 C# 和 Java 在 iOS 端的方案都是通过 AOT 的方式实现的，目前还没见到有 Java 虚拟机的方案，我想主要原因是 iOS 的限制，普通 app 不能调用 mmap、mprotect，所以无法使用 JIT 来优化性能，如果 iOS 开放，或许哪天有人开发一个像微软那样能直接在 iOS 上运行 Android 应用的虚拟机，就不需要跨平台开发了，大家只需要学 Android 开发就够了。。。

### Titanium/Hyperloop

Titanium 应该不少人听过，它和 PhoneGap 几乎是同时期的著名跨平台方案，和 PhoneGap 最大的区别是：它的界面没有使用 HTML/CSS，而是自己设计了一套基于 XML 的 UI 框架 Alloy，代码类似下面这个样子：

```html
app/styles/index.tss
".container": {
  backgroundColor:"white"
},
// This is applied to all Labels in the view
"Label": {
  width: Ti.UI.SIZE,
  height: Ti.UI.SIZE,
  color: "#000", // black
  transform: Alloy.Globals.rotateLeft // value is defined in the alloy.js file
},
// This is only applied to an element with the id attribute assigned to "label"
"#label": {
  color: "#999" /* gray */
}

app/views/index.xml
<Alloy>
  <Window class="container">
    <Label id="label" onClick="doClick">Hello, World</Label>
  </Window>
</Alloy>
```

前面我们说过由于 CSS 的过于灵活拖累了浏览器的性能，那是否自己建立一套 UI 机制会更靠谱呢？尽管这么做对性能确实有好处，然而它又带来了学习成本问题，做简单的界面问题不大，一旦要深入定制开发就会发现相关资料太少，所以还是不靠谱。

Titanium 还提供了一套跨平台的 API 来方便调用，这么做是它的优点更是缺点，尤其是下面三个问题：

1. API 有限，因为这是由 Titanium 提供的，它肯定会比官方 API 少且有延迟，Titanium 是肯定跟不过来的
2. 相关资料及社区有限，比起 Android/iOS 差远了，遇到问题都不知道去哪找答案
3. 缺乏第三方库，第三方库肯定不会专门为 Titanium 提供一个版本，所以不管用什么都得自己封装

Titanium 也意识到了这个问题，所以目前在开发下一代的解决方案 [Hyperloop](https://github.com/appcelerator/hyperloop)，它可以将 JavaScript 编译为原生代码，这样的好处是调用原生 API 会比较方便，比如它的 iOS 是这样写的

```javascript
@import("UIKit");
@import("CoreGraphics");
var view = new UIView();
view.frame = CGRectMake(0, 0, 100, 100);
```

这个方案和之前的说的 Xamarin 很相似，基本上等于将 Objective-C 翻译为 JavaScript 后的样子，意味着你可以对着 Apple 的官方文档开发，不过如果发现某些 Objective-C 语法发现不知道对应的 JavaScript 怎么写时就悲剧了，只有自己摸索。

但从 Github 上的提交历史看，这项目都快开发两年了，但至今仍然是试验阶段，从更新频率来看，最近一年只提交了 8 次，所以恐怕是要弃坑了，非常不靠谱。

因此我认为 Titanium/Hyperloop 都非常不靠谱，不推荐使用。

### NativeScript

之前说到 Titanium 自定义 API 带来的各种问题，于是就有人换了个思路，比如前段时间推出的 [NativeScript](https://www.nativescript.org/)，它的方法说白了就是用工具来自动生成 wrapper API，和系统 API 保持一致。

有了这个自动生成 wrapper 的工具，它就能方便基于系统 API 来开发跨平台组件，以简单的 `Button` 为例，源码在 [cross-platform-modules/ui/button](https://github.com/NativeScript/NativeScript/tree/master/ui/button) 中，它在 Android 下是这样实现的（TypeScript 省略了很多代码）

```javascript
export class Button extends common.Button {
    private _android: android.widget.Button;
    private _isPressed: boolean;

    public _createUI() {
        var that = new WeakRef(this);
        this._android = new android.widget.Button(this._context);
        this._android.setOnClickListener(new android.view.View.OnClickListener({
            get owner() {
                return that.get();
            },
            onClick: function (v) {
                if (this.owner) {
                    this.owner._emit(common.knownEvents.tap);
                }
            }
        }));
    }
}
```

而在 iOS 下是这样实现的（省略了很多代码）

```javascript
export class Button extends common.Button {
    private _ios: UIButton;
    private _tapHandler: NSObject;
    private _stateChangedHandler: stateChanged.ControlStateChangeListener;

    constructor() {
        super();
        this._ios = UIButton.buttonWithType(UIButtonType.UIButtonTypeSystem);

        this._tapHandler = TapHandlerImpl.new().initWithOwner(this);
        this._ios.addTargetActionForControlEvents(this._tapHandler, "tap", UIControlEvents.UIControlEventTouchUpInside);

        this._stateChangedHandler = new stateChanged.ControlStateChangeListener(this._ios, (s: string) => {
            this._goToVisualState(s);
        });
    }

    get ios(): UIButton {
        return this._ios;
    }
}
```

可以看到用法和官方 SDK 中的调用方式是一样的，只不过语言换成了 JavaScript，并且写法看起来比较诡异罢了，风格类似前面的 Hyperloop 类似，所以也同样会有语法转换的问题。

这么做最大的好处就是能完整支持所有系统 API，对于第三方库也能很好支持，但它目前最大缺点是生成的文件体积过大，即便什么都不做，生成的 apk 文件也有 8.4 MB，因为它将所有 API binding 都生成了，而且这也导致在 Android 下首次打开速度很慢。

从底层实现上看，NativeScript 在 Android 下内嵌了 V8，而在 iOS 下内嵌了自己编译的 JavaScriptCore（这意味着没有 JIT 优化，具体原因前面提到了），这样的好处是能调用更底层的 API，也避免了不同操作系统版本下 JS 引擎不一致带来的问题，但后果是生成文件的体积变大和在 iOS 下性能不如 WKWebView。

>WKWebView 是基于多进程实现的，它在 iOS 的白名单中，所以能支持 JIT。

它的使用体验很不错，做到了一键编译运行，而且还有 MVVM 的支持，能进行[数据双向绑定](http://docs.nativescript.org/bindings.html)。

在我看来 NativeScript 和 Titanium 都有个很大的缺点，那就是排它性太强，如果你要用这两个方案，就得完整基于它们进行开发，不能在某些 View 下进行尝试，也不支持直接嵌入第三方 View，有没有方案能很好地解决这两个问题？有，那就是我们接下来要介绍的 React Native。

### React Native

关于 React Native 目前网上有很多讨论了，知乎上[也有不少回答](http://www.zhihu.com/question/27852694)，尽管有些回答从底层实现角度看并不准确，但大部分关键点倒是都提到了。

鉴于我不喜欢重复别人说过的话，这里就聊点别的。

React Native 的思路简单来说就是在不同平台下使用平台自带的 UI 组件，这个思路并不新奇，十几年前的 [SWT](https://www.eclipse.org/swt/) 就是这么做的。

从团队上看，Facebook 的 iOS 团队中不少成员是来自 Apple 的，比如 [Paper 团队的经理及其中不少成员都是](http://www.quora.com/What-was-it-like-to-help-develop-Facebook-Paper)，因为 iOS 不开源，所以从 Apple 中出来的开发者还是有优势的，比如前 Apple 开发者搞出来的 [Duet](http://www.duetdisplay.com/) 就秒杀了市面上所有其他方案，而且从 Facebook 在 iOS 上开源的项目看他们在 iOS 方面的经验和技术都不错，所以从团队角度看他们做出来的东西不会太差。

在做 React Native 方案的同时，其实 Facebook 还在做一个 Objective-C++ 上类似 React 的框架 [ComponentKit](http://componentkit.org/)，以下是它的代码示例：

```Objective-C
@implementation ArticleComponent

+ (instancetype)newWithArticle:(ArticleModel *)article
{
  return [super newWithComponent:
          [CKStackLayoutComponent
           newWithView:{}
           size:{}
           style:{
             .direction = CKStackLayoutDirectionVertical,
           }
           children:{
             {[HeaderComponent newWithArticle:article]},
             {[MessageComponent newWithMessage:article.message]},
             {[FooterComponent newWithFooter:article.footer]},
           }];
}

@end
```

它的可读性比 JSX 中的 XML 差了不少，而且随着大家逐步接受 Swift，这种基于 Objective-C++ 的方案恐怕没几年就过时了，所以 Facebook 押宝 React 是比较正确的。

我看到有人说这是 Facebook 回归 H5，但其实 React Native 和 Web 扯不上太多关系，我所理解的 Web 是指 W3C 定义的那些规范，比如 HTML、CSS、DOM，而 React Native 主要是借鉴了 CSS 中的 Flexbox 写法，还有 navigator、XMLHttpRequest 等几个简单的 API，更别说完全没有 Web 的开放性，所以 React Native 和 HTML 5 完全不是一回事。

Facebook Groups 的 iOS 版本很大一部分基于 React Native 开发，其中用到了不少内部通过组件，比如 ReactGraphQL，这里我就八卦一下它，GraphQL 这是一个结构化数据查询的语法，就像 MongoDB 查询语法那样查询 JSON 数据，不过它并不是一种文档型数据库，而只是一个中间层，具体的数据源可以连其它数据库，它想取代的应该是 RESTful 那样的前后端简单 HTTP 协议，让前端更方便的获取数据，据说将会开源（看起来[打算用 Node 实现](https://www.npmjs.com/package/graphql)）。

>写文章拖时间太长的问题就是这期间会发生很多事情，比如 GraphQL 在我开始写的时候外界都不知道，所以需要八卦一下，结果[现在官方已经宣布了](https://facebook.github.io/react/blog/2015/05/01/graphql-introduction.html)，不过官方并没提到我说的那个 Node 实现，它目前还在悄悄开发阶段

React Native 的官方视频中说它能做到 App 内实时更新，其实这是 Apple 明文禁止的（[App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) 中的 2.7），要做得低调。

我比较喜欢的是 React Native 中用到了 [Flow](http://flowtype.org/)，它支持定义函数参数的类型，极大提升了代码可读性，另外还能使用 ES6 的语法，比如 class 关键字等。

React Native 比传统 Objective-C 和 UIView 的学习成本低多了，熟悉 JavaScript 的开发者应该半天内就能写个使用标准 UI 的界面，而且用 XML+CSS 画界面也远比 UIView 中用 Frame 进行手工布局更易读（我没用过 Storyboards，它虽然看起来直观，但多人编辑很容易冲突），感兴趣可以抽空看看这个[详细的入门教程](http://www.raywenderlich.com/99473/introducing-react-native-building-apps-javascript)，亲自动手试试就能体会到了，Command + R 更新代码感觉很神奇。

它目前已经有[组件仓库](http://react.parts/)了，而且在 github 上都有 500 多仓库了，其中有 sqlite、Camera 等原生组件，随着这些第三方组件的完善，基于 React Native 开发越来越不需要写原生代码了。

不过坏消息是 React Native 的 Android 版本还要等半年，这可以理解，因为在 Android 上问题要复杂得多，有 Dalvik/ART 拦在中间，使得交互起来很麻烦。

NativeScript 和 React Native 在侧重点上有很大的不同，使得这两个产品目前走向了不同的方向：

* React Native 要解决的是开发效率问题，它并没指望完全取代 Native 开发，它的 rootView 继承自 UIView，所以可以在部分 View 是使用，很方便混着，不需要重写整个 app，而且混用的时候还需要显示地将 API 暴露给 JavaScript
* NativeScript 则像是 Titanium 那样企图完全使用 JavaScript 开发，将所有系统 API 都暴露给了 JavaScript，让 JavaScript 语言默认就拥有 Native 语言的各种能力，然后再次基础上来开发

方向的不同导致这两个产品将会有不同的结局，我认为 React Native 肯定会完胜 NativeScript，因为它的使用风险要小很多，你可以随时将部分 View 使用 React Native 来试验，遇到问题就改回 Native 实现，风险可控，而用 NativeScript 就不行了，这导致大家在技术选型的时候不敢使用 NativeScript。

话说 Angular 团队看到 React Native 后表示不淡定了，于是开始[重新设计 Angular 2 的展现架构](https://docs.google.com/document/d/1M9FmT05Q6qpsjgvH1XvCm840yn2eWEg0PMskSQz7k4E/edit#)，将现有的 Render 层独立出来，以便于做到像 React 那样适应不同的运行环境，可以运行在 NativeScript 上。

综合来看，我觉得 React Native 很值得尝试，而且风险也不高。

### 游戏引擎中的脚本

游戏引擎大多都能跨平台，为了提升开发效率，不少引擎还内嵌了对脚本支持，比如：

* [Ejecta](https://github.com/phoboslab/Ejecta)，它实现了 Canvas 及 Audio 的 API，可以开发简单的游戏，但目前还不支持 Android
* [CocoonJS](https://www.ludei.com/cocoonjs/features/webgl/)，实现了 WebGL 的 API，可以运行 Three.js 写的游戏
* [Unreal Engine 3](https://www.unrealengine.com/zh-CN/previous-versions)，可以使用 UnrealScript 来开发，这个语言的语法很像 Java
* [Cocos2d-js](http://www.cocos2d-x.org/wiki/Cocos2d-js)，Cocos2d-x 的 JavaScript binding，它内部使用的 JS 引擎是 SpiderMonkey
* [Unity 3D](http://unity3d.com/unity/workflow/scripting)，可以使用 C# 或 JavaScript 开发游戏逻辑
* [Corona](https://coronalabs.com/)，使用 Lua 来开发
* ...

目前这种方式只有 Unity 3D 发展比较好，Cocos2d-JS 据说还行，有些小游戏在使用，[Corona](https://coronalabs.com/) 感觉比较非主流，虽然它也支持简单的按钮等界面元素，但用来写 APP 我不看好，因为不开源所以没研究，目前看来最大的好处似乎是虚拟机体积小，内嵌版本官方号称只有 1.4M，这是 Lua 引擎比较大的优势。

而剩下的 3 个都基本上挂了，Ejecta 至今还不支持 Android，CocoonJS 转型为类似 Crosswalk 的 WebView 方案，而 Unreal Engine 4 开始不再支持 UnrealScript，而是转向了使用 C++ 开发，感兴趣可以围观一下 Epic 创始人[解释为什么要这么做](https://forums.unrealengine.com/showthread.php?2574-Why-C-for-Unreal-4&p=16252&viewfull=1#post16252)。

当然，这些游戏引擎都不适合用来做 APP，一方面是会遇到前面提到的界面绘制问题，另一方面游戏引擎的实现一般都要不断重绘，这肯定比普通 App 更耗电，很容易被用户发现后怒删。

### Adobe AIR

尽管 Flash 放弃了移动端下的浏览器插件版本，但 [Adobe AIR](http://www.adobe.com/products/air.html) 还没挂，对于熟悉 ActionScript 的团队来说，这是一种挺好的跨平台游戏开发解决方案，国内游戏公司之前有用，现在还有没人用我就不知道了。

但开发 APP 方面，它同样缺乏好的 UI 库，[Flex](http://www.adobe.com/products/flex.html) 使用体验很差，目前基本上算挂了，目前只有 [Feathers](http://feathersui.com/) 还算能看，不过主要是给游戏中的 UI 设计的，并不适合用来开发 APP。

### Dart

Dart 在 Web 基本上失败了，于是开始转战移动开发，目前有两个思路，一个是类似 Lua 那样的嵌入语言来统一公共代码，但因为 Dart 虚拟机源自 V8，在一开始设计的时候就只有 JIT 而没有解释器，甚至[连字节码都没有](https://www.dartlang.org/articles/why-not-bytecode/)，所以它无法在 iOS 下运行，于是 Dart 团队又做了个小巧的虚拟机 [Fletch](https://github.com/dart-lang/fletch)，它基于传统的字节码解释执行方式来运行，目前代码只有 1w 多行，和 Lua 一样轻量级。

另一个就是最近比较热门的 [Sky](https://github.com/domokit/sky_sdk)，这里吐槽一下国内外的媒体，我看到的报道都是说 Google 想要用 Dart 取代 Android 下的 Java 开发。。。这个东东确实是 Google 的 Chrome 团队开发的，但 Google 是一个很大的公司好不好，内部有无数小团队，某个小团队并不能代表个 Google，如果真是 Google 高层的决定，它将会在 Google I/O 大会主题演讲上推出来，而不是 Dart Developer Summit 这样非主流的技术分享。

>[有报道](http://www.solidot.org/story?sid=43926)称 Sky 只支持在线应用，不支持离线，这错得太离谱了，人家只是为了演示它的在线更新能力，你要想将代码内嵌到 app 里当然是可以的。

Sky 的架构如下图所示，它参考了 Chrome，依靠一个消息系统来和本地环境进行通讯，使得 Dart 的代码和平台无关，可以运行在各种平台上。

![](/img/cross-mobile/sky.png)

如果你读过前面的文章，那你一定和我一样非常关心一个问题：Sky 的 UI 是怎么绘制出来的？使用系统还是自己画？一开始看 Sky 介绍视频的时候，我还以为它底层绘制基于 Chrome，因为这个视频的演讲者是 [Eric Seidel](http://www.linkedin.com/profile/view?id=5712985)，他是 WebKit 项目中非常有名的开发者，早年在 Apple 开发 WebKit，2008 年跳槽去了 Chrome 团队，但他在演讲中并没有提到 WebView，而且演示的时候界面非常像原生 Material Design 效果（比如点击有涟漪效果），所以我又觉得它是类似 React Native 那样使用原生 UI。

然而当我下载那个应用分析后发现，它既没使用 Chrome/WebView 也没使用原生 UI 组件，难不成是自己绘制的？

从 Sky SDK 的代码上看，它其中有非常多 Web 的痕迹，比如支持标准的 CSS、很多 DOM API，但它编译后的体积非常小，`libsky_shell.so` 只有 8.7 MB，我之前尝试精简过 Chrome 内核，将 WebRTC 等周边功能删掉也要 22 MB，这么小的体积肯定要删 Web 核心功能，比如 SVG 和部分 CSS3，所以我怀疑它实现了简版的 Chrome 内核渲染。

后来无意间看了一下 Mojo 的代码，才证实确实如此，原来前面那张图中介绍的 Mojo 其实并不完整，Mojo 不仅仅是一个消息系统，它是一个简版的 Chrome 内核！使用 cloc 统计代码就暴露了：

```
   12508 text files.
   11973 unique files.
    2299 files ignored.
-----------------------------------------------------
Language              files     blank   comment      code
-----------------------------------------------------
C++                    3485    129830    107745    689089
C/C++ Header           3569     92435    125742    417655
C                       266     37462     63659    269220
...
```

C++ 不包含注释的代码部分就有近 70w 行啊，而且一看目录结构就是浓浓的 Chromium 风格，至少从技术难度来说绝对秒掉前面所有方案，也印证了我前面说过如果有简化版 CSS/HTML 就能很好解决性能问题。

这也让我理解了为什么 Eric 在谈到 Mojo 的时候语焉不详，让人误以为仅仅是一个消息系统，他要是明确说这是一个精简版 Chrome，那得引起多大的误会啊，没准会有小编用「Google 宣布开发下一代浏览器内核取代 Blink」这样的标题了。

之前 Dart 决定[不将 Dart VM 放到 Chrome 里](http://news.dartlang.org/2015/03/dart-for-entire-web.html)，原来并不是因为被[众人反对](http://xahlee.info/comp/CoffeeScript_Dart_Javascript.html)而死心了，而是因为 fork 了一个 Chrome 自己拿来玩了。

综合来看，目前 Dart 的这两个方案都非常不成熟，Sky 虽然在技术上看很强大，但 Dart 语言目前接受度非常低，比起它所带来的跨平台优点，它的缺点更大，比如无法使用第三方 Native UI 库，也无法使用第三方 Web UI 库，这导致它的社区会非常难发展，命中注定非主流，真可惜了这帮技术大牛，但方向比努力更重要，希望他们能尽早醒悟，让 Sky 也支持 JavaScript。

## 结论及参考

看到这里估计不少读者晕了，有那么多种方案，最后到底哪个最适合自己？该学哪个？这里简单说说我的看法。

如果你只会 JavaScript，那目前最好的方案是 React Native，有了它你即使不了解 Native 开发也能写出很多中小应用，等万一火了再学 Native 开发也不迟啊。

如果你只会 Java，那可以尝试 RoboVM 或 j2objc，j2objc 虽然目前更稳定靠谱，但它不能像 RoboVM 那样完全用 Java 开发，所以你还得学 Objective-C 来写界面，而 RoboVM 的缺点就是貌似还不太稳定，而且似乎除了游戏以外还没见到比较知名的应用使用，而它这种方案注定会比 j2objc 更容易出问题，所以你得做好踩坑的心理准备。

如果你只会 C#，那唯一的选择就是 Xamarin 了。

如果你只会 Objective-C，很杯具目前没有比较靠谱的方案，我建议你还是学学 Java 吧，多学一门语言没啥坏处。

如果你只会 C++，可以做做游戏或非 UI 的公共部分，我不建议使用 QT 或自己画界面，还是学学 Native 开发吧。

如果你只会 Go，还别指望用它开发移动端，因为目前的实现很低效，而且这和 Go 底层的实现机制密切相关，导致很难优化，所以预计很长一段时间内也不会有改观。

如果你会 Rust，说明你很喜欢折腾，多半也会前面所有语言，自己做决定吧。。。

本文涉及到的技术点很多，有什么不准确的地方欢迎提出，另外可以关注我的微博 [weibo.com/nwind](http://weibo.com/nwind/) 进行交流。
