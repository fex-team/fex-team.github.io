---
layout: post
title: 跨端组件实践 - 移动时代的前端
author: zswang
---
跨端组件实践 - 移动时代的前端
====

上周六在 [QCon](http://www.qconbeijing.com/node/535) 分享了这个主题，说好的要有文档……

## 背景


### 唯一不变的就是变化

从业十多年，互联网的变化非常大：最初使用的电脑只有 8M 内存、32M 硬盘，现在口袋里装的手机已经是 2G 内存、16G 闪存，网络也从 56K 变成了 1.5M+。这个时代的人是幸福的……

这个期间也见证了 Web 时代的繁荣，从 C/S 走到 B/S。

现在无论是邮件、购物还是游戏、社交、工作等等，在电脑上都能找到满意的 Web 应用或站点。

> * 购物：淘宝、京东、当当、苏宁易购 [@民工精髓V](http://weibo.com/sharpmaster)
> * 社交：[贴吧](http://tieba.baidu.com)、[微博](http://weibo.com/)
> * 游戏：各种页游、我常玩的是 [Web 红警](https://alliances.commandandconquer.com/)
> * 办公：[脑图](http://naotu.baidu.com/)、[流程图](http://www.processon.com/)、[日程安排](http://today.ai/)、[Github](https://github.com/)、[邮件](https://mail.google.com)

可是这种景象在移动时代并没有看到。

现场小调查：请问你在手机上和 PC 上用什么方式刷微博？

> * 大部分的人不会在 PC 上用客户端刷微博
> * 大部分的人不会在手机上用浏览器刷微博

结论符合预期，先从变化上分析问题

### 移动互联网发生了什么变化？

屏幕更小

* 显示区更宝贵，广告区更难摆放
* 页面布局更讲究，内容主次更为重要

随身携带

* 24 小时待机
* 根据地理位置提供更精准的服务

触摸操作

* 双手很难并行
* 虚拟键盘没有物理键盘便捷

更丰富的内置设备

* 前后置摄像头 / 闪关灯
* 麦克风 / 扬声器
* 振动器，静音状态也可以知道有消息到达
* [电子指南针](http://baike.baidu.com/view/154967.htm) / 陀螺仪
* 蓝牙 / WiFi / [NFC](http://baike.baidu.com/subview/917495/5282340.htm)

离线使用场景

* 在没有信号
* 资费不足

没有持久能源

* 电池需要充电
* 计算能力和待机时间冲突

设备碎片化
* 特别是 [Android](http://baike.baidu.com/subview/1241829/9322617.htm) 各种屏幕尺寸、各种 [ROM](http://baike.baidu.com/view/7047904.htm)

移动互联网的变化带来了新的机遇和挑战

### 机遇

移动市场高速增长

>艾瑞咨询数据显示，2013 年中国移动互联网市场规模达到 `1059.8` 亿元，同比增速 `81.2%`， 预计到 2017 年，市场规模将增长约 `4.5` 倍，接近 `6000` 亿。移动互联正在深刻影响人们的日常生活，移动互联网市场进入高速发展通道。[【查看来源】](http://www.techweb.com.cn/data/2014-01-20/1383076.shtml)

### 挑战

HTML5 / CSS3 技术在移动端受限

What stops developers from using HTML5？[【查看来源】](http://www.visionmobile.com/blog/2013/12/html5-performance-is-fine-what-we-are-missing-is-tools/)

![性能测试](/img/light-component/webapp-issue.png)

>为什么开发者不选择 HTML5 构建移动应用？
>前三个原因是：

> * 性能问题，流畅度与 Native 差距较大
> * 硬件接口缺失，不能控制蓝牙、闪关灯、振动、WiFi、[NFC](http://baike.baidu.com/subview/917495/5282340.htm) 等等
> * 难以集成本地元素，不能使用桌面图标、订阅推送等

这是我们用主流的机型做的性能测试

![性能测试](/img/light-component/native-vs-web.png)

不难看出 Native 和 Web 的性能依旧差距很大，包括主流韩国和国产机型。

人眼刷新率平均是 24 帧 / 秒，低于这个值用户就会感觉到跳帧。

当然这些问题在 PC 时代也碰到过！那时是怎么解决的？

### 影响前端的技术

通过浏览器扩展本地能力

* 使用 [ActiveX](http://baike.baidu.com/view/28141.htm) / [NPAPI](http://zh.wikipedia.org/wiki/NPAPI) 技术
* 最经典的插件就是 Flash，虽然它已经淡出了移动时代

JavaScript Engine 进化

* V8 出现后，JavaScript 的性能提升了数倍
* 结合高性能的引擎 NodeJS 也使 JavaScript 在后端获得了新生

[HTML5](http://baike.baidu.com/view/951383.htm) / CSS3

* 扩展了本地能力，如地理定位、录音录像、本地存储等

但这些影响在移动端是有限的

### 移动时代前端的现状

Flash 不能使用

> [Adobe 将停止开发移动版 Flash](http://www.cnbeta.com/articles/161452.htm)

NPAPI 即将退役

>Google 今年开始屏蔽 NPAPI 插件[【查看来源】](http://techcrunch.cn/2013/09/24/say-goodbye-to-npapi/)

> * Google 网络商店不会再接受任何包含基于 NPAPI 插件的新应用或拓展。
> * 对于需要 NPAPI 替代品的开发者，Google 推荐转向 [NaCl](https://developers.google.com/native-client/)、[Apps](http://developer.chrome.com/apps/)、[原生消息 API](http://developer.chrome.com/extensions/messaging.html#native-messaging) 和[旧版浏览器支持](https://support.google.com/chrome/a/answer/3019558)。

浏览器插件可以扩展本地能力的同时，也会带来稳定性和安全性的问题。

### 怎么解决性能瓶颈和本地能力缺失的问题？

JS Binding，通过 JavaScript 直接调用 Native API

* 从 iOS7 开始，可以使用 [JavaScriptCore](https://developer.apple.com/library/mac/documentation/Carbon/Reference/WebKit_JavaScriptCore_Ref/_index.html) 接口
* 常见的框架和技术
    * [Cocos2D](http://www.cocos2d-x.org/)
    * [Ejecta](http://impactjs.com/ejecta)
    * [CoconJS](https://www.ludei.com/)
    * [Node.app](http://nodeapp.org/)

JS Translate，通过编译器将 JavaScript 翻译成 Native 语言

* 如号称上帝语言的 [haXe](http://haxe.org/) 可以翻译成 Java、JavaScript、C++、PHP 的语言

Native App，直接使用 Native 技术，从头再来

* 广义的前端就是要面向用户界面和交互
* 前端技术也有向全端和全栈的发展趋势

> 选择手游创业的 [@大城小胖](http://weibo.com/finscn) 近期做了一个教学视频，专门介绍 JSBinding 大家可以参考：[When iOS loves JS](http://www.imooc.com/view/92)

> * PC 时代 JSBinding 可以用 [MSScriptControl](http://t.cn/8suz2Q0)

以上技术可以解决问题，但不能发挥 Web 自然跨端、迭代方便（不同等待漫长的上架时间）的优势

我们还得寻找一些适合自己的方案。

### Hybrid 混合应用方案

本地服务，网页通过 HTTP / [WebSocket](http://baike.baidu.com/view/3623887.htm) 与本地服务通信，使用本地能力

![本地服务](/img/light-component/local-service.png)

* 在 Android 里写一个不难，参考 [NanoHttpd](http://nanohttpd.com/) DIY 一个移动版的 HTTP 服务
	* 优势：能够无缝兼容所有浏览器
	* 劣势：通信容易被嗅探和伪造；很难利用 UI 组件

加壳，这是最常用的技术

![加壳](/img/light-component/shell.png)

* 有较成熟的框架可以使用，如：[Cordova](http://cordova.apache.org/)
* 通过使用和扩展插件，获得本地能力
	
> Google 也有投入 Cordova 的项目 [Chrome apps on Android and iOS](https://github.com/MobileChromeApps/mobile-chrome-apps)

本地服务和加壳方式，都能访问本地能力。但后者本地能力在同一个进程里调度，安全性和便利性相对要高。

### 回到主题，什么是跨端组件？

自动响应端能力的组件

![跨端组件示意](/img/light-component/light-component-ui.png)

* 受到[响应式网页设计](http://baike.baidu.com/view/9876268.htm)理念的启发，界面布局可以根据运行环境自动响应和调整，那么本地能力也可以这样
* 如在普通浏览器里使用 HTML5 / CSS3 构造组件，在提供本地能力的环境里使用 Native View 构造组件。
* 在提供本地能力的环境里，界面会更流畅；在没有本地能力的环境里应用是完整的。

跨端组件解决的问题：

* 满足 UI 需要局部流畅的需求
* 满足运行在各种环境的需求

特点

* 同一套 API
* 更好地使用运行环境提供的能力

> PC 时代也有这样的组件，如：[Raphaël](http://raphaeljs.com/) 一款矢量图组件，在具 VML 的环境里使用 VML，其他环境里使用 SVG，并保持同一套 API。发散一想：[jQuery](http://jquery.com)、[WebUploader](https://github.com/fex-team/webuploader)（适配 Flash 和 HTML5）也都是自动响应各种运行环境。

成本总是伴随着收益，解决老问题就会带来新的问题

当页面发生滚动时，Native View 怎么和网页元素一起滚动？还有 [Reflow](http://www-archive.mozilla.org/newlayout/doc/reflow.html) 时怎么调整 Native View 的位置?

### UI 融合的问题

滚动的问题在 Android 中处理比较方便。因为 WebView 继承至：ViewGroup / [AbsoluteLayout](http://developer.android.com/reference/android/widget/AbsoluteLayout.html)，我们只需要将 WebView 作为 Native View 的容器就可以搞定这个问题。

Reflow 发生的频率不高，就用了定时器这种简单粗暴的方法

### 跨端组件研发的步骤

#### 确定需求

##### 哪些组件适合做跨端组件？

计算量大，需要流畅

* 图册浏览
* 地图
* 多媒体播放器
* 3D渲染
* 图像识别，二维码识别、手势识别

减少操作步骤，省去授权

* 录像、录音

HTML5能力增强

* 地理定位增强，结合 WiFi
* Canvas 性能增强（参考：[FastCanvas](https://github.com/phonegap/phonegap-plugin-fast-canvas)）

#### 开发环境

+ Android / [ANT](http://developer.android.com/tools/building/building-cmdline.html)、iOS 环境搭建
+ 安装 [NPM](https://www.npmjs.org/)
+ 安装 Cordova 参考：[命令行文档](http://cordova.apache.org/docs/en/edge/guide_cli_index.md.html)

> 天朝的网络大家知道的，主要找一些代理和镜像

#### 设计 API

发现很多前端团队都开始使用和关注 [Web Components](http://www.w3.org/TR/components-intro/)

在跨端组件的落地上，我们也选择这种方式来提供 API，原因是：

* 降低学习成本，保留原生 Web 组件的使用方式
* 降低业务代码维护工作

> 目前移动端原生还不支持这个标准，还得选用框架适配，如：[Polymer](http://www.polymer-project.org)

跨端组件 HTML5 示例代码：

```html
<body>
	<div id="mapBox">
		<light-map width="350" height="400" center="116.404,39.915" zoom="11"></light-map>
	</div>
</body>
```

将组件的HTML部分放到需要显示的位置，然后就和普通的Element一样使用：

* `var lightMap = document.querySelector('light-map');` 可以通过 DOM 树操作
* `lightMap.addEventLister()` 添加事件
* `lightMap.setAttribute()、lightMap.getAttribute()` 设置属性

#### 组件开发

Cordova Plugin 开发

plugin.xml 配置需要的权限、JavaScript 命名空间、文件对应的工程目录等待。细节请参考[官方文档](http://docs.phonegap.com/en/3.0.0/plugin_ref_spec.md.html)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<plugin xmlns="http://apache.org/cordova/ns/plugins/1.0"
      id="com.baidu.light.flashlight"
      version="0.2.7">
    <name>Flashlight</name>
    <description>Cordova Flashlight Plugin</description>
    <license>Apache 2.0</license>
    <keywords>cordova,battery</keywords>
    <repo>https://github.com/zswang/light-flashlight.git</repo>
    <issue>https://github.com/zswang/light-flashlight/issue</issue>

    <js-module src="www/flashlight.js" name="flashlight">
        <clobbers target="light.flashlight" />
    </js-module>
    <!-- android -->
    <platform name="android">
        <config-file target="res/xml/config.xml" parent="/*">
            <feature name="Flashlight" >
                <param name="android-package" value="com.baidu.light.flashlight.Flashlight"/>
            </feature>
        </config-file>
        
        <config-file target="AndroidManifest.xml" parent="/*">
            <uses-permission android:name="android.permission.CAMERA" />
            <uses-permission android:name="android.permission.FLASHLIGHT" />
        </config-file>

        <source-file src="src/android/Flashlight.java" target-dir="src/com/baidu/light/flashlight" />
    </platform>
</plugin>
```

我就自己写一个[闪光灯插件](https://github.com/zswang/light-flashlight) 实现非常简单，供大家参考

* JavaScript 关键部分

```javascript
var cordova = require('cordova'),
    exec = require('cordova/exec');

var flashlight = flashlight || {};

function torch(successCallback, errorCallback) {
  	exec(successCallback, errorCallback, 'Flashlight', 'torch', []); // 调用 Native 的提供的方法，指定回调、Native 对应的类名和动作
};

flashlight.torch = torch;
module.exports = flashlight;
```

* Android 关键部分

```java
public class Flashlight extends CordovaPlugin {
	private Camera mCamera;
	public boolean execute(String action, JSONArray args,
			CallbackContext callbackContext) throws JSONException {
		if (mCamera == null) {
			mCamera = Camera.open();
		}
		if ("torch".equals(action)) { // 打开手电的动作
			Parameters parameters = mCamera.getParameters();
			parameters.setFlashMode(Parameters.FLASH_MODE_TORCH);
			mCamera.setParameters(parameters); 
			callbackContext.success(null); // 回调 JavaScript
		} else {
			return false;
		}
		return true;
	}
}

```

百度地图 提供了 Android、JS、iOS 三个版本，正好适合用来做[地图跨端组件](https://github.com/zswang/light-map)

* 地图跨度组件 Cordova Plugin JavaScript 部分

```javascript
var cordova = require('cordova'),
    exec = require('cordova/exec');

var baidumap = baidumap || {};

/**
 * 初始化
 * @param{Object} options 配置项，显示位置
 * @param{Function} callback 回调
 */
function init(options, callback) {
	exec(callback, function() {
	}, 'BaiduMap', 'init', [options]);
};

baidumap.init = init;

module.exports = baidumap;
```

* 地图跨度组件 Cordova Plugin Android 部分

```java
public class BaiduMap extends CordovaPlugin {
	private CallbackContext mCallbackContext = null;

	@SuppressWarnings("unchecked")
	public boolean execute(String action, JSONArray args,
			CallbackContext callbackContext) throws JSONException {
		if ("init".equals(action)) {
			if (args == null) {
				return false;
			}

			JSONObject params = args.optJSONObject(0);
			JSONArray center = params.optJSONArray("center");
			// Native View 在页面中的显示区域
			int left = params.optInt("left");
			int top = params.optInt("top");
			int width = params.optInt("width");
			int height = params.optInt("height");
			String guid = params.optString("id");
			int zoom = params.optInt("zoom");
			createMap(guid, left, top, width, height,
					(float) center.optDouble(0), (float) center.optDouble(1),
					zoom);
			mCallbackContext = callbackContext;

		}
		return true;
	}

	private static Handler mHandler = new Handler(Looper.getMainLooper());
	private static Hashtable<String, MapView> mMaps = new Hashtable<String, MapView>();

	public void initialize(CordovaInterface cordova, CordovaWebView webView) {
		super.initialize(cordova, webView);
		// 初始化百度地图 Android 版本
		BMapManager baiduMapManager = new BMapManager(webView.getContext()
				.getApplicationContext());
		baiduMapManager.init(new MKGeneralListener() {
			@Override
			public void onGetNetworkState(int state) {
			}

			@Override
			public void onGetPermissionState(int state) {
			}
		});
	}

	public void createMap(String guid, int left, int top, int width,
			int height, float lng, float lat, int zoom) {
		mHandler.post(new Runnable() { // 注意 JavaScript 调用 Native 会在子线程，如果操作 UI 需放到 主线程中
			private String mGuid;
			private int mLeft;
			private int mTop;
			private int mWidth;
			private int mHeight;
			private float mLng;
			private float mLat;
			private int mZoom;

			public Runnable config(String guid, int left, int top, int width,
					int height, float lng, float lat, int zoom) {
				mGuid = guid;
				mLeft = left;
				mTop = top;
				mHeight = height;
				mWidth = width;
				mLng = lng;
				mLat = lat;
				mZoom = zoom;
				return this;
			}

			@SuppressWarnings("deprecation")
			@Override
			public void run() {
				MapView mapView = new MapView(BaiduMap.this.webView
						.getContext());
				MapController mapController = mapView.getController();
				GeoPoint point = new GeoPoint((int) (mLat * 1E6),
						(int) (mLng * 1E6));
				mapController.setCenter(point);
				mapController.setZoom(mZoom);

				float scale = BaiduMap.this.webView.getScale();

				LayoutParams params = new LayoutParams((int) (mWidth * scale),
						(int) (mHeight * scale), (int) (mLeft * scale),
						(int) (mTop * scale));
				mapView.setLayoutParams(params);
				BaiduMap.this.webView.addView(mapView); // 大家注意这一句，将 Native View 添加在 WebView 上，自然就响应页面滚动

				mMaps.put(mGuid, mapView);
			}

		}.config(guid, left, top, width, height, lng, lat, zoom));
	}
}
```

* Web Component，注意适配 runtime 环境

```javascript
void function() {
	var instances = {};
	var guid = 0;

	var LightMapPrototype = Object.create(HTMLDivElement.prototype);
	LightMapPrototype.createdCallback = function() {
		var self = this;
		var div = document.createElement('div');
		var zoom = 11;
		var center = [ 116.404, 39.915 ];
		this.setZoom = function(value) {
			zoom = value;
			map.setZoom(zoom);
		};
		this.setCenter = function(value) {
			center = String(value).split(',');
			map.setCenter(new BMap.Point(center[0], center[1]));
		};

		div.style.width = (this.getAttribute('width') || '300') + 'px';
		div.style.height = (this.getAttribute('height') || '300') + 'px';
		this.appendChild(div);

		// 判断当前的运行环境
		var runtime = (typeof cordova != 'undefined')
				&& (typeof light != 'undefined') // 有可能插件没有安装或者当前版本不支持
				&& (typeof light.map != 'undefined') ? 'cordova' : 'browser';

		var map;
		switch (runtime) {
		case 'cordova':
			var obj = div.getBoundingClientRect()
			light.map.init({
				guid : guid,
				center : center,
				zoom : zoom,
				left : obj.left + window.pageXOffset,
				top : obj.top + window.pageYOffset,
				width : Math.round(obj.width),
				height : Math.round(obj.height)
			});

			instances[guid] = this;
			guid++;
			break;
		case 'browser':
			map = new BMap.Map(div); // 创建Map实例
			map.enableScrollWheelZoom(); // 启用滚轮放大缩小
			map.addControl(new BMap.ScaleControl()); // 添加比例尺控件
			map.addControl(new BMap.OverviewMapControl()); // 添加缩略地图控件
			map.centerAndZoom(new BMap.Point(center[0], center[1]), zoom); // 初始化地图,设置中心点坐标和地图级别

			map.addEventListener('moveend', function() {
				var value = map.getCenter();
				center = [ value.lng, value.lat ];
				self.setAttribute('center', center);
				var e = document.createEvent('Event');
				e.initEvent('moveend', true, true);
				self.dispatchEvent(e);
			});
			map.addEventListener('zoomend', function() {
				var value = map.getZoom();
				zoom = value;
				self.setAttribute('zoom', zoom);
				var e = document.createEvent('Event');
				e.initEvent('zoomend', true, true);
				self.dispatchEvent(e);
			});

			break;
		}
		this.map = map;
	};
	LightMapPrototype.attributeChangedCallback = function(attributeName,
			oldValue, newValue) {
		var self = this;
		switch (attributeName) {
		case 'center':
			self.setCenter(newValue);
			break;
		case 'zoom':
			self.setZoom(newValue);
			break;
		default:
			return false;
		}
		return true;
	};
	document.registerElement = document.registerElement || document.register;
	function init() {
		var LightMap = document.registerElement('light-map', {
			prototype : LightMapPrototype
		});
	}
	if (typeof cordova != 'undefined') {
		document.addEventListener('deviceready', init, false); // 等待设备初始化完成
	} else {
		init();
	}
}();
```

#### 调试

[Ripple](http://ripple.incubator.apache.org/)

*  这是一款能在浏览器里模拟移动设备的调试工具，包括模拟 GPS、陀螺仪 等本地能力

[Weinre](http://people.apache.org/~pmuellr/weinre/)

* 能够在 Chrome 开发者工具里，远程调试的工具
* 优势：适用各种设备和浏览器
* 不足：加载之前的状态不能获知、不能断点调试

[Remote Debug](https://developers.google.com/chrome-developer-tools/docs/remote-debugging)

* iOS 6 和 Android 4.4 开始，可以原生适用 Remote Debug
* Android 4.4 不仅能打断点，而且还能映射 Web UI （Chrome dev 版本才支持）。

另外大家在移动端还用过啥 NB 的调试工具，欢迎留言推荐

#### 安全考虑

用户主动操作才开启重要功能

* 类似 Flash 里访问剪贴板，需要用户主动 Click 才可以访问
* 相比弹出个小黄条让用户授权，这种设计体验要好很多

明确提示状态

* 如：录音和录像时，有明确的状态显示

### 参考资料

[本期分享 QCon 链接](http://www.qconbeijing.com/node/535)
[艾瑞：2013中国移动互联网市场规模1059亿](http://www.techweb.com.cn/data/2014-01-20/1383076.shtml)
[HTML5 performance is fine, what we are missing is tools](http://www.visionmobile.com/blog/2013/12/html5-performance-is-fine-what-we-are-missing-is-tools/)
[Adobe 将停止开发移动版 Flash](http://www.cnbeta.com/articles/161452.htm)
[Google将于2014年1月开始屏蔽NPAPI插件](http://techcrunch.cn/2013/09/24/say-goodbye-to-npapi/)
[When iOS loves JS](http://www.imooc.com/view/92)
[Chrome apps on Android and iOS](https://github.com/MobileChromeApps/mobile-chrome-apps)
[响应式网页设计](http://baike.baidu.com/view/9876268.htm)
[Web Components](http://www.w3.org/TR/components-intro/)
[Polymer](http://www.polymer-project.org)
[Ripple](http://ripple.incubator.apache.org/)
[Weinre](http://people.apache.org/~pmuellr/weinre/)
[Remote Debug](https://developers.google.com/chrome-developer-tools/docs/remote-debugging)
[How to use Ripple Emulator for Windows to test PhoneGap application?](http://stackoverflow.com/questions/17695875/how-to-use-ripple-emulator-for-windows-to-test-phonegap-application)
