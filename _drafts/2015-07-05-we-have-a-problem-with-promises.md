---
layout: post
title: [翻译] We have a problem with promises
author: fangshi
---

> 原文地址: http://pouchdb.com/2015/05/18/we-have-a-problem-with-promises.html 已取得原作者同意

用Javascript的小伙伴们，是时候承认了，关于 promises 我们一直存在着问题。并非说 promises 本身有问题，Promises/A+ 是极好的。

就我过去数年观察大量 PouchDB API 以及其他 promise-heavy API 的使用者们与这些 API 的搏斗中我发现，最大的问题是：

*大部分使用 promises 的小伙伴们并没有真正的理解它*

如果你不认同这个观点，可以看看我最近在 [twitter](https://twitter.com/nolanlawson/status/578948854411878400) 上出的这道题：

Q: 下面的四种 promises 的区别是什么

```javascript
doSomething().then(function () {
  return doSomethingElse();
});

doSomething().then(function () {
  doSomethingElse();
});

doSomething().then(doSomethingElse());

doSomething().then(doSomethingElse);
```

如果你知道正常答案，那么我要恭喜你，你是一位 promises 大拿，你完全可以不再继续阅读这篇文件。

另外 99.99% 的小伙伴们，你们才是正义。没有一个人在 twitter 上给出正确答案，甚至我自己也被 #3 的答案惊到了。恩，即使这道题是我自己出的。

正确答案在这篇文章的结尾，在此之前，我希望首先探究一下为何为何 promises 如此复杂，并且为何有这么多人，无论是新手还是专家，都被它坑到了。同时我还会给出一个我自认为非常独特的视角，可以让 promises 变的更加容易理解。同时，我非常确信在了解这些之后，promises 并不会再难以理解。

不过在开始这些之前，让我们先了解一些 promises 的基础知识。

## Promises 的起源

如果你阅读了 promises 的一些相关文献，你会发现有一个词 [金字塔问题](https://medium.com/@wavded/managing-node-js-callback-hell-1fe03ba8baf) 经常出现。它描述的是大量的回调函数慢慢向右侧屏幕延伸的一种状态。

Promises 的确解决了这个问题，并且不仅仅是缩进问题。就像在 [Callback Hell的救赎](http://youtu.be/hf1T_AONQJU) 中描述的一样，回调函数真正的问题在于他剥夺了我们使用 `return` 和 `throw` 这些关键字的能力。相反，我们的整个代码流程都是基于副作用的: 一个函数会附带调用其他函数。

> 原文关于副作用的描述并不能很直观的进行理解，建议参考 [WIKI](https://en.wikipedia.org/wiki/Side_effect_(computer_science)) 。简单来说就是一个函数除了会返回一个值之外，还会修改函数以外的状态如全局变量等等。实际上所有异步调用都可以视为带有副作用的行为。译者注。

并且实际上，回调更加恼人的是，他会将我们通常在大部分编程语言中能获得的 *堆栈* 破坏。编写代码时如果无法获取堆栈就像开车时没有刹车一样: 不到用的时候，你不会知道它有多重要。

Promises 给予我们的就是在我们使用异步时丢失的最重要的语言基石: `return`, `throw` 以及堆栈。但是想要 promises 能够提供这些便利给你的前提是你知道如何正确的使用它们。

## 新手错误

一些同学试图通过用 [卡通](http://andyshora.com/promises-angularjs-explained-as-cartoon.html) 来描述 promises，或者试图用语言去描述它: "哦，你可以把它作为一个异步的值进行传递。"

我认为这些解释并不会有很大的帮助。对我来说，promises 完全是一种代码结构和流程。因此我认为直接展示一些常见的错误并且演示如何修复它们更能够说明问题。我说这些问题是 "新手问题" ，这意味着 "虽然你现在是一个新手，孩子，但是马上你会变成一位专家"。

小插曲: "promises" 对于不同的人有不同的理解和观点，但是在这篇文章中我特指 [正式标准](https://promisesaplus.com/) ，在现代浏览器中暴露为 `window.Promise`。虽然并非所有浏览器都有 `windows.Promise`，但是可以寻找一些 pollyfill ，比如 [Lie](https://github.com/calvinmetcalf/lie) 是目前体积最小的兼容标准的库。

### 新手错误 #1： promise版的金字塔问题

观察大家如何使用 PouchDB 这类大型的 promise 风格的API，我发现大量错误的 promise 使用形式。最常见的错误就是下面这个：

```javascript
remotedb.allDocs({
  include_docs: true,
  attachments: true
}).then(function (result) {
  var docs = result.rows;
  docs.forEach(function(element) {
    localdb.put(element.doc).then(function(response) {
      alert("Pulled doc with id " + element.doc._id + " and added to local db.");
    }).catch(function (err) {
      if (err.status == 409) {
        localdb.get(element.doc._id).then(function (resp) {
          localdb.remove(resp._id, resp._rev).then(function (resp) {
// et cetera...
```

是的，实际上你可以像使用回调一样使用 promises，恩，就像用打磨机去削脚趾甲一样，你确实可以这么做。

并且如果你以为这样的错误只限于初学者，那么你会惊讶于我实际上是在黑莓官方开发者博客上看到上面的代码。老的回调风格的习惯难以消灭。(至开发者: 抱歉选了你的例子，但是你的例子将会有积极的教育意义)

正确的风格应该是这样:

```javascript
remotedb.allDocs(...).then(function (resultOfAllDocs) {
  return localdb.put(...);
}).then(function (resultOfPut) {
  return localdb.get(...);
}).then(function (resultOfGet) {
  return localdb.put(...);
}).catch(function (err) {
  console.log(err);
}); 
```

这种写法被称为 `composing promises` ，是 promises 的强大能力之一。每一个函数只会在前一个 promise 被调用并且完成回调后调用，并且这个函数会被前一个 promise 的输出调用，稍后我们在这块做更多的讨论。

### 新手错误 #2： WTF, 用了 promises 后怎么用 forEach?

这里是大多数人对于 promises 的理解开始出现偏差。一旦当他们要使用他们熟悉的 forEach() 循环 (无论是 for 循环还是 while 循环)，他们完全不知道如何将 promises 与其一起使。因此他们就会写下类似这样的代码。

```javascript
// I want to remove() all docs
db.allDocs({include_docs: true}).then(function (result) {
  result.rows.forEach(function (row) {
    db.remove(row.doc);  
  });
}).then(function () {
  // I naively believe all docs have been removed() now!
});
``` 

这份代码有什么问题？问题在于第一个函数实际上返回的是 `undefined`，这意味着第二个方法不会等待所有 documents 都执行 db.remove()。实际上他不会等待任何事情，并且可能会在任意数量的文档被删除后执行！

这是一个非常隐蔽的 bug，因为如果 PouchDB 删除这些文档足够快，你的 UI 界面上显示的会完成正常，你可能会完全注意不到有什么东西有错误。这个 bug 可能会在一些古怪的竞态问题或一些特定的浏览器中暴露出来，并且到时可能几乎没有可能去定位问题。

简而言之，forEach()/for/while 并非你寻找的解决方案。你需要的是 Promise.all():

```javascript
db.allDocs({include_docs: true}).then(function (result) {
  return Promise.all(result.rows.map(function (row) {
    return db.remove(row.doc);
  }));
}).then(function (arrayOfResults) {
  // All docs have really been removed() now!
});
```

上面的代码是什么意思呢？大体来说，Promise.all()会以一个 promises 数组为输入，并且返回一个新的 promise。这个新的 promise 会在数组中所有的 promises 都成功返回后才返回。他是异步版的 for 循环。 

并且 Promise.all() 会将执行结果组成的数组返回到下一个函数，比如当你希望从 PouchDB 中获取多个对象时，会非常有用。此外一个更加有用的特效是，一旦数组中的 promise 任意一个返回错误，Promise.all()  也会返回错误。

### 新手错误 #3： 忘记使用 .catch()

这是另一个常见的错误。单纯的坚信自己的 promises 会永远不出现异常，很多开发者会忘记在他们的代码中添加一个 .catch()。然而不幸的是这也意味着，任何被抛出的异常都会被吃掉，并且你无法在 console 中观察到他们。这类问题 debug 起来会非常痛苦。

> 类似 Bluebird 之类的 Promise 库会在这种场景抛出 UnhandledRejectionError 警示有未处理的异常，这类情况一旦发现，就会造成脚本异常，在 Node 中更会造成进程 Crash 的问题，因此正确的添加 .catch() 非常重要。 译者注

为了避免这类讨厌的场景，我习惯于像下面的代码一样使用 promise:

```javascript 
somePromise().then(function () {
  return anotherPromise();
}).then(function () {
  return yetAnotherPromise();
}).catch(console.log.bind(console)); // <-- this is badass
```

即时你坚持不会出现异常，添加一个 catch() 总归是更加谨慎的。如果你的假设最终被发现是错误的，他会让你的生活更加美好。

### 新手错误 #4：使用 "deferred"

这是一个我[经常可以看到的错误](http://gonehybrid.com/how-to-use-pouchdb-sqlite-for-local-storage-in-your-ionic-app/)，以至于我甚至并愿意在这里重复它，就像惧怕 Beetlejuice 一样，仅仅是提到它的名字，就会召唤更多它的到来。

简单的说，promises 拥有一个漫长并且戏剧化的历史，Javascript 社区花费了大量的时间让其最终正确有效。在早期，deferred 在 Q，When，RSVP，Bluebird，Lie等等的 “优秀” 类库中被引入， jQuery 与 Angular 在使用 ES6 Promise 规范之前，都是使用这种模式编写代码。

因此如果你在你的代码中使用了这个词 (我不会把这个词重复第三遍！)，你就做错了。下面是说明一下如何避免它。

首先，大部分 promises 类库都会提供一个方式去包装一个第三方的 promises 对象。举例来说，Angular的 `$q` 模块允许你使用 `$q.when` 包裹非 `$q` 的 promises。因此 Angular 用户可以这样使用 PouchDB promises.

```javascript
$q.when(db.put(doc)).then(/* ... */); // <-- this is all the code you need
```

另一种策略是使用[构造函数声明模式](https://blog.domenic.me/the-revealing-constructor-pattern/)，它在用来包裹非 promise API 时非常有用。举例来说，为了包裹一个回调风格的 API 如 Node 的 `fs.readFile` ，你可以简单的这么做:

```javascript
new Promise(function (resolve, reject) {
  fs.readFile('myfile.txt', function (err, file) {
    if (err) {
      return reject(err);
    }
    resolve(file);
  });
}).then(/* ... */)
```

完工！我们打败了可怕的 def....啊哈，抓到自己了。:)

> 关于为何这是一种反模式更多的内容，请查看 Bluebird 的 [promise anti-patterns](https://github.com/petkaantonov/bluebird/wiki/Promise-anti-patterns#the-deferred-anti-pattern) wiki 页

### 新手错误 #5：使用副作用调用而非返回

下面的代码有什么问题？

```javascript
somePromise().then(function () {
  someOtherPromise();
}).then(function () {
  // Gee, I hope someOtherPromise() has resolved!
  // Spoiler alert: it hasn't.
});
```

好了，现在是一个合适的时机去讨论关于 promises 你所需要知道的一切内容。

认真的说，这是一个一旦你理解了它，就会避免所有我提及的错误的古怪的技巧。你准备好了么？

就如我前面所说，promises 的奇妙在于给予我们以前的 `return` 与 `throw`。但是在实践中这到底是怎么一回事呢？

每一个 promise 都会提供给你一个 `then()` 函数 (或是 `catch()`，实际上只是 `then(null, ...)` 的语法糖)。当我们在 `then()` 函数内部时：

```javascript
somePromise().then(function () {
  // I'm inside a then() function!
});
```

我们可以做什么呢？有三种事情：

1. `return` 另一个 promise
2. `return` 一个同步的值 (或者 `undefined`)
3. `throw` 一个同步异常

就是这样。一旦你理解了这个技巧，你就理解了 promises。因此让我们一次性逐个了解下。

1. 返回另一个 promise

    这是一个在 promise 文档中常见的使用模式，也就是我们在上文中提到的 "composing promises"：
    
    ```javascript
    getUserByName('nolan').then(function (user) {
      return getUserAccountById(user.id);
    }).then(function (userAccount) {
      // I got a user account!
    });
    ```
    
    注意到我是 `return` 第二个 promise，这个 `return` 非常重要。如果我没有写 `return`，`getUserAccountById()` 就会成为一个副作用，并且下一个函数将会接收到 `undefined` 而非 `userAccount`。

2. 返回一个同步值 (或者 undefined)

    返回 `undefined` 通常是错误的，但是返回一个同步值实际上是一个非常赞的方式去将同步代码包裹为 promise 风格代码。举例来说，我们对 users 信息有一个内存缓存。我们可以这样做：
    
    ```javascript
    getUserByName('nolan').then(function (user) {
      if (inMemoryCache[user.id]) {
        return inMemoryCache[user.id];    // returning a synchronous value!
      }
      return getUserAccountById(user.id); // returning a promise!
    }).then(function (userAccount) {
      // I got a user account!
    });
    ```
    
    是不是很赞？第二个函数不需要关心 `userAccount` 是从同步方法还是异步方法中获取的，并且第一个函数可以非常的自由的返回一个同步或者异步值。
    
    不幸的是，有一个不便的现实是在 JavaScript 中无返回值函数在技术上是返回 `undefined`，这就意味着当你本意是返回某些值时，你很容易会不经意间引入副作用。
    
    出于这个原因，我个人养成了在 `then()` 函数内部 *永远返回或抛出* 的习惯。我建议你也这样做。

3. 抛出同步异常

    谈到 `throw`，这是让 promises 更加赞的一点。比如我们希望在用户已经登出时，抛出一个同步异常。这会非常简单：
    
    ```javascript
    getUserByName('nolan').then(function (user) {
      if (user.isLoggedOut()) {
        throw new Error('user logged out!'); // throwing a synchronous error!
      }
      if (inMemoryCache[user.id]) {
        return inMemoryCache[user.id];       // returning a synchronous value!
      }
      return getUserAccountById(user.id);    // returning a promise!
    }).then(function (userAccount) {
      // I got a user account!
    }).catch(function (err) {
      // Boo, I got an error!
    });
    ```
    
    如果用户已经登出，我们的 `catch()` 会接收到一个同步异常，并且如果 *后续的 promise 中出现异步异常*，他也会接收到。再强调一次，这个函数并不需要关心这个异常是同步还是异步返回的。
    
    这种特性非常有用，因此它能够在开发过程中帮助定位代码问题。举例来说，如果在 `then()` 函数内部中的任何地方，我们执行 `JSON.parse()`，如果 JSON 格式是错误的，那么它就会抛出一个异常。如果是使用回调风格，这个错误很可能就会被吃掉，但是使用 promises，我们可以轻易的在 `catch()` 函数中处理它了。

## 进阶错误

好了，现在你已经了解了让 promises 变的超级简单的技巧，现在让我们聊一聊一些特殊场景。

这些错误之所以被我归类为 "进阶" ，是因为我只见过这些错误发生在对 promises 已经有相当深入了解的开发者身上。但是为了解决文章最开始的谜题，我们必须讨论一下这些错误。

### 进阶错误 #1：不知道 `Promise.resolve()`

如我上面所列举的，promises 在封装同步与异步代码时非常的有用。然而，如果你发现你经常写出下面的代码：

```javascript
new Promise(function (resolve, reject) {
  resolve(someSynchronousValue);
}).then(/* ... */);
```
你会发现使用 `Promise.resolve` 会更加简洁：

```javascript
Promise.resolve(someSynchronousValue).then(/* ... */);
```

它在用来捕获同步异常时也极其的好用。由于它实在是好用，因此我已经养成了在我所有 promise 形式的 API 接口中这样使用它：

```javascript
function somePromiseAPI() {
  return Promise.resolve().then(function () {
    doSomethingThatMayThrow();
    return 'foo';
  }).then(/* ... */);
}
```

切记：任何有可能 `throw` 同步异常的代码都是一个后续会导致几乎无法调试异常的潜在因素。但是如果你将所有代码都使用 `Promise.resolve()` 封装，那么你总是可以在之后使用 `catch()` 来捕获它。

类似的，还有 `Promise.reject()` 你可以用来返回一个立刻返回失败的 promise。

```javascript 
Promise.reject(new Error('some awful error'));
```

### 进阶错误 #2：`catch()` 与 `then(null, ...)` 并非完全等价

之前我说过 `catch()` 仅仅是一个语法糖。因此下面两段代码是等价的：

```javascript 
somePromise().catch(function (err) {
  // handle error
});

somePromise().then(null, function (err) {
  // handle error
});
```

然而，这并不意味着下面两段代码是等价的：

```javascript
somePromise().then(function () {
  return someOtherPromise();
}).catch(function (err) {
  // handle error
});

somePromise().then(function () {
  return someOtherPromise();
}, function (err) {
  // handle error
});
```

如果你好奇为何这两段代码并不等价，可以考虑一下如果第一个函数抛出异常会发生什么：

```javascript
somePromise().then(function () {
  throw new Error('oh noes');
}).catch(function (err) {
  // I caught your error! :)
});

somePromise().then(function () {
  throw new Error('oh noes');
}, function (err) {
  // I didn't catch your error! :(
});
```

因此，当你使用 `then(resolveHandler, rejectHandler)` 这种形式时，`rejectHandler ` *并不会捕获由 `resolveHandler` 引发的异常*。

鉴于此，我个人的习惯是不适用 `then()` 的第二个参数，而是总是使用 `catch()`。唯一的例外是当我写一些异步的 [Mocha](http://mochajs.org/) 测试用例时，我可能会希望用例的异常可以正确的被抛出：

```javascript 
it('should throw an error', function () {
  return doSomethingThatThrows().then(function () {
    throw new Error('I expected an error!');
  }, function (err) {
    should.exist(err);
  });
});
```

说到这里，[Mocha](http://mochajs.org/) 和 [Chai](http://chaijs.com/) 用来测试 promise 接口时，是一对非常好的组合。[ pouchdb-plugin-seed](https://github.com/pouchdb/plugin-seed) 项目中有一些 [示例](https://github.com/pouchdb/plugin-seed/blob/master/test/test.js) 可以帮助你入门。

### 进阶错误 #3：promises vs promises factories

当我们希望执行一个个的执行一个 promises 序列，即类似 `Promise.all()` 但是并非并行的执行所有 promises。

你可能天真的写下这样的代码：

```javascript 
function executeSequentially(promises) {
  var result = Promise.resolve();
  promises.forEach(function (promise) {
    result = result.then(promise);
  });
  return result;
}
```

不幸的是，这份代码不会按照你的期望去执行，你传入 `executeSequentially()` 的 promises 依然会并行执行。

其根源在于你所希望的，实际上根本不是去执行一个 promises 序列。依照 promises 规范，一旦一个 promise 被创建，它就被执行了。因此你实际上需要的是一个 `promise factories` 数组。

```javascript
function executeSequentially(promiseFactories) {
  var result = Promise.resolve();
  promiseFactories.forEach(function (promiseFactory) {
    result = result.then(promiseFactory);
  });
  return result;
}
```

我知道你在想什么：“这是哪个见鬼的 Java 程序猿，他为啥在说 factories？” 。实际上，一个 promises factory 是十分简单的，它仅仅是一个可以返回 promise 的函数：

```javascript
function myPromiseFactory() {
  return somethingThatCreatesAPromise();
}
```

为何这样就可以了？这是因为一个 promise factory 在被执行之前并不会创建 promise。它就像一个 `then` 函数一样，而实际上，它们就是完全一样的东西。

如果你查看上面的 `executeSequentially()` 函数，然后想象 `myPromiseFactory` 被包裹在 `result.then(...)` 之中，也许你脑中的小灯泡就会亮起。在此时此刻，对于 promise 你就算是悟道了。

### 进阶错误 #4：好了，如果我希望获得两个 promises 的结果怎么办

有时候，一个 promise 会依赖于另一个，但是如果我们希望同时获得这两个 promises 的输出。举例来说：

```javascript
getUserByName('nolan').then(function (user) {
  return getUserAccountById(user.id);
}).then(function (userAccount) {
  // dangit, I need the "user" object too!
});
```

为了成为一个优秀的 Javascript 开发者，并且避免金字塔问题，我们可能会将 `user` 对象存在一个更高的作用域中的变量里：

```javascript
var user;
getUserByName('nolan').then(function (result) {
  user = result;
  return getUserAccountById(user.id);
}).then(function (userAccount) {
  // okay, I have both the "user" and the "userAccount"
});
```

这样是没问题的，但是我个人认为这样做有些杂牌。我推荐的策略是：抛弃成见，拥抱金字塔：

```javascript
getUserByName('nolan').then(function (user) {
  return getUserAccountById(user.id).then(function (userAccount) {
    // okay, I have both the "user" and the "userAccount"
  });
});
```

...至少暂时这样是没问题的。如果缩进开始成为问题，你可以如 Javascript 开发者从远古时期就开始使用的技巧，将函数抽离到一个命名函数中：

```javascript
function onGetUserAndUserAccount(user, userAccount) {
  return doSomething(user, userAccount);
}

function onGetUser(user) {
  return getUserAccountById(user.id).then(function (userAccount) {
    return onGetUserAndUserAccount(user, userAccount);
  });
}

getUserByName('nolan')
  .then(onGetUser)
  .then(function () {
  // at this point, doSomething() is done, and we are back to indentation 0
});
```
由于你的 promise 代码开始变得更加复杂，你可能发现自己开始将越来越多的函数抽离到命名函数中，我发现这样做，你的代码会越来越漂亮，就像这样：

```javascript 
putYourRightFootIn()
  .then(putYourRightFootOut)
  .then(putYourRightFootIn)  
  .then(shakeItAllAbout);
```

这就是 promises 的重点。

### 进阶错误 #5：promises 穿透

最后，这个错误就是我开头说的 promises 谜题所影射的错误。这是一个非常稀有的用例，并且可能完全不会出现在你的代码中，但是的的确确震惊了我。

你认为下面的代码会打印出什么？

```javascript 
Promise.resolve('foo').then(Promise.resolve('bar')).then(function (result) {
  console.log(result);
});
```

如果你认为它会打印出 `bar`，那么你就错了。它实际上打印出来的是 `foo`！

发生这个的原因是如果你像 `then()` 传递的并非是一个函数（比如 promise），它实际上会将其解释为 `then(null)`，这就会导致前一个 promise 的结果会穿透下面。你可以自己测试一下：

```javascript 
Promise.resolve('foo').then(null).then(function (result) {
  console.log(result);
});
```

添加任意数量的 `then(null)`，它依然会打印 `foo`。

这实际上又回到了我之前说的 promises vs promise factories。简单的说，你可以直接传递一个 promise 到 `then()` 函数中，但是它并不会按照你期望的去执行。`then()` 是期望获取一个函数，因此你希望做的最可能是：

```javascript 
Promise.resolve('foo').then(function () {
  return Promise.resolve('bar');
}).then(function (result) {
  console.log(result);
});
```

这样他就会如我们所想的打印出 `bar`。

因此记住：永远都是往 `then()` 中传递函数！

## 谜题揭晓

现在我们了解了关于 promsies 所有的知识（或者接近！），我们应该可以解决文章最开始我提出的谜题了。

这里是谜题的所有答案，我以图形的格式展示出来方便你查看：

### Puzzle #1

```js
doSomething().then(function () {
  return doSomethingElse();
}).then(finalHandler);
```

Answer:

```
doSomething
|-----------------|
                  doSomethingElse(undefined)
                  |------------------|
                                     finalHandler(resultOfDoSomethingElse)
                                     |------------------|
```


### Puzzle #2

```js
doSomething().then(function () {
  doSomethingElse();
}).then(finalHandler);
```

Answer:

```
doSomething
|-----------------|
                  doSomethingElse(undefined)
                  |------------------|
                  finalHandler(undefined)
                  |------------------|
```


### Puzzle #3

```js
doSomething().then(doSomethingElse())
  .then(finalHandler);
```

Answer:

```
doSomething
|-----------------|
doSomethingElse(undefined)
|---------------------------------|
                  finalHandler(resultOfDoSomething)
                  |------------------|
```

### Puzzle #4

```js
doSomething().then(doSomethingElse)
  .then(finalHandler);
```

Answer:

```
doSomething
|-----------------|
                  doSomethingElse(resultOfDoSomething)
                  |------------------|
                                     finalHandler(resultOfDoSomethingElse)
                                     |------------------|
```

如果这些答案你依然无法理解，那么我强烈建议你重新读一下这篇文章，或者实现一下 `doSomething()` 和 `doSomethingElse()` 函数并且在浏览器中自己试试看。

> 声明：在这些例子中，我假定 `doSomething()` 和 `doSomethingElse()` 均返回 promises，并且这些 promises 代表某些在 JavaScript event loop (如 IndexedDB, network, `setTimeout`) 之外的某些工作结束，这也是为何它们在某些时候表现起来像是并行执行的意义。这里是一个模拟用的 [JSBin](http://jsbin.com/tuqukakawo/1/edit?js,console,output)。

关于更多 promises 的进阶用法，可以参考我的 [promise protips cheat sheet](https://gist.github.com/nolanlawson/6ce81186421d2fa109a4)

## 关于 promises 最后的话

Promises 是非常赞的。如果你还在使用回调模式，我强烈建议你切换到 promises。你的代码会变的更少，更优雅，并且更加容易理解。

如果你不相信我，这里是证明：[a refactor of PouchDB's map/reduce module](https://t.co/hRyc6ENYGC) 使用 promises 替换回调。结果是：新增 290 行，删除 555 行。

顺带一提，写出那令人讨厌的回调代码的人。。是我！因此这是我第一次领会到 promises 的力量，同时我感谢其他 PouchDB 的贡献者们教导我这样做。

当然了，promises 并非完美。虽然它的确比回调模式要好，但是这样说就好比说给你肚子来一拳会比在你牙齿上踹一脚好。承认，它是会略有优势，但是如果你有选择，你会两者都尽力避免。

作为回调模式的升级版，promises 依然难以理解并且容易误用，证明之一就是我不得不写下这篇博文。初学者与专家都很容易经常将它用错，并且真要说的话，并非是他们的问题。问题在于 promises 的使用模式与我们写同步代码非常类似，但是又不尽然。

> 我也认为 promises 的确难以理解并且容易误用，证明之一就是我不得不翻译这篇博文。 译者注

老实说，你不应该需要去学一堆晦涩难懂的规则和新的 API 去做在同步代码中我们已经熟稔的 `return`，`catch`，`throw` 和 for 循环。在你的脑中不应该总是要提醒自己要区分有两套并行的系统。

## 期待 async/await

这是我在 ["Taming the asynchronous beast with ES7"](http://pouchdb.com/2015/03/05/taming-the-async-beast-with-es7.html) 中提到的重点，在这篇文章中我探究了 ES7 的 `async`/`await` 关键字，以及它们是如何将 promises 更深度的结合入语言。不再会要求我们去编写伪同步的代码（以及一个假的 `catch()` 函数，虽然像，但是并非是 `catch`），ES7 将会允许我们使用真正的 `try`/`catch`/`return` 关键字，就像我们在 CS 101 上学的一样。

这对于 Javascript 语言来说是一个大福音。因为即使到最后，只要我们的工具不告诉我们做错了，这些 promise 反模式依然会一直出现。

从 JavaScript 的历史来看，我认为公正的评价来说 [JSLint](http://jslint.com/) 与 [JSHint](http://jshint.com/) 对社区的贡献是高于 [JavaScript: The Good Parts](http://amzn.com/0596517742) 的，虽然他们包含的信息实际上是相同的。但是它们的区别在于 *被告知你在你代码中犯的错误* 与你去阅读一本书籍，去理解其他人犯的错误。

ES7 的 `async`/`await` 的美妙在于，你的错误会被作为语法或者编译器错误提示出来，而不是运行时的 bug。不过就目前而言，了解 promise 可以做什么以及如何在 ES5 与 ES6 中正确的使用它们依然是有必要的。

因此当我意识到，就像 *JavaScript: The Good Parts* 一样，这篇博文可能只会有非常有限的影响的时候，我希望当你发现其他人在犯同样的错误的时候，你可以将这篇博文提供给他们。因为现在依然有很多同学需要承认: "I have a problem with promises!"

> 更新：有人告知我 Bluebird 3.0 将会 [打印警告](http://imgur.com/a/t3xng) 来避免我文中所列举的这些错误。因此当我们还在等待 ES7 时，使用 Bluebird 会是另一个极好的方案。