---
layout: post
title: chrome远程调试协议分析与实战
author: the1sky
---

##背景

某一天，A君想获取Chrome页面中的性能数据，诸如时间、白屏和首屏等，因为需要和竞品进行对比分析，无法注入代码，该怎么办？

此时，你也许能想到*开发者工具(DevTools)*，也许知道*Timeline(包含浏览器完整的行为数据)*，该怎么自动获取到Timeline数据呢？

##开发者工具

[开发者工具](http://src.chromium.org/blink/trunk/Source/devtools)(DevTools)是一个独立的web应用程序(HTML+CSS+Javascript)，被集成在浏览器中，通过[远程调试协议](https://developer.chrome.com/devtools/docs/debugger-protocol)(remote debugging protocol)和浏览器内核进行交互，直接使用 *Ctrl+Shift+I* 呼出。

![devtools](/img/remote-debugging-protocol/devtools.png)


可以在当前的浏览器页面直接打开DevTools调试，也可以在浏览器之外进行调试，本文的实战内容基于PC平台浏览器之外的远程调试。

##远程调试协议

远程调试协议基于websocket，利用websocket建立连接DevTools和浏览器内核的快速数据通道。DevTools中的源代码([Main.js:220](http://src.chromium.org/blink/trunk/Source/devtools/front_end/main/Main.js))如下：

    var ws;
    if ("ws" in WebInspector.queryParamsObject)
        ws = "ws://" + WebInspector.queryParamsObject.ws;
    else if ("page" in WebInspector.queryParamsObject) {
        var page = WebInspector.queryParamsObject.page;
        var host = "host" in WebInspector.queryParamsObject ? WebInspector.queryParamsObject.host : window.location.host;
        ws = "ws://" + host + "/devtools/page/" + page;
    }

该协议把操作划分为不同的域(domain)，比如DOM、Debugger、Network、Console和Timeline等，可以理解为DevTools中的不同功能模块。

每个域(domain)定义了它所支持的command和它所产生的event。

每个command包含request和response两部分，request部分指定所要进行的操作以及操作说要的参数，response部分表明操作状态，成功或失败。

command和event中可能涉及到非基本数据类型，在domain中被归为Type，比如：'frameId':<FrameId>，其中FrameId为非基本数据类型

至此，不难理解：

    domain = command + event + type

##远程调试协议应用场景

* 针对移动端的远程调试，因为移动平台一般都不会提供足够大的区域来显示DevTools，必须要在手机浏览器之外进行远程调试,具体配置请参看[这篇文章](https://developer.chrome.com/devtools/docs/remote-debugging#remote)

* 获取js的[Runtime](https://developer.chrome.com/devtools/docs/protocol/tot/runtime)数据，常用的如[window.performance](http://www.w3.org/TR/navigation-timing/)和window.chrome.loadTimes()等

* 获取[Network](https://developer.chrome.com/devtools/docs/protocol/tot/network)及[Timeline](https://developer.chrome.com/devtools/docs/protocol/tot/timeline)数据，进行自动性能分析

* 与强大的[phantomjs](http://phantomjs.org/)合体，phantomjs暂时只支持基于remote debugging protocol的调试，希望能支持Network及Timeline数据的获取，phantomjs的最新技术请[点击进入](https://groups.google.com/forum/#!forum/phantomjs)

##远程调试协议结构

以Page domain为例

command结构如下：

    Page.navigate
    request: {
        "id": <number>,
        "method": "Page.navigate",
        "params": {
            "url": <string>
        }
    }
    response: {
        "id": <number>,
        "error": <object>
    }
执行Page.navigate操作，需要参数url，id可以随意指定，不过要确认全局的唯一性，因为需要通过id关联request和response。

event结构如下：

    Page.loadEventFired
    {
        "method": "Page.loadEventFired",
        "params": {
        "timestamp": <number>
        }
    }
Page domain派发loadEventFired事件结构数据(通过websocket的onmessage获取)，并包含参数timestamp

type结构如下：

    Frame: object
        id ( string )
            Frame unique identifier.
        loaderId ( Network.LoaderId )
            Identifier of the loader associated with this frame.
        mimeType ( string )
            Frame document's mimeType as determined by the browser.
        name ( optional string )
            Frame's name as specified in the tag.
        parentId ( optional string )
            Parent frame identifier.
        securityOrigin ( string )
            Frame document's security origin.
        url ( string )
            Frame document's URL.
Frame type为包含id,loaderId，mimeType,name,parentId,securityOrigin和url字段的Object数据类型,其中loaderId为另外一个定义在Network domain中的type

更多协议内容请猛戳[这里]('https://developer.chrome.com/devtools/docs/protocol/1.1/')

##远程调试协议实战
此协议用于server端和client端的通讯，所以需要先建立server端，然后client端通过协议连接到server端

###开启server服务
打开浏览器的远程调试支持，并指定端口号：

    ./chrome --remote-debugging-port=9222

./chrome为已安装的chrome可执行程序

###获取server地址

在浏览器中直接输入：

    http://localhost:9222/json

获取所有的tabs信息，数据格式如下：

    [
        {},
        {},
        {}
    ]

每个{}的内容如下：

    {
        description: "",
        devtoolsFrontendUrl: "/devtools/devtools.html?ws=localhost:9222/devtools/page/A12A4B08-E5AF-4A84-A86A-A1C86E731D7F",
        faviconUrl: "http://www.baidu.com/favicon.ico",
        id: "A12A4B08-E5AF-4A84-A86A-A1C86E731D7F",
        thumbnailUrl: "/thumb/A12A4B08-E5AF-4A84-A86A-A1C86E731D7F",
        title: "百度一下，你就知道",
        type: "page",
        url: "http://www.baidu.com/",
        webSocketDebuggerUrl: "ws://localhost:9222/devtools/page/A12A4B08-E5AF-4A84-A86A-A1C86E731D7F"
    }

websocket server端地址：

    webSocketDebuggerUrl: "ws://localhost:9222/devtools/page/A12A4B08-E5AF-4A84-A86A-A1C86E731D7F"

###建立连接

在任意地址栏中输入http://localhost:9222 + devtoolsFrontendUrl值即可(等同于在当前页面直接打开DevTools)：

    http://localhost:9222/devtools/devtools.html?ws=localhost:9222/devtools/page/A12A4B08-E5AF-4A84-A86A-A1C86E731D7F"

或直接使用websocket连接，使用webSocketDebuggerUrl值连接：

    var ws = new WebSocket('ws://localhost:9222/devtools/page/A12A4B08-E5AF-4A84-A86A-A1C86E731D7F"');

注意：
    每次只能进行一次websocket连接，之后的连接都会失败

###调用Command
websocket通道建立完成之后，通过如下方式进行调用：

    打开指定页面，并进行事件监听(以Page.loadEventFired为例):
    ws.onmessage = function(event){
        console.log(event.data);
    };
    ws.send('{"id":1,"method":"Page.navigate","params":{"url":"http://www.baidu.com"}}')

    获取到的loadEventFired事件数据如下：
    {"method":"Page.loadEventFired","params":{"timestamp":1402317772.874949}}

###更多连接方式

####nodejs ws

非常轻量级的websocket库，支持client端和server端，使用方式基本同HTML5的标准websocket库

client示例：

    var WebSocket = require('ws');
    var ws = new WebSocket('ws://www.host.com/path');
    ws.on('open', function() {
        ws.send('something');
    });
    ws.on('message', function(data, flags) {
        // flags.binary will be set if a binary data is received
        // flags.masked will be set if the data was masked
    });

server示例：

    var WebSocketServer = require('ws').Server
      , wss = new WebSocketServer({port: 8080});
    wss.on('connection', function(ws) {
        ws.on('message', function(message) {
            console.log('received: %s', message);
        });
        ws.send('something');
    });

请移步：[官方ws库]('https://github.com/einaros/ws')


####nodejs chrome-remote-interface

一个实现了remote debugging protocol的nodejs库，其中websocket使用的是ws库，使用方便，推荐使用

示例代码：

    var Chrome = require('chrome-remote-interface');
    Chrome(function (chrome) {
        with( chrome ){
            on('Page.loadEventFired', function(time){
                send('Runtime.evaluate',{'expression':'chrome.loadTimes()',returnByValue:true},function(err,result){
                				//console.log(err, result );
                });
            });
            Page.enable();
            Page.navigate({'url': 'http://www.baidu.com'});
        }
    });

请移步：[官方chrome-remote-interface]('https://github.com/cyrus-and/chrome-remote-interface')


####nodejs socket.io

功能强大，支持集成websocket服务器端和Express3框架与一身，使用简单，有兴趣者请异步：[官方socket.io]('http://socket.io/')

##websocket

###协议

它是HTML5一种新的协议，实现了浏览器与服务器全双工通信，只需要一个握手动作，浏览器和服务器之间就形成了一个快速通道，然后进行数据互传。

优点：

    1、交互时的header只有约2Bytes
    2、服务端可以主动推送数据给客户端

header格式（握手时）：

    request:

    Cache-Control:no-cache
    Connection:Upgrade
    Host:localhost:9222
    Origin:http://family.baidu.com
    Pragma:no-cache
    Sec-WebSocket-Extensions:permessage-deflate; client_max_window_bits, x-webkit-deflate-frame
    Sec-WebSocket-Key:TKSQVug6zSIH4uzIyTYBcg==
    Sec-WebSocket-Version:13
    Upgrade:websocket
    User-Agent:Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1914.0 Safari/537.36

    response:

    Connection:Upgrade
    Sec-WebSocket-Accept:HyjfMUpyYgWgkYLn/vDDf6rZLuk=
    Upgrade:WebSocket

header格式（交互时）：

    request:

    User-Agent: Fiddler
    Content-Type: application/json; charset=utf-8
    Host: fakewebsocket
    Content-Length: 211

    response:

    FiddlerTemplate: True
    Date: Fri, 25 Jan 2013 16:49:29 GMT
    Content-Length: 51

###查看websocket连接

####DevTools

直接使用DevTools，在控制台建立websocket连接并交互，在Network面板中直接显示

![fiddler](/img/remote-debugging-protocol/websockets-dev-tools.png)

####fiddler

自定义fiddler的规则，根据websocket特征提取信息并伪造websocket结构数据

因为伪造时，host为fakewebsocket，无法识别，所以通过AutoResponder伪造respose数据

请移步：[Debug / Inspect WebSocket traffic with Fiddler](http://www.codeproject.com/Articles/718660/Debug-Inspect-WebSocket-traffic-with-Fiddler)


###更多参考
websocket的原理及使用方法可参考阮一峰的新作:[《JavaScript 标准参考教程（alpha）》]('http://javascript.ruanyifeng.com/bom/websocket.html')

数据格式相关内容可参考:[Real-time data exchange in HTML5 with WebSockets]('http://www.adobe.com/devnet/html5/articles/real-time-data-exchange-in-html5-with-websockets.html')

具体的协议格式参考:[官方]('http://tools.ietf.org/html/draft-hixie-thewebsocketprotocol-76')

