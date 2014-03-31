void function(e,t){function n(e){var n=ut.get("alias")||{},r=n[e]||e+".js";if(!it[r]){it[r]=!0;var i="script",a=t.createElement(i),o=t.getElementsByTagName(i)[0];a.asyn=1,a.src=r,o.parentNode.insertBefore(a,o)}}function r(e){if(!e[g]){for(var t=!0,r=[],a=e[D],o=0;a&&o<a[y];o++){var f=a[o],s=st[f]=st[f]||{};s[g]||s==e?r[L](s[P]):(t=!1,s[E]||n(f),s[x]=s[x]||{},s[x][e[b]]=e)}t&&(e[g]=!0,e[k]&&(e[P]=e[k][j](e,r)),i(e))}}function i(e){for(var t in e[x])r(e[x][t])}function a(e){return(e||new Date)-tt}function o(e,t,n){if(e){typeof e==R&&(n=t,t=e,e=at);try{if(e==at)return ot[t]=ot[t]||[],ot[t].unshift(n),void 0;e[N]?e[N](t,n,!1):e[m]&&e[m](J+t,n)}catch(r){}}}function f(e,t,n){if(e){typeof e==R&&(n=t,t=e,e=at);try{if(e==at){var r=ot[t];if(!r)return;for(var i=r[y];i--;)r[i]===n&&r.splice(i,1);return}e[U]?e[U](t,n,!1):e[C]&&e[C](J+t,n)}catch(a){}}}function s(e){var t=ot[e],n=0;if(t){for(var r=[],i=arguments,a=1;a<i[y];a++)r[L](i[a]);for(var a=t[y];a--;)t[a][j](this,r)&&n++;return n}}function u(e,t){if(e&&t){var n=new Image(1,1),r=[],i="img_"+ +new Date;for(var a in t)t[a]&&r[L](a+"="+encodeURIComponent(t[a]));at[i]=n,n[I]=n[O]=function(){at[i]=n=n[I]=n[O]=null,delete at[i]},n.src=e+(e.indexOf("?")<0?"?":"&")+r.join("&")}}function c(e,t){if(!e)return t;var n={};for(var r in t)null!==e[r]&&(n[e[r]||r]=t[r]);return n}function v(){var e=arguments,t=e[0];if(this[V]||/^(on|un|set|get|create)$/.test(t)){for(var n=h[$][t],r=[],i=1,a=e[y];a>i;i++)r[L](e[i]);typeof n==G&&n[j](this,r)}else this[B][L](e)}function l(e,t){var n={};for(var r in e)e[S](r)&&(n[r]=e[r]);for(var r in t)t[S](r)&&(n[r]=t[r]);return n}function h(e){this[b]=e,this[T]={protocolParameter:{postUrl:null,protocolParameter:null}},this[B]=[],this[A]=at}function p(e){var t;if(e=e||"default","*"==e){t=[];for(var n in ft)t[L](ft[n]);return t}var r=ft[e];return r||(r=ft[e]=new h(e)),r}function d(){if(!(et&&new Date-Y<50||Z)){Z=!0;var e=0;for(var t in ft){var n=ft[t];n[V]&&(e+=n[_](Q))}if(e)for(var r=new Date;new Date-r<100;);}}var g="defined",m="attachEvent",w="toString",y="length",b="name",D="requires",k="creator",E="defining",j="apply",q="tracker",L="push",P="instance",x="waiting",N="addEventListener",U="removeEventListener",C="detachEvent",I="onload",O="onerror",V="created",$="prototype",B="argsList",S="hasOwnProperty",T="fields",_="fire",A="alog",F="define",M="require",R="string",z="object",G="function",H="send",J="on",K="protocolParameter",Q="unload",W=e.alogObjectName||A,X=e[W];if(!X||!X[g]){var Y,Z,et=t.all&&e[m],tt=X&&X.l||+new Date,nt=e.logId||(+new Date)[w](36)+Math.random()[w](36).substr(2,3),rt=0,it={},at=function(e){var t,n,i,a,o=arguments;if(e==F||e==M){for(var f=1;f<o[y];f++)switch(typeof o[f]){case R:t=o[f];break;case z:i=o[f];break;case G:a=o[f]}return e==M&&(t&&!i&&(i=[t]),t=null),t=t?t:"#"+rt++,n=st[t]=st[t]||{},n[g]||(n[b]=t,n[D]=i,n[k]=a,e==F&&(n[E]=!0),r(n)),void 0}return typeof e==G?(e(at),void 0):(String(e).replace(/^(?:([\w$_]+)\.)?(\w+)$/,function(e,t,n){o[0]=n,v[j](at[q](t),o)}),void 0)},ot={},ft={},st={alog:{name:A,defined:!0,instance:at}};h[$].create=function(e){if(!this[V]){typeof e==z&&this.set(e),this[V]=new Date,this[_]("create",this);for(var t;t=this[B].shift();)v[j](this,t)}},h[$][H]=function(e,t){var n=l({ts:a()[w](36),t:e,sid:nt},this[T]);if(typeof t==z)n=l(n,t);else{var r=arguments;switch(e){case"pageview":r[1]&&(n.page=r[1]),r[2]&&(n.title=r[2]);break;case"event":r[1]&&(n.eventCategory=r[1]),r[2]&&(n.eventAction=r[2]),r[3]&&(n.eventLabel=r[3]),r[4]&&(n.eventValue=r[4]);break;case"timing":r[1]&&(n.timingCategory=r[1]),r[2]&&(n.timingVar=r[2]),r[3]&&(n.timingValue=r[3]),r[4]&&(n.timingLabel=r[4]);break;case"exception":r[1]&&(n.exDescription=r[1]),r[2]&&(n.exFatal=r[2]);break;default:return}}this[_](H,n),u(this[T].postUrl,c(this[T][K],n))},h[$].set=function(e,t){if(typeof e==R)e==K&&(t=l({postUrl:null,protocolParameter:null},t)),this[T][e]=t;else if(typeof e==z)for(var n in e)this.set(n,e[n])},h[$].get=function(e,t){var n=this[T][e];return typeof t==G&&t(n),n},h[$][_]=function(e){for(var t=[this[b]+"."+e],n=arguments,r=1;r<n[y];r++)t[L](n[r]);return s[j](this,t)},h[$][J]=function(e,t){at[J](this[b]+"."+e,t)},h[$].un=function(e,t){at.un(this[b]+"."+e,t)},at[b]=A,at.sid=nt,at[g]=!0,at.timestamp=a,at.un=f,at[J]=o,at[_]=s,at[q]=p,at("init");var ut=p();if(ut.set(K,{modules:null}),X){var ct=[].concat(X.p||[],X.q||[]);X.p=X.q=null;for(var vt in at)at[S](vt)&&(X[vt]=at[vt]);at.p=at.q={push:function(e){at[j](at,e)}};for(var lt=0;lt<ct[y];lt++)at[j](at,ct[lt])}e[W]=at,et&&o(t,"mouseup",function(e){var t=e.target||e.srcElement;1==t.nodeType&&/^ajavascript:/i.test(t.tagName+t.href)&&(Y=new Date)}),o(e,"beforeunload",d),o(e,Q,d)}}(window,document);;alog('define', 'elements', function(){

    var exports = {};
    // 压缩代码相关
    /* compressor */

    /**
     * ALog
     * @description 前端统计框架，元素模块
     * @see http://fe.baidu.com/doc/uxrp/hunter/alog.text http://fe.baidu.com/doc/fis/dev/research/fe-log/work-state/platform-Hunter.text
     * @author 王集鹄(wangjihu,http://weibo.com/zswang),张军(zhangjun08,http://weibo.com/zhangjunah),梁东杰(liangdongjie,http://weibo.com/nedj)
     * @version 1.0
     * @copyright www.baidu.com
     * @profile
基本接口
    方法
        getPath(element, root, isshort)
        getXPath(element[, root])
        ax(Element, name, upward[, resultObject])
        ep(element, pos)
        ps()
        vr()
        getGroup(element, targets)
        getAction(element, targets)
        getExtra(element, targets)
        getText(element)
        getParam(element)
        getAlias(element)
    事件
        ongetattr(element, name) 获取元素属性时触发
     */
    var alog_tags,
        attrNames = { };

    /**
     * @description 初始化短路径字典。这样设计是为不使用则不开销内存
     */
    function initTags(){
        if (alog_tags) return;
        alog_tags = {};
        'AdivBliCaDulEdlFddGspanHtableIbodyJtrKsectionLtdMolNpOarticlePdtQformRimgSh3TinputUasideViWbXthYemZfont'
            .replace(/([A-Z])([a-z]+)/g, function(all, index, tagName){
                alog_tags[alog_tags[index] = tagName] = index;
            });
    }

    /**
     * @description 获取扩展属性
     * @function
     * @name ALog.ax()
     * @grammar ALog.ax(element, name, upward, targets)
     * @param{Element} element 元素对象
     * @param{String} name 属性名
     * @param{Boolean} upward 是否向遍历
     * @param{Object} targets 最后遍历的元素，可选项 默认undefined
     * @return{String} 返回对应的属性值
     */
    function attrExtension(element, name, upward, targets){
        if (!element || element.nodeType != 1) return '';
        var result;
        if (exports.ongetattr){
            result = exports.ongetattr(element, name);
        } else {
            // 直接element.getAttribute在ie6下document.documentElement.getAttribute抛异常
            if (/^\/.*\/$/.test(name)){ // 判断class中的属性
                var match = new RegExp(name.replace(/^\/|\/$/g, '')).exec(element.className);
                result = match && match[1];
            } else {
                result = 'undefined' != typeof element.getAttribute && element.getAttribute(name) || '';
                if ('#' == result){
                    result = '[id]';
                } else if ('.' == result){
                    result = '[class]';
                }
                result.replace(/\[([\w-_]+)\]/, function(all, attr){
                    result = element.getAttribute(attr);
                });
            }
        }
        targets && (targets['target'] = element);
        return result || (upward && attrExtension(element.parentNode, name, 1, targets)) || '';
    }
    exports.ax = attrExtension;

    /**
     * @description 获取元素路径
     * @function
     * @name ALog.getPath()
     * @grammar ALog.getPath(element, root, isshort)
     * @param{Element|String} element 元素对象 或 元素短路径
     * @param{Element} root 起始容器，默认为body
     * @param{Boolean} isshort 是否获取短路径
     * @return{String} 元素短路径
     */
    function getPath(element, root, isshort){
        isshort && initTags();
        root = root || document.body;
        if (!element || element == root || /^body$/i.test(element.tagName)) return '';
        if (element.nodeType != 1 || /^html$/i.test(element.tagName)){
            return element.tagName || '';
        }
        var alias = attrExtension(element, attrNames['alias']),
            count = 1,
            sibling = element.previousSibling,
            tagName = element.nodeName.toLowerCase();

        while (sibling){
            count += sibling.nodeName == element.nodeName;
            sibling = sibling.previousSibling;
        }
        alias = (isshort && alog_tags[tagName] || tagName) + 
            (count < 2 ? "" : count) + 
            (alias && '(' + alias + ')');
        return element.parentNode == root ?
            alias : 
            getPath(element.parentNode, root, isshort) + (/^[A-Z]/.test(alias) ? '' : '-') + alias;
    }
    exports.getPath = getPath;

    /**
     * @description 获取元素短路径，元素为body时返回空
     * @function
     * @name ALog.getXPath()
     * @grammar ALog.getXPath(element, root)
     * @param{Element} element 元素对象
     * [@param{Element} root] 起始容器，默认为body
     * @return{String} 返回元素短路径
     */
    function getXPath(element, root){
        return getPath(element, root, 1);
    }
    exports.getXPath = getXPath;

    /**
     * @description 获取当前元素大小
     * @param{Element} 元素
     */
    function getElementSize(element){
        var box = element.getBoundingClientRect();
        return [parseInt(box.right - box.left), parseInt(box.bottom - box.top)];
    }

    /**
     * @description 获取元素相对坐标
     * @function
     * @name ALog.elementPos()
     * @grammar ALog.elementPos(element, pos)
     * @param{Element} element 页面元素
     * @param{Array} pos 客户区坐标
     * @return{Array} 返回相对坐标（在元素区的比率）
     */
    function elementPos(element, pos){
        var box = element.getBoundingClientRect(),
            size = getElementSize(element);
        function fixed(number, length){
            return String(+Math.min(Math.max(number / length, 0), 1).toFixed(
                length < 36 ? 1 : (length < 351 ? 2 : 3))
            ).replace(/^0\./g, '.'); // 省去小数点前的"0"
        }
        return [
            fixed(pos[0] - box.left, size[0]),
            fixed(pos[1] - box.top, size[1])
        ];
    }
    exports.ep = elementPos;

    /**
     * @description 获取当前页面大小
     * @function
     * @name ALog.getPageSize()
     * @grammar ALog.getPageSize()
     * @return [pageWidth, pageHeight]
     */
    function getPageSize(){
        var doc_size = getElementSize(document.documentElement), 
            body_size = getElementSize(document.body);
        return [
            Math.max(doc_size[0], body_size[0], window.innerWidth || 0, document.documentElement.scrollWidth || 0),
            Math.max(doc_size[1], body_size[1], window.innerHeight || 0, document.documentElement.scrollHeight || 0)
        ];
    }
    exports.ps = getPageSize;
    
    /**
     * @description 获取当前可视区范围
     * @function
     * @name ALog.visibleRange()
     * @grammar ALog.visibleRange()
     * @return [visibleWidth, visibleHeight]
     */
    function visibleRange(){
        return [
            Math.max(
                document.documentElement.scrollLeft || 0,
                document.body.scrollLeft || 0,
                (document.defaultView && document.defaultView.pageXOffset) || 0
            ),
            Math.max(
                document.documentElement.scrollTop || 0,
                document.body.scrollTop || 0,
                (document.defaultView && document.defaultView.pageYOffset) || 0
            ),
            window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 0,
            window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0
        ];
    }
    exports.vr = visibleRange;

    /**
     * @description 自定义属性名 如果是正则字符串，则从class中读取
     * @function
     * @name ALog.an()
     * @grammar ALog.an(type, name)
     * @param{String} type 属性类型
     * @param{String} name 新支配的属性名称
     */
    function attributeName(type, name){
        attrNames[type] = name;
    }
    exports.an = attributeName;

    /**
     * @description 获取分组属性
     * @function
     * @name ALog.getGroup()
     * @grammar ALog.getGroup(element, targets)
     * @param{Element} element 元素对象
     * [@param{Object} targets] 返回最后找到的元素
     * @return{String} 返回分组属性值
     */
    /**
     * @description 获取行为属性
     * @function
     * @name ALog.getAction()
     * @grammar ALog.getAction(element, targets)
     * @param{Element} element 元素对象
     * [@param{Object} targets] 返回最后找到的元素
     * @return{String} 返回行为属性值
     */
    /**
     * @description 获取扩展分组属性
     * @function
     * @name ALog.getExtra()
     * @grammar ALog.getExtra(element, targets)
     * @param{Element} element 元素对象
     * [@param{Object} targets] 返回最后找到的元素
     * @return{String} 返回扩展分组值
     */
    /**
     * @description 获取元素别名属性
     * @function
     * @name ALog.getAlias()
     * @grammar ALog.getAlias(element)
     * @param{Element} element 元素对象
     * @return{String} 返回别名值
     */
    /**
     * @description 获取参数属性
     * @function
     * @name ALog.getParam()
     * @grammar ALog.getParam(element)
     * @param{Element} element 元素对象
     * @return{String} 返回参数值
     */
    /**
     * @description 获取文本属性
     * @function
     * @name ALog.getText()
     * @grammar ALog.getText(element)
     * @param{Element} element 元素对象
     * @return{String} 返回文本值
     */
    'Group1Action1Extra1AliasParamText'.replace(/([A-Z][a-z]+)(1|0)?/g, function(all, name, upward){
        var loName = name.toLowerCase();
        attrNames[loName] = 'alog-' + loName;
        exports['get' + name] = function(element, targets){
            return attrExtension(element, attrNames[loName], upward, targets);
        };
    });

    return exports
});;alog('define', 'monk', ['elements'], function(elements){

    var win         = window;
    var doc         = document;
    var screenObj   = win.screen;
    var docElement  = doc.documentElement;
    var refer       = doc.referrer;
    var orientation = win.orientation;
    var orientations = {
        "90":1,
        "180":2,
        "-90":3
    };

    /*
        获取元素尺寸
     */
    function getElementSize(element){
        var box = element.getBoundingClientRect();
        return [parseInt(box.right - box.left), parseInt(box.bottom - box.top)];
    }

    /*
        获取页面尺寸
     */
    function getPageSize(){
        var doc_size = getElementSize(docElement), 
            body_size = getElementSize(doc.body);
        return [
            Math.max(doc_size[0], body_size[0], win.innerWidth || 0, docElement.scrollWidth || 0),
            Math.max(doc_size[1], body_size[1], win.innerHeight || 0, docElement.scrollHeight || 0)
        ];
    }

    
    
    // 生成一个统计对象
    var tracker = alog.tracker('pv');



    //设置统计模块的基本参数
    //ver 为版本号，请向Alog管理员申请
    //pid 为统计ID，作为log平台的筛选字段
    tracker.set('ver', 99);
    tracker.set('pid', 241);

    // 设置浏览器分辨率
    tracker.set('px', screenObj.width + 'x' + screenObj.height);
    // 设置设备手持方向
    tracker.set('ori', orientations[orientation]);
    // 设置访问来源
    tracker.set('ref', refer);

    // 初始化模块时，设置页面大小尺寸
    tracker.on('create', function(){
        tracker.set('ps', getPageSize().join('x'));
    });

    

    // 监听设备手持方向变化，改变上报参数
    alog.on(win,'orientationchange',  function(){
        tracker.set('ori', orientations[win.orientation]);
    });


    // 监听页面关闭，发送请求以对比丢包率
    alog.on(win,'unload',  function(){
        tracker.send('event', {
            "cmd": "close"
        });
    });

    var storage = window.localStorage;
    var storageKey = 'monk-storage';

    function sendStorage(){
        try {
            var data;
            if(storage.getItem(storageKey)!== null) {
                data = JSON.parse(storage.getItem(storageKey));
                data.fr = 'ls';
                tracker.send(data.t, data);
            }
        } catch(e) {

        }
    }

    if(storage) {
        // 初始化时，将之前还未发送的请求进行发送
        tracker.on('create', function(){
            sendStorage();
        });

        // 数据发送时，保存到localStorage中
        tracker.on('send', function(data){
            if(data.t !== 'pageview') {
                storage.setItem(storageKey, JSON.stringify(data));
            }
        })
    }




    /**
     * 增加对链接点击的统计
     */

    /**
     * 计算时间戳
     */
    function timeStamp(){
        return new Date - startTime;
    }


    /*
     * 获取上级链接元素或按钮
     * @param{Element} element 当前元素
     */
    function getButton(element){
        while(element){
            if (/^(a|button|input)$/i.test(element.tagName)){
                return element;
            }
            element = element.parentNode;
        }
    }
    /*
     * 获取当前refer
     */
    function getRefer(){
        switch(monk_config.refer){
            case 1: case true:
                return var_alias_document.referrer;
            case 2:
                var result = var_alias_document.referrer;
                if (!result) return;
                var host = '';
                result.replace(/(^\w+:\/\/)?([^\/]+)/, function(all, $1){
                    host = $1;
                });
                if (var_alias_document.location.host == host){ // 站内详细
                    return var_alias_document.referrer;
                }
                return host;
        }
    }

    /*
     * 事件发生时相对于页面的坐标
     */
    function getPagePos(e){
        var pagePos = [0,0];
        if (e.pageX || e.pageY) {
            pagePos = [e.pageX, e.pageY];
        } else if (e.clientX || e.clientY) {
            pagePos = [
                e.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0),
                e.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0)
            ];
        }
        return pagePos;
    }

    // 初始化需要用到的变量
    var var_alias_document = document;
    var touchMoved;
    var lastTouchTime;
    var lastTouch;
    var lastTouchScrollTop;
    var totalClick = 0;
    var clickIndex = 0;
    var startTime = new Date();
    var monk_config = {
        refer: 1
    };
    
    function clickHandler(e){
        var evtName = e.type;
        var target = e.target || e.srcElement;
        var currentTime = timeStamp();
        var errorType;
        var clickData;
        var data;
        var action_targets = {};

        switch(evtName) {
            case 'touchstart':
                touchMoved         = false;
                lastTouchTime      = timeStamp();
                lastTouch          = (e.touches&&e.touches.length > 0)?e.touches[0]:e;
                lastTouchScrollTop = document.body.scrollTop;
            break;

            case 'touchend':
                if (!target) return;
                if (!lastTouch) return;

                var currentTime = timeStamp();
                var errorType = 99;

                //第一次触发touchend事件
                if((currentTime - lastTouchTime) < 20) {
                    errorType = 1;
                }
                //touchend距离touchstart间隔超过500，可能触发浏览器行为
                if((currentTime - lastTouchTime) > 500) {
                    errorType = 2;
                }
                //touch过程中产生touchmove
                if(touchMoved) {
                    errorType = 3;
                    return;
                }
                
                clickData = {
                    xpath           : elements.getXPath(target),
                    tagName         : target.tagName,
                    action          : elements.getAction(target, action_targets),
                    group           : elements.getGroup(target),
                    elementPos      : elements.ep(target, [lastTouch.clientX, lastTouch.clientY]),
                    pagePos         : getPagePos(lastTouch),
                    elementWatched  : false
                };

                // 要么是常规统计元素，否则普通元素要求至少要有alog-action打点才会被上报。
                if((/a|button|input/i.test(clickData.tagName) !== true)){
                    if(!clickData.action) {
                        if(clickData.elementWatched === false) {
                            return;
                        }
                    }
                }
                //if((/a|button|input/i.test(tagName) !== true) && ((elementWatched === false) || !action)) return;

                // 符合条件后 对应的总点击数和有效点击值都增加
                totalClick++;
                clickIndex++;

                data = {
                    xp  : clickData.xpath,
                    g   : clickData.group,
                    ac  : clickData.action,
                    ep  : clickData.elementPos,
                    ci  : clickIndex,
                    pp  : clickData.pagePos,
                    ps  : elements.ps(),
                    vr  : elements.vr(),
                    u   : '',
                    txt : '',
                    er  : errorType
                };

                tracker.fire('click', data);
                tracker.send('click', data);
            break;

            case 'touchmove':
                touchMoved = true;
            break;

            default: 
            break;
        }

        
    }

    // 当被初始化时才开始绑定监听touch事件 
    tracker.on('create', function(){
        alog.on(document, 'touchstart', clickHandler);
        alog.on(document, 'touchend', clickHandler);
        alog.on(document, 'touchmove', clickHandler);
    });




    /**
     * 增加停留时长统计timespent
     */
    var spendTimeMax = 60;
    var spentTime = 5000;
    var spentTimer;

    function sendTimeSpentInfo(){
        spendTimeMax--;
        tracker.send('timespent',{});
        spentTimer && clearTimeout(spentTimer);

        if(spendTimeMax) {
            spentTimer = setTimeout(sendTimeSpentInfo, spentTime);
        }
    }
    //接收到事件后就开始启动访问阅读时长统计
    tracker.on('spendTimeStart', function(data){
        if(data.timer) {
            spentTime = parseInt(data.timer, 10);
        }
        spentTimer = setTimeout(sendTimeSpentInfo, spentTime);
    });
    //接收到事件后就停止访问阅读时长统计
    tracker.on('spendTimeStop', function(){
        spentTimer && clearTimeout(spentTimer);
    });
    

    return tracker;

});;alog('require', ['monk'], function(monkReturn){

    //monkReturn 是monk模块的返回值，是一个tracker实例

    var loc = document.location;
    var path = loc.pathname;
    var pattern = {
        "^/$": "monk-fex-home",
        "/articles": "monk-fex-articles",
        "/blog/\\\d+/\\\d+": "monk-fex-articles",
        "/we-need-you": "monk-fex-hire",
        "/code\\\.html": "monk-fex-projects"
    };
    var page = "";
    var regexp;
    
    
    for(var i in pattern) {
        var regexp = new RegExp(i);
        if(regexp.test(path)) {
            
            page = pattern[i];
        }
    }
    
    monkReturn.create({
        postUrl: 'http://nsclick.baidu.com/u.gif',
        page: page,
        p:332
    });

    monkReturn.send('pageview', {
        'cmd':'open'
    });

    //解决IOS5使用历史回退时页面资源被缓存导致重新没有执行相关脚本的问题
    //重新绑定相关的事件
    alog.on(window, 'pageshow', function(e){
        if(e.persisted === true && monkReturn) {
            monkReturn.send('pageview', {
                'cmd':'open',
                'back':'1'
            });
        }
    });

    //开启访问时长统计
    monkReturn.fire('spendTimeStart', {timer: 10000});

    var articleId = window.page.replace(/\//g,'-');
    if(page === "monk-fex-articles" && articleId.indexOf('-blog-') === 0) {
        articleId= articleId.replace('-blog-','')
        monkReturn.send('event', {
            'type': articleId
        });
    }
});