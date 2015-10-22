function stopPropagation(e){
	var e=event?event:window.event;
	if(e.stopPropagation){
		e.stopPropagation();
	}
	else{
		e.cancelBubble=true;
	}
};

$(document).ready(function(){
	var winHeight = $(window).height();
	//初始化加载向上滑动
	$(".page-1").eq(0).bind('mousedown',function(){
		setTimeout(function(){
			mySwiper.swipeTo(1);
			$('.swiper-slide').eq(1).addClass('run');
			$(".down_arrow").show();
		},300)
	});
	/*设置容器高度*/
	$('.swiper-container,.swiper-slide,.swiper-container-2,#swiperSlideWrap').css('height',function(){
		return winHeight;
	});	
	//上下拖拽插件属性设置
    var mySwiper = new Swiper('.swiper-container',{
		paginationClickable: true,
		speed:800,
		mode: 'vertical',
		resistance: '100%',
		onTouchEnd: function(mySwiper,e){
			mySwiper.activeIndex == 0 ? (stopPropagation(e),$(".down_arrow").hide()): (mySwiper.activeIndex == 4 ? $(".down_arrow").hide() : $(".down_arrow").show());
			$('.swiper-container .swiper-slide').eq(mySwiper.activeIndex).addClass('run');
			setTimeout(function(){
				$('.swiper-container .swiper-slide').eq(mySwiper.activeIndex).siblings().removeClass("run");
			},800)
		}
	});
	var mySwiper1 = new Swiper('.swiper-container-2',{
		paginationClickable: true,
		speed:800,
		mode: 'vertical',
		resistance: '100%',
		onTouchEnd: function(mySwiper1,e){
			mySwiper1.activeIndex == 2 ? $(".down_arrow").hide() : $(".down_arrow").show();
			$('.swiper-container-2 .swiper-slide').eq(mySwiper1.activeIndex).addClass('run');
			setTimeout(function(){
				$('.swiper-container-2 .swiper-slide').eq(mySwiper1.activeIndex).siblings().removeClass("run");
			},800)
		}
	});
	//点击站点
	$('.p2_nav a').each(function(){
		$(this).bind("mousedown",function(e){
			stopPropagation(e);
			var _index = $(this).parent().index();
			var swipeChild = $("#swiperSlideWrap > .swiper-wrapper").children();
			$("#swiperSlideWrap").fadeIn(200);
			if(_index == 1){
				$('.swiper-container-2,.swiper-container-2 .swiper-slide,.swiper-wrapper').css('width','100%').show();
				swipeChild.eq(_index).fadeIn(200).siblings().fadeOut(200);
			}else{
				swipeChild.eq(_index).fadeIn(200).addClass('run').siblings().fadeOut(200).removeClass('run');
			}
		});
	});
	//返回站点
	$(".swiper-current").bind("mousedown",function(){
		mySwiper.swipeTo(1);
		mySwiper1.swipeTo(0);
		$(this).hide().removeClass("run");
		$("#swiperSlideWrap").hide();
	});
	//ios手机不能自动播放需事件触发
    var audioId=document.getElementById("audio");
	if(/Android/i.test(navigator.userAgent)){
		$(".btn-music").addClass("on"),audioId.play();
	}
	$(document).one('touchstart', function (e) {
		e.target.id=="audioBtn"? (!1):( $(".btn-music").addClass("on"),audioId.play());
	})
    $(".btn-music").bind("mousedown",function(){
        $(this).hasClass("on")?($(this).removeClass("on"),$(this).addClass("init-bg"),audioId.pause()):( $(this).removeClass("init-bg"),$(this).addClass("on"), audioId.play());
    })
});

