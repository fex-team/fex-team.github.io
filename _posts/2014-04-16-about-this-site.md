---
layout: post
title: FEX官网诞生记 + 完整PSD下载
author: Rayi
---

## 这又是拖延症爆发的结果
本来早就说在网站上线后就写一篇这样的文章的，结果拖延症犯了，一直到现在还没写好。

最近实在是觉得无颜再拖，所以赶紧写出来给大家随便瞅瞅。 

> 请勿拍砖，拍砖请自带砖头！


## 且先说说这个网站
网站也就是目前百度FEX团队的官网了，之前接到任务后，花了一些时间做了设计图，然后就开始开工去做静态页面了。

![网站设计稿](/img/about-this-site/site.png)

不过因为要用[Jekyll][]来搭建，所以又去了解了一下[Jekyll][]的相关信息。至于为什么选择了[Jekyll][]，且听我慢慢道来。

目前FEX的官网使用的是[Github Pages][githubpages]的服务，你可以到 [这里][githubpages] 来查了解关于更多[Github Pages][githubpages]的信息。

网站的设计图也放出来给大家了，如果对网站有兴趣的，可以到我们的[网站代码github][fexgit]上去[fork][fexgit]一份代码，整个网站都是开源的。

如果你有对代码做了什么修正，也欢迎 pull request 提交代码给我们！



## 为什么用 Jekyll

首先 [Github Pages][githubpages]的服务本身是不能运行类似php这样的动态语言的，因此一般大家都常用的方法是写静态页面。

那么可选的方案一般就是：

1. 自己写静态页面，每次写了之后更新。
2. 通过一些工具来实现静态页面创建。

但同时，我们还有一些其他需求：

1. 文章能用[markdown][]格式来写，不涉及展现的html代码。
2. 整个网站放在[github][]上。

于是结合起来方案就是利用工具来维护，生成静态页面，然后更新到[github][]上。但是这种方案的问题是，每次提交前必须要生成静态页面，而这个动作不太好做成自动进行的（因为我们的文章作者有很多，不一定大家都想的起来做这个动作）。
那自然，我们想去了解是否能提交后生成静态页面呢？？

我们看到[Github Pages][githubpages]支持了[Jekyll][]，意味着当你将[Jekyll][]的项目代码提交后，会自动给你生成相应的静态页面。于是我们的问题愉快的被解决了。
> 这里插播一下，除了[Jekyll][]之外，其实还有一些其他工具方案来生成页面的，大家不妨看以下 Rank 写的这篇 [《用 hexo 在 github page 搭建博客》][rankpage]，里面有提到其他的工具方案。

## 其他杂七杂八的

个性化域名设置，去看[github]的文档就行，或者直接穿越去看看: https://help.github.com/articles/setting-up-a-custom-domain-with-pages 。

评论系统本来之前用的 [Disqus][],但是因为毕竟是国外服务，加载速度上有点慢，所以最后改成了[多说][duoshuo]，速度快多了，而且可以微博登录哦。

其他好像没什么想介绍的了，如果有对其他信息感兴趣的，欢迎留言评论！

对了！我在文章列表那里参考了[淘宝UED](http://ued.taobao.org/blog/)的文章块样式，这个得写出来，不然就是刺果果的抄袭而且不承认了！

## 福利包
如之前所说，我把网站设计稿和一些Banner图片的设计稿都扔出来了。

如果，我是说如果你对我们的官网设计感兴趣，那么，你可以移步到 [下载PSD文件][downloadpsd]来下载相应的PSD文件。其中包括首页和文章页的设计稿。

也欢迎看看我之前写的其他文章： [《妹纸+基友技术交流会，有图有真相哦！》](/blog/2014/04/fex-w3ctech-happyend/) 

[Disqus]: http://disqus.com/
[duoshuo]: http://duoshuo.com
[githubpages]: http://pages.github.com/
[github]: https://github.com/
[Jekyll]: http://jekyllrb.com/
[downloadpsd]: http://pan.baidu.com/s/1qWFaF5i
[markdown]: http://daringfireball.net/projects/markdown/
[fexgit]: http://github.com/fex-team/fex-team.github.io/
[rankpage]: http://rank.im/2014/03/10/hexo-for-blog/

