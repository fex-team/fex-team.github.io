---
layout: post
title: FIS - 全新组件生态
author: 2betop
shortname: fis-components
---

## 这是什么？

先允许我简单的介绍一下，有了 FIS 组件生态后，使用第三方组件就会变得如此的简单。

1. 通过命令 `fis install jquery` 下载组件到当前项目的 components 目录。
2. 在代码中通过组件名就能引用，不用关心他在什么目录。

    ```javascript
    var $ = require('jquery');
    ```

了解更多，请参考此[demo](https://github.com/fex-team/fis-components-demo)。

## 发展历史

我们的目标是实现可复用的组件共享，来进一步提高开发效率。

### lights

早期，由于当时 bower 还没有兴起，希望可以借助 lights 平台来实现组件共享。但是，随着时间的发展，发现 lights 里面文件存放比较随意，有的是单个文件，有的是 demo 示例，有的是脚手架框架，这样容易给用户带来困惑，可以说 lights 最后成了个存储平台。也许是缺少一个严格的文件存放规范，导致了这个问题。

### bower

后来，bower 慢慢的兴起，而且涌现了大量的第三库（组件），本想直接使用 bower 来解决组件共享的问题。结果出现了一个很尴尬的问题，FIS 中遵循的是 CommonJs 规范，而现有大量第三方库却是采用 AMD 规范，以至于必须手工修改后才能在 FIS 中使用。这样非常不利于组件维护升级。

随者 amd 的影响越来越大，后来 FIS 也以插件的形式支持了 amd 规范，现有 amd 组件可以不做任何修改，直接在 FIS 中使用了。结合 bower 基本上可以解决组件生态需求了。但是还是存在几个缺点：

1. FIS amd 插件，由于 amd 规则复杂，需要分析语法才能保证功能正确。分析速度比原来的正则分析要慢很多。
2. bower 中杂乱的文件也比较多，影响 FIS 编译速度，无关的文件其实是可以不编译的。（可以手工配置 excluder 忽略）
3. 老项目采用的是原来的 mod.js 方案，需要引入 amd 插件，重新编译才能支持，成本和风险略大。
4. bower 中并不是所有组件都是 amd 规范，使用前需要审视源码。

### [fis-components](https://github.com/fis-components)

我们希望有个更好的解决方案。

1. 制定相对严格的[组件规范](https://github.com/fis-components/spec) 用来解决使用困惑和文件杂乱的问题。
2. 采用 CommonJs 作为模块规范，与 node.js 一致，规则简单实用。同时支持 amd 异步 require，满足浏览器端按需加载问题。
3. 结合 [travis-ci](http://travis-ci.org/fis-components/components) 和大家共同维护的[modules 配置](https://github.com/fis-components/components/tree/master/modules), 将现有流行的组件，自动转化成 CommonJs 规范，集成到 [fis-components](https://github.com/fis-components) 平台。解决与现有生态同步的问题。
4. 短路径支持，只需要组件名就能引用，满足组件间依赖引用，无需关心组件被安装在什么目录。
5. 多平台支持，FIS 的组件存放平台可以是 github、gitlab 或者 lights，可以满足私有化需求。

## 疑惑

### 为什么需要 [fis-components](https://github.com/fis-components) 机构来转换和管理组件，而不直接使用？

目前 `fis install` 是可以直接安装任何在 github 上的仓库的，但是被安装到 FIS 中后，我需要去关心目标组件是 amd 规范 还是 CommonJs 规范，还是就是简单写法（代码中可能隐藏着对其库的依赖），知道这些信息后，还需要思考用何种方式去使用这些组件。

但是，如果直接使用 [fis-components](https://github.com/fis-components) 中的组件，你不用关心这些问题，只管简单的 `require(${组件名})`。

因为，[fis-components](https://github.com/fis-components) 负责了统一工作，并去掉了无用的文件。


### 为什么选择 commonJs 规范？

目前比较流行组件规范有 AMD 、CommonJs  和 UMD 三种（[什么是 amd commonjs umd?](http://davidbcalhoun.com/2014/what-is-amd-commonjs-and-umd/)）, AMD 和 UMD 居多，而我们的选择是 CommonJs 规范与 node.js 保持一致。 因为它最简单，且实用，学习成本最低。

同时，AMD 和 UMD 都是扩展自 CommonJs 规范，目的是适用于浏览器。 而在 FIS 的开发环境中，我们直接就能使用 CommonJs 规范。而且目前已被 mod.js 方案采用，广泛应用于厂内各大产品。

采用 CommonJs 规范，mod.js 方案和 AMD 方案，都能直接使用，兼容性最好。

### 如何贡献到 [fis-components](https://github.com/fis-components) ？

使用 [fis-components](https://github.com/fis-components) 提供的组件，有一定的局限性，有可能想用的组件不在机构里面。不过没关系，只需简单配置一个文件，提交 pull request。
代码一旦合入就会自动触发 travis-ci 自动完成转换工作。

如：jquery-pjax.js

```javascript
module.exports = (function() {

    return [{

        // 目标组件的地址
        repos: 'https://github.com/defunkt/jquery-pjax.git',

        // 需要转换的版本
        version: 'v1.9.4',

        // 在 fis-components 中的名称
        name: 'jquery-pjax',

        // 主文件，请查看规范说明。当组件名引用的时候，默认引用的是此文件
        main: 'jquery.pjax.js',

        // 设置此组件的依赖。
        dependencies: [
            "jquery@>=1.8"
        ],

        // 配置文件信息，只把需要的文件 copy 过来
        mapping: [
            {
                reg: /\.min\.(js|css)$/,
                release: false
            },
            {
                reg: /^\/jquery\.pjax\.js$/,
                release: 'jquery.pjax.js'
            },
            {
                reg: /^\/README\.md$/,
                release: '$&'
            },
            {
                reg: '*',
                release: false
            }
        ],

        // 当目标不是 amd/umd 规范时，需要设置 shim 信息。
        shim: {
            "jquery.pjax.js": {
              "deps": ["jquery"]
            }
        }
    }]
})();
```


我相信社区的力量，随着时间的发展，[fis-components](https://github.com/fis-components) 中的组件会越来越多。

更多细节，请查看[FIS 组件平台建设](https://github.com/fis-components/components/blob/master/platform.md)。

## 其他特性

### 多平台支持

默认情况下，FIS install 的组件来源来自于[fis-components](https://github.com/fis-components)，同时也可以指定成其他平台。只要组件符合[规范](https://github.com/fis-components/spec)，并且是 github、gitlab 或者 lights 平台中的任意一种，就能被 `fis install` 下载。基于此功能，可以建设私有平台，实现部门内部的组件共享。

### 独有 FIS 模板支持

在 FIS 开发中，经常打交道的，不光有 js css，还有模板文件，如： fisp 中的 smarty tpl、yog 中的 swig tpl 以及 jello 中的  velocity vm 和 jsp 模板。相信这类代码，也有不少可复用的。将这类发布成组件，同样可以简单的实现共享。


如：jello 中引入

```velocity
#widget("componentName/xxx.vm")

```

## 结尾

此方案也可能存在不少问题，请不要吝啬你的想法在 [issues](https://github.com/fis-components/components/issues) 中跟大家一起讨论。
