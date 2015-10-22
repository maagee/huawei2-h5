/*
 * Swipe 2.0
 *
 * Brad Birdsall
 * Copyright 2013, MIT License
 *
 * Swipe第二个参数为可选参数(一个key/value的对象):
 * startSlide: Integer (默认:0) - Swipe开始索引位置.
 * speed: Integer (默认:300) - prev和next转换速度(以毫秒为单位).
 * auto: Integer - 开始自动放映幻灯片(幻灯片以毫秒为单位).
 * continuous: Boolean (默认:true) - 创建一个没有端点无限循环的幻灯片.
 * disableTouch: Boolean (默认:false) - 阻止任何触及此容器上滑动事件.
 * disableScroll: Boolean (默认:false) - 阻止任何触及此容器上滚动页面.
 * stopPropagation: Boolean (默认:false) - 阻止时间冒泡.
 * callback: Function - 回调函数(运行在幻灯片变化时).
 * transitionEnd: Function - 运行在幻灯片过渡结束时.
 *
 * Example:
 * window.mySwipe = Swipe(document.getElementById('slider'), {
 *     startSlide : 2,
 *     speed : 400,
 *     auto : 3000,
 *     continuous : true,
 *     disableTouch : false,
 *     disableScroll : false,
 *     stopPropagation : false,
 *     callback : function(index, elem){},
 *     transitionEnd : function(index, elem){}
 * });
 *
*/

function Swipe(container, options){
    'use strict';

    var noop = function(){};
    var offloadFn = function(fn){ setTimeout(fn || noop, 0) };

    // 检测当前浏览器对(addEventListener、touch、transitions)支持情况
    var browser = {
        addEventListener : !!window.addEventListener,
        touch : ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
        transitions : (function(temp){
            var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
            for (var i in props) if (temp.style[props[i]] !== undefined) return true;
            return false;
        })(document.createElement('swipe'))
    };

    // 根节点元素(container)不存在时退出
    if (!container) return;
    
    // 标示当前是否只有2个slide
    var flag = false;

    var element = container.children[0];
    var slides, slidePos, width, length;
    options = options || {};
    var index = parseInt(options.startSlide, 10) || 0;
    var speed = options.speed || 300;
    options.continuous = (options.continuous !== undefined) ? options.continuous : true;
    options.disableTouch = (options.disableTouch !== undefined) ? options.disableTouch : false;

    function setup(){
        slides = element.children;
        length = slides.length;

        // 如果只有一个幻灯片则设置continuous值为false
        if (slides.length < 2) options.continuous = false;

        // 特殊情况下，如果只有两个幻灯片
        if (browser.transitions && options.continuous && slides.length < 3) {
            element.appendChild(slides[0].cloneNode(true));
            element.appendChild(element.children[1].cloneNode(true));
            slides = element.children;
            flag = true;
        }

        // 创建一个数组来存储每个幻灯片当前位置
        slidePos = new Array(slides.length);

        // 确定每个幻灯片的宽度
        width = container.getBoundingClientRect().width || container.offsetWidth;
        element.style.width = (slides.length * width) + 'px';

        // 设置每个幻灯片元素
        var pos = slides.length;
        while (pos--) {
            var slide = slides[pos];

            slide.style.width = width + 'px';
            slide.setAttribute('data-index', pos);

            if (browser.transitions) {
                slide.style.left = (pos * -width) + 'px';
                move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
            }
        }

        // 重新定位当前索引(index)前一个和后一个元素
        if (options.continuous && browser.transitions) {
            move(circle(index - 1), -width, 0);
            move(circle(index + 1), width, 0);
        }

        if (!browser.transitions) element.style.left = (index * -width) + 'px';

        container.style.visibility = 'visible';
    }

    function prev(){
        if (options.continuous) slide(index - 1);
        else if (index) slide(index - 1);
    }

    function next(){
        if (options.continuous) slide(index + 1);
        else if (index < slides.length - 1) slide(index + 1);
    }

    function circle(index){
        return (slides.length + (index % slides.length)) % slides.length;
    }

    function slide(to, slideSpeed){
        // 如果当前已经是请求的幻灯片时则退出
        if (index == to) return;

        if (browser.transitions) {
            // 1: 向前, -1: 向后
            var direction = Math.abs(index - to) / (index - to);

            // 获取幻灯片实际的位置
            if (options.continuous) {
                var natural_direction = direction;
                direction = -slidePos[circle(to)] / width;

                // 如果向前并且to < index, 那么to = slides.length + to
                // 如果向后并且to > index, 那么to = -slides.length + to
                if (direction !== natural_direction) to =  -direction * slides.length + to;
            }

            var diff = Math.abs(index - to) - 1;

            // 在正确的方向上移动index和to之间的所有幻灯片
            while (diff--) move(circle((to > index ? to : index) - diff - 1), width * direction, 0);

            to = circle(to);

            move(index, width * direction, slideSpeed || speed);
            move(to, 0, slideSpeed || speed);

            // 设置下一个幻灯片在正确的位置上
            if (options.continuous) move(circle(to - direction), -(width * direction), 0);
        } else {
            to = circle(to);
            // 如果浏览器不支持过渡，则是一个没有回退循环的连续
            animate(index * -width, to * -width, slideSpeed || speed);
        }

        index = to;

        // 针对只有2个slide处理
        var temp = index;

        if (flag && (index > 1)) {
            temp = index - 2;
        }

        offloadFn(options.callback && options.callback(temp, slides[index]));
    }

    function move(index, dist, speed){
        translate(index, dist, speed);
        slidePos[index] = dist;
    }

    function translate(index, dist, speed){
        var slide = slides[index];
        var style = slide && slide.style;
        
        if (!style) return;

        // 指定对象过渡持续的时间(默认值是0，意味着不会有效果)
        style.webkitTransitionDuration = 
        style.MozTransitionDuration = 
        style.msTransitionDuration = 
        style.OTransitionDuration = 
        style.transitionDuration = speed + 'ms';

        // 定义3D转换，沿着X轴移动元素
        style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
        style.msTransform = 
        style.MozTransform = 
        // 定义2D转换，沿着X轴移动元素
        style.OTransform = 'translateX(' + dist + 'px)';
    }

    function animate(from, to, speed){
        // 如果不是一个动画，那么仅仅只是重新定位
        if (!speed) {
            element.style.left = to + 'px';
            return;
        }
    
        var start = +new Date;
    
        var timer = setInterval(function(){
            var timeElap = +new Date - start;
      
            if (timeElap > speed) {
                element.style.left = to + 'px';

                if (delay) begin();

                // 针对只有2个slide处理
                var temp = index;

                if (flag && (index > 1)) {
                    temp = index - 2;
                }

                options.transitionEnd && options.transitionEnd.call(event, temp, slides[index]);

                clearInterval(timer);
                return;
            }

            element.style.left = (((to - from) * (Math.floor((timeElap / speed) * 100) / 100)) + from) + 'px';
        }, 4);
    }

    // 设置自动幻灯片
    var delay = options.auto || 0;
    var interval;

    function begin(){
        interval = setTimeout(next, delay);
    }

    function stop(){
        delay = options.auto > 0 ? options.auto : 0;
		clearTimeout(interval);
    }

    var start = {};
    var delta = {};
    var isScrolling;

    // 设置事件捕获
    var events = {
        handleEvent : function(event){
            switch (event.type) {
                case 'touchstart' : this.start(event); break;
                case 'touchmove' : this.move(event); break;
                case 'touchend' : offloadFn(this.end(event)); break;
                case 'webkitTransitionEnd' :
                case 'msTransitionEnd' :
                case 'oTransitionEnd' :
                case 'otransitionend' :
                case 'transitionend' : offloadFn(this.transitionEnd(event)); break;
                case 'resize' : offloadFn(setup.call()); break;
            }

            if (options.stopPropagation) event.stopPropagation();
        },
        start : function(event){
            if (options.disableTouch) return;

            var touches = event.touches[0];

            // 获取初始的触摸变量值
            start = {
                // 获取初始的触摸坐标
                x : touches.pageX,
                y : touches.pageY,
                // 用来确定触摸持续时间
                time : +new Date
            };

            // 用于检测第一次move事件
            isScrolling = undefined;

            // 添加touchmove、touchend事件监听
            element.addEventListener('touchmove', this, false);
            element.addEventListener('touchend', this, false);
        },
        move : function(event){
            if (options.disableTouch) return;

            // 确保单点触摸滑动
            if (event.touches.length > 1 || event.scale && event.scale !== 1) return;

            if (options.disableScroll) event.preventDefault();

            var touches = event.touches[0];

            // 获取滑动触摸在X、Y轴的变化值
            delta = {
                x : touches.pageX - start.x,
                y : touches.pageY - start.y
            }

            // 如果是第一个或最后一个幻灯片则停止幻灯片(并且当continuous为false:即不是一个没有端点无限循环的幻灯片)
            if (!options.continuous && ((!index && delta.x > 0) || (index == slides.length - 1 && delta.x < 0))) return;

            // 检测是否是垂直滚动
            if (typeof isScrolling == 'undefined') {
                isScrolling = !!(isScrolling || Math.abs(delta.x) < Math.abs(delta.y));
            }

            // 如果不是垂直滚动
            if (!isScrolling) {
                // 阻止默认滚动
                event.preventDefault();

                // 停止幻灯片
                stop();

                // 如果是第一个或者是最后一个幻灯片时则增加滑动阻力
                if (options.continuous) { // 如果是一个没有端点无限循环的幻灯片则不增加滑动阻力
                    translate(circle(index - 1), delta.x + slidePos[circle(index - 1)], 0);
                    translate(index, delta.x + slidePos[index], 0);
                    translate(circle(index + 1), delta.x + slidePos[circle(index + 1)], 0);
                } else {
                    delta.x = 
                        delta.x / 
                        ((!index && delta.x > 0                  // 如果是第一个幻灯片并且向右滑动
                            || index == slides.length - 1 && delta.x < 0       // 或者是最后一个幻灯片并且向左滑动
                        ) ?
                        (Math.abs(delta.x) / width + 1)          // 设置阻力等级
                        : 1 );                                   // 否则不设置阻力

                    // 1:1触摸移动(基于精确的触摸位置的内容滑动)
                    translate(index - 1, delta.x + slidePos[index - 1], 0);
                    translate(index, delta.x + slidePos[index], 0);
                    translate(index + 1, delta.x + slidePos[index + 1], 0);
                }
            }
        },
        end : function(event){
            if (options.disableTouch) return;

            if (typeof isScrolling == 'undefined') return;

            // 获取幻灯片触摸持续时间
            var duration = +new Date - start.time;

            // 确定是否触发上一个或下一个幻灯片
            var isValidSlide = 
                Number(duration) < 250               // 如果幻灯片触摸持续时间小于250ms
                && Math.abs(delta.x) > 20            // 并且在X轴方向触摸滑动距离大于20px
                || Math.abs(delta.x) > width / 2;    // 或者如果在X轴方向触摸滑动距离大于幻灯片宽度的一半

            // 幻灯片试图确定是否是过去的开始和结束
            var isPastBounds = 
                !index && delta.x > 0                            // 如果是第一个slide并且向右滑动
                || index == slides.length - 1 && delta.x < 0;    // 或者是最后一个slide并且向左滑动

            if (options.continuous) isPastBounds = false;

            // 检测swipe滑动方向(true : 向左, false : 向右)
            var direction = delta.x < 0;

            // 如果不是垂直滚动
            if (!isScrolling) {
                if (isValidSlide && !isPastBounds) {
                    if (direction) {
                        if (options.continuous) { // 设置下一个幻灯片在正确的位置上
                            move(circle(index - 1), -width, 0);
                            move(circle(index + 2), width, 0);
                        } else {
                            move(index - 1, -width, 0);
                        }

                        move(index, slidePos[index] - width, speed);
                        move(circle(index + 1), slidePos[circle(index + 1)] - width, speed);
                        index = circle(index + 1);
                    } else {
                        if (options.continuous) { // 设置下一个幻灯片在正确的位置上
                            move(circle(index + 1), width, 0);
                            move(circle(index - 2), -width, 0);
                        } else {
                            move(index + 1, width, 0);
                        }

                        move(index, slidePos[index] + width, speed);
                        move(circle(index - 1), slidePos[circle(index - 1)] + width, speed);
                        index = circle(index - 1);
                    }

                    // 针对只有2个slide处理
                    var temp = index;

                    if (flag && (index > 1)) {
                        temp = index - 2;
                    }

                    options.callback && options.callback(temp, slides[index]);
                } else {
                    if (options.continuous) {
                        move(circle(index - 1), -width, speed);
                        move(index, 0, speed);
                        move(circle(index + 1), width, speed);
                    } else {
                        move(index - 1, -width, speed);
                        move(index, 0, speed);
                        move(index + 1, width, speed);
                    }
                }
            }

            // 当touchstart事件再次被触发时，移除touchmove、touchend事件监听
            element.removeEventListener('touchmove', events, false);
            element.removeEventListener('touchend', events, false);
        },
        transitionEnd : function(event){
            if (parseInt(event.target.getAttribute('data-index'), 10) == index) {
                if (delay) begin();

                // 针对只有2个slide处理
                var temp = index;

                if (flag && (index > 1)) {
                    temp = index - 2;
                }

                options.transitionEnd && options.transitionEnd.call(event, temp, slides[index]);
            }
        }
    }

    // 触发setup
    setup();

    // 启动自动幻灯片(如果可适用)
    if (delay) begin();

    // 添加事件监听
    if (browser.addEventListener) {
        // 给element绑定touchstart事件
        if (browser.touch) element.addEventListener('touchstart', events, false);

        if (browser.transitions) {
            element.addEventListener('webkitTransitionEnd', events, false);
            element.addEventListener('msTransitionEnd', events, false);
            element.addEventListener('oTransitionEnd', events, false);
            element.addEventListener('otransitionend', events, false);
            element.addEventListener('transitionend', events, false);
        }

        // 给window绑定resize事件
        window.addEventListener('resize', events, false);
    } else {
        // 兼容老版本IE
        window.onresize = function(){ setup() };
    }

    // 暴露出Swipe API
    return {
        setup : function(){
            setup();
        },
        slide : function(to, speed){
            // 取消幻灯片
            stop();
            slide(to, speed);
        },
        prev : function(){
            // 取消幻灯片
            stop();
            prev();
        },
        next : function(){
            // 取消幻灯片
            stop();
            next();
        },
        getPos : function(){
            // 获取当前索引位置
            return index;
        },
        getNumSlides : function(){
            // 获取幻灯片总数
            return length;
        },
        kill : function(){
            // 取消幻灯片
            stop();

            // 重置element
            element.style.width = 'auto';
            element.style.left = 0;

            // 重置slides
            var pos = slides.length;
            while (pos--) {
                var slide = slides[pos];

                slide.style.width = '100%';
                slide.style.left = 0;

                if (browser.transitions) translate(pos, 0, 0);
            }

            // 移除事件监听
            if (browser.addEventListener) {
                // 移除当前事件监听
                element.removeEventListener('touchstart', events, false);
                element.removeEventListener('webkitTransitionEnd', events, false);
                element.removeEventListener('msTransitionEnd', events, false);
                element.removeEventListener('oTransitionEnd', events, false);
                element.removeEventListener('otransitionend', events, false);
                element.removeEventListener('transitionend', events, false);
                window.removeEventListener('resize', events, false);
            } else {
                window.onresize = null;
            }
        }
    }
}

if (window.jQuery || window.Zepto) {
    (function($){
        $.fn.Swipe = function(params){
            return this.each(function(){
                $(this).data('Swipe', new Swipe($(this)[0], params));
            });
        }
    })(window.jQuery || window.Zepto)
}