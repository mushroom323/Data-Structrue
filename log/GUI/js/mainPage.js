var time = null;
var timerBtn = null;   //计时器按钮


var minute;
var hour;
var day;
var month;
var year;
var dayOfWeek;

var multi_speed;
var isPausing;
var isAdmin;    //当前账户是否是管理员


var stopNav = null;     //监听导航是否结束
var busStart = null;   //监听公交车是否到达
var navBtn = null;  //导航按钮
var isWatingBus = false;
var isNavigating = false;
var navStarted = false;
var crowdConsidered = false;
var navMinute = 0;
var trackAni;
var bmap;
var marker = [];
var busTime = [];         //保存公交发车时间

var busStationID_ShaHe;
var busStationID_XiTuCheng;

const week = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
const MinutesPerHour = 60
const HoursPerDay = 24;
const DaysPerWeek = 7;
const DaysPerMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
const DaysPerYear = 365;
const MonthsPerYear = 12;
const originMillisecondsPerHour = 10000;


var currentPageCurriculumName = '计算机网络';
var clock = [];     //按照时间顺序保存当前所有闹钟的数据
var activity = [];  //按照时间顺序保存当前所有待完成活动的数据
var curriculumInfo = null;   //保存所有课程的信息
var curriculumSchedul = null;//保存课程表信息
var schedulTimeSlot = null;  //保存课程表中每节课的时间段
var activityType = null;     //保存活动类型及其内容

var route = [];         //保存导航的途径路线坐标

var todayClass = [];    //按照时间顺序保存今日课程的数组

var district = [];      //保存所有需要在地图上标志出来的标志建筑物/地点




$(document).ready(function(){
    //-----------读取后端保存的信息--------------
    //及其重要的取消异步
    $.ajaxSettings.async = false;
    //课程信息相关
    $.getJSON('/api/getCurriculums', function(data){curriculumInfo = data;})
    $.getJSON('/api/getSchedule', function(data){curriculumSchedul = data;})
    $.getJSON('/api/getScheduleTimeSlot', function(data){schedulTimeSlot = data;})
    $.getJSON('/api/getActivityType', function(data){activityType = data;})
    $.getJSON('/api/getBusTime', function(data){busTime = data;})
    $.getJSON('/api/getCoordinate', function(data){
        district = data;
        //设置两个校区公交站的ID
        $.each(district, function(index_1, thisDistrict){
            if(thisDistrict.Name == '沙河校区')
                $.each(thisDistrict.Spot, function(index_2, value){
                    if(value.Name == '沙河大门')
                        busStationID_ShaHe = value.ID;
                    return;
                })
            if(thisDistrict.Name == '西土城校区')
                $.each(thisDistrict.Spot, function(index_2, value){
                    if(value.Name == '东门')
                        busStationID_XiTuCheng = value.ID;
                    return;
                })
        })
    })
    
    $.getJSON('/api/getClocks', function(data){
        if(data){
            clock = data;
        }
    })
    $.getJSON('/api/getTime', function(data){
        // if(data.Year != 0){
            year = data.Year;
            month = data.Month;
            day = data.Day;
            dayOfWeek = data.Week; 
            hour = data.Hour;
            minute = data.Minute;
        // }
    })
    $.getJSON('/api/getActivity', function(data){
        if(data){
            activity = data;
        }
    })
    $.getJSON('/api/getController', function(data){
        if(data.Multi_speed != 0){
            isAdmin = data.IsAdmin,
            isPausing = data.IsPausing,
            multi_speed = data.Multi_speed
        }
    })

    
    $(window).bind('beforeunload',function(){
        // $.ajaxSettings.async = false;
        $.get("/api/setTime", {TimeStr:JSON.stringify({
            Year: year,
            Month: month,
            Day: day,
            Week: dayOfWeek,
            Hour: hour,
            Minute: minute
        })})////
        // $.ajaxSettings.async = true;
        // $.get("/api/setController", {controllerStr: JSON.stringify({IsAdmin:isAdmin, IsPausing:isPausing, Multi_speed:multi_speed})})
    })
    
    $.ajaxSettings.async = true;
    //-----------读取后端保存的信息--------------

    
    //计时器按钮，实现时间暂停与继续的功能
    timerBtn = $('#timer').on('click', function(){
        //当时间停止时按下按钮
        if(isPausing == true){
            isPausing = false;
            startTimer();
            if(isNavigating == true){
                continueNavigation();
            }
        }
        //当时间流动时按下按钮
        else{
            isPausing = true;
            pauseTimer();   //暂停计时器
            if(isNavigating == true)
                pauseNavigation();
        }
    })

    //导航按钮，按下按钮开始导航，导航进行中按下按钮取消导航
    navBtn = $('#startNavigationBtn').on('click', function(){
        if(isNavigating == true){
            stopNavigation();
            cancelNavigation();
            clearInterval(stopNav);
            clearInterval(busStart);
            $('#startNavigation #navTip').css('opacity','0')
        }
        else{
            navigation();
        }
    })

    initPage();
})

//初始化页面
initPage = function(){

    if(isPausing == false){
        startTimer();
    }
    setAdminBtnsHTML();
    setSwitcherHTML();
    setTimeHTML();
    refreshSubjects();
    refreshTodayClass();
    refreshTodayActivities();
    refreshSchedul();
    refreshClocks();
    refreshActivities();
    fillCurriculumSelect();
    fillDestClassTimeSelect();
    fillDistrict();
    initMap();
    //触发所有选择地点下拉框的onchange事件，该事件将三个地点全部加载好
    $('.district').trigger('onchange');
    $('.activityType').trigger('onchange');

    
}

//点击沙河校区按钮，地图锁定沙河校区
locateShaHe = function(){
    console.log(toTimeString(hour,minute)+' 切换到沙河校区');
    bmap.centerAndZoom(new BMapGL.Point(116.29597, 40.16355), 17);
}

//点击西土城校区按钮，地图锁定西土城校区
locateXiTuCheng = function(){
    console.log(toTimeString(hour,minute)+' 切换到西土城校区');
    bmap.centerAndZoom(new BMapGL.Point(116.36443, 39.96725), 18);
}

//导航的准备，即给后端传递起点和终点，接收后端反馈的路线，开始导航
navigation = function(){
    var currentDistrictName = $('#currentLocate .district').val();
    var currentSpotName = $('#currentLocate .spot').val();
    var currentDistrict, currentSpot;

    //找到当前地点的ID
    $.each(district, function(index, value){
        if(value.Name == currentDistrictName){
            currentDistrict = value;
            return;
        }
    })
    $.each(currentDistrict.Spot, function(index, value){
        if(value.Name == currentSpotName){
            currentSpot = value;
            return;
        }
    })
    var currentID = currentSpot.ID;

    var destMethod = $('#destLocate input:radio[name="dest-method"]:checked').val();

    var destClassName = $('#destLocate .curriculumSelect').val();
    var destTimeOrder = $('#destLocate .destClassTimeSelect').val();
    var destDistrictName = $('#destLocate .district').val();
    var destSpotName = $('#destLocate .spot').val();

    var destDistrict, destSpot;

    var destClass = null;   //目标的一节课

    //若三选一选择了目标课程
    if(destMethod == 'curriculum'){
        //选择时间最近的，也就是靠近todayClass数组首部且今天还没上的一节课
        for(var i = 0; i < todayClass.length; i++){
            if(destClassName == todayClass[i].Name && 
                (60*hour + minute) < 
                    (60*schedulTimeSlot[todayClass[i].Order].EndHour + schedulTimeSlot[todayClass[i].Order].EndMinute)){
                destClass = todayClass[i];
                break;
            }
        }
        if(destClass == null){
            $('#startNavigation #navTip').html('<span style="color: red; font-weight: bold;">今天没有该课程！</span>');
            $('#startNavigation #navTip').css('opacity','1')
            return;
        }
        destDistrictName = destClass.District;
        destSpotName = destClass.Spot;
    }//若三选一选择了目标时间
    else if(destMethod == 'time'){
        //选择能与目标时间对应上的，且今天还没上的一节课
        $.each(todayClass, function(index, value){
            if(destTimeOrder == value.Order && 
                (60*hour + minute) < 
                    (60*schedulTimeSlot[value.Order].EndHour + schedulTimeSlot[value.Order].EndMinute)){
                destClass = value;
                return;
            }
        })
        if(destClass == null){
            $('#startNavigation #navTip').html('<span style="color: red; font-weight: bold;">该时间段没有课程！</span>');
            $('#startNavigation #navTip').css('opacity','1')
            return;
        }
        destDistrictName = destClass.District;
        destSpotName = destClass.Spot;
    }

    //若起始地点与目的地点相同
    // console.log(destDistrictName , currentDistrictName , destSpotName , currentSpotName)
    if(destDistrictName == currentDistrictName && destSpotName == currentSpotName){
        $('#startNavigation div span').html('您已在目的地点，无需导航！');
        $('#startNavigation div span').css('opacity','1')
        return;
    }

    //若三选一选择了目标地点

    $('#startNavigation #navTip').css('opacity','0')

    //找到目的地点的ID
    $.each(district, function(index, value){
        if(value.Name == destDistrictName){
            destDistrict = value;
            return;
        }
    })
    $.each(destDistrict.Spot, function(index, value){
        if(value.Name == destSpotName){
            destSpot = value;
            return;
        }
    })
    var destID = destSpot.ID;

    var bikeOrWalk = $('#bikeOrWalk input:radio[name="vehicle"]:checked').val();
    
    //根据选择的出行方式设置是否考虑拥挤度
    if(bikeOrWalk == 'walk_crowd'){
        bikeOrWalk = 'walk';
        crowdConsidered = true;
    }
    else if(bikeOrWalk == 'walk_noncrowd'){
        bikeOrWalk = 'walk';
        crowdConsidered = false;
    }
    else if(bikeOrWalk == 'bike')
        crowdConsidered = false;

    var millisecondsPerMinute = originMillisecondsPerHour / MinutesPerHour / multi_speed;

    console.log(toTimeString(hour,minute)+' '+'当前地点：'+currentDistrictName+'-'+currentSpotName+'；目标地点：'+destDistrictName+'-'+destSpotName)

    if(currentDistrict == destDistrict){    //若起点和终点是同一个校区

        $.ajaxSettings.async = false;
        $.get('/api/getRoute', {CurrentID:JSON.stringify(currentID), DestID:JSON.stringify(destID),
                                 BikeOrWalk:bikeOrWalk, CrowdConsidered:JSON.stringify(crowdConsidered)}, function(data){setRoute(data.Path);});
        $.ajaxSettings.async = true;

        startNavigation();$('#startNavigation #navTip').html('<span style="color: dodgerblue; font-weight: bold;">开始导航，预计抵达终点时间：'
            + toTimeString((hour + parseInt((minute+navMinute)/60))%24, (minute + navMinute)%60) + '</span>');
        $('#startNavigation #navTip').css('opacity','1')
        
        //监听导航时间，当导航时间为 0 时停止导航
        stopNav = setInterval(function(){
            if(isNavigating == true){
                if(navMinute <= 0){
                    //停止监听
                    stopNavigation();
                    clearInterval(stopNav);
                    $('#startNavigation #navTip').html('<span style="color: green; font-weight: bold;">抵达终点！</span>');
                    $('#startNavigation #navTip').css('opacity','1')
                }
            }
        }, millisecondsPerMinute);
    }
    else{           //若起点和终点在不同校区

        var curBusStationID,destBusStationID;
        if(currentDistrictName == '沙河校区'){
            curBusStationID = busStationID_ShaHe;
            destBusStationID = busStationID_XiTuCheng;
        }
        else{
            curBusStationID = busStationID_XiTuCheng;
            destBusStationID = busStationID_ShaHe;
        }

        //若当前位置不在车站，则开始到车站的导航
        if(curBusStationID != busStationID_ShaHe && curBusStationID != busStationID_XiTuCheng){
//--------------------------------------------------------------------
            //设置route为当前校区的途径点
            $.ajaxSettings.async = false;
            $.get('/api/getRoute', {CurrentID:JSON.stringify(currentID), DestID:JSON.stringify(curBusStationID), 
                                    BikeOrWalk:bikeOrWalk, CrowdConsidered:JSON.stringify(crowdConsidered)}, function(data){setRoute(data.Path);});
            $.ajaxSettings.async = true;
//--------------------------------------------------------------------
            startNavigation();

            $('#startNavigation #navTip').html('<span style="color: dodgerblue; font-weight: bold;">开始导航，预计抵达站点时间：'
                + toTimeString((hour + parseInt((minute+navMinute)/60))%24, (minute + navMinute)%60) + '</span>');
            $('#startNavigation #navTip').css('opacity','1')
        }
        else{
            isNavigating = true;
            navMinute = 0;
            $('#startNavigationBtn').attr('disabled', 'disabled');
            $('#switchTimeRatioBtn').attr('disabled', 'disabled');
            $('#startNavigationBtn').addClass('btn-danger');
            $('#startNavigationBtn').removeClass('btn-primary');
            $('#startNavigationBtn').html(' 取消导航');
        }
        
        //1.监听导航时间，当导航时间为 0 时停止第一段导航
        stopNav = setInterval(function(){
            if(isNavigating == true){
                if(navMinute <= 0){
                    //停止监听第一次导航
                    console.log(toTimeString(hour,minute)+' '+' 开始等车！')
                    clearInterval(stopNav);

                    //下一班车
                    var latestBus = null;
                    //计算出下一班车是哪班，存在latestBus中
                    for(var i = 0; i < busTime.length; i++){
                        if( i+1 != busTime.length
                            &&(busTime[i].StartHour*60 + busTime[i].StartMinute) <= (hour*60 + minute)
                            && (busTime[i+1].StartHour*60 + busTime[i+1].StartMinute) > (hour*60 + minute))
                            latestBus = busTime[i+1];
                        else if(i == 0 && (busTime[i].StartHour*60 + busTime[i].StartMinute) > (hour*60 + minute))
                            latestBus = busTime[i];
                    }

                    //若当前时间大于最后一班车的时间，则停止监听巴士是否发车，导航到此结束
                    if(latestBus == null){
                        console.log(toTimeString(hour,minute)+' '+"已经等不到车了")
                        stopNavigation();
                        $('#startNavigation #navTip').html('<span style="color: red; font-weight: bold;">今天已经没有巴士了</span>');
                        $('#startNavigation #navTip').css('opacity','1')
                        isWatingBus = false;
                        return;
                    }

                    $('#startNavigation #navTip').html('<span style="color: dodgerblue; font-weight: bold;">开始等待下一班巴士，'
                        + '时间：' + toTimeString(latestBus.StartHour,latestBus.StartMinute) + '</span>');
                    $('#startNavigation #navTip').css('opacity','1')
                    navStarted = false;
                    isWatingBus = true;


                    //2.监听巴士是否发车，当巴士发车时开始倒计时啥时候到目的地
                    busStart = setInterval(function(){

                        if((latestBus.StartHour*60 + latestBus.StartMinute) > (hour*60 + minute))
                            return;

                        console.log(toTimeString(hour,minute)+' '+'等到车了，现在就等到站了');
                        clearInterval(busStart);
                        
                        $('#startNavigation #navTip').html('<span style="color: dodgerblue; font-weight: bold;">巴士已抵达，预计到站时间：'
                            + toTimeString((latestBus.StartHour + parseInt(latestBus.Duration/60)), (latestBus.StartMinute + latestBus.Duration%60))+'</span>');
                        $('#startNavigation #navTip').css('opacity','1')

                        //设置一下校区定位按钮的按下状态
                        if(currentDistrictName == '沙河校区')
                            $('#XiTuChengLocateBtn').trigger('click');
                        else
                            $('#ShaHeLocateBtn').trigger('click');
            
                        navMinute = latestBus.Duration;

                        //3.开始监听巴士啥时候到站
                        stopNav = setInterval(function(){
                            if(isNavigating == true){
                                if(navMinute <= 0){
                                    //到达另一个校区，停止监听巴士是否到站
                                    console.log(toTimeString(hour,minute)+' '+'巴士到站啦，开始目标校区的寻址')
                                    clearInterval(stopNav);
                                    isWatingBus = false;
//--------------------------------------------------------------------                                            
                                    //设置route为目标校区的途径点
                                    $.ajaxSettings.async = false;
                                    $.get('/api/getRoute', {CurrentID:JSON.stringify(destBusStationID), DestID:JSON.stringify(destID),
                                                              BikeOrWalk:bikeOrWalk, CrowdConsidered:JSON.stringify(crowdConsidered)}, function(data){setRoute(data.Path);});
                                    $.ajaxSettings.async = true;
//--------------------------------------------------------------------
                                    $('#startNavigation #navTip').html('<span style="color: dodgerblue; font-weight: bold;">巴士到站，继续导航，预计抵达终点时间：'
                                        + toTimeString((hour + parseInt((minute+navMinute)/60))%24, (minute + navMinute)%60) +'</span>');
                                    $('#startNavigation #navTip').css('opacity','1')

                                    startNavigation();
                                    
                                    //4.监听导航时间，当导航时间为 0 时停止第二段导航
                                    stopNav = setInterval(function(){
                                        if(isNavigating == true){
                                            if(navMinute <= 0){
                                                //停止监听
                                                clearInterval(stopNav);
                                                $('#startNavigation #navTip').html('<span style="color: green; font-weight: bold;">抵达终点！</span>');
                                                $('#startNavigation #navTip').css('opacity','1')
                                                stopNavigation();
                                            }
                                        }
                                    }, millisecondsPerMinute);
                                }
                            }
                        }, millisecondsPerMinute)
                    }, millisecondsPerMinute)
                }
            }
        }, millisecondsPerMinute);
    }
}

//从后端获取到路径信息后，设置route数组与navMinute
setRoute = function(path){
    route = [];
    navMinute = 0;
    for(var i = 0; i < path.length; i++){
        if(i == 0){
            route.push({
                x: path[i].FromX,
                y: path[i].FromY
            })
        }
        route.push({
            x: path[i].ToX,
            y: path[i].ToY
        })

        if(path[i].IsBycle)
            navMinute += path[i].BycleDuration;
        else
            navMinute += path[i].FootDuration;
    }
}

startNavigation = function(){
    console.log(toTimeString(hour,minute)+' '+'开始移动');
    //清除地图上所有覆盖物
    bmap.clearOverlays();
    //test
    navMinute = 20
    //地图上途径路线的点集
    var point = [];
    //将route中的坐标添加入点集
    $.each(route, function(index, value){
        point.push(new BMapGL.Point(value.x, value.y));
    })
    //线集
    var pl = new BMapGL.Polyline(point);
    //加载导航动画
    trackAni = new BMapGLLib.TrackAnimation(bmap, pl, {
        overallView: true,
        tilt: 30,
        duration: navMinute*originMillisecondsPerHour/MinutesPerHour/multi_speed,
        delay: 300,
    });
    //当前正在导航
    isNavigating = true;
    //加载导航动画时会清除地图上所有覆盖物，所以此处重新添加地图上的标志地点的标记覆盖物
    addMarkers();
    //若当前不是暂停状态，则开始导航动画
    if(isPausing == false){
        trackAni.start();
        //导航已开始
        navStarted = true;
    }

    if(navStarted == false){
        //若导航未开始，则不可点击取消导航按钮
        $('#startNavigationBtn').attr('disabled', 'disabled');
    }
    $('#switchTimeRatioBtn').attr('disabled', 'disabled');
    $('#startNavigationBtn').addClass('btn-danger');
    $('#startNavigationBtn').removeClass('btn-primary');
    $('#startNavigationBtn').html(' 取消导航');
}

//继续导航
continueNavigation = function(){
    if(trackAni == null)
        return;

    if(navStarted == true || isWatingBus == true){
        //若导航已开始，则继续导航
        console.log(toTimeString(hour,minute)+' '+'继续移动');
        trackAni.continue();
    }
    else{
        //若导航未开始，则开始导航，并设置导航已开始，设置取消导航按钮为可点击状态
        trackAni.start();
        navStarted = true;
        $('#startNavigationBtn').removeAttr('disabled');
    }
}

//暂停导航
pauseNavigation = function(){
    if(trackAni == null)
        return;

    if(navStarted == true){
        console.log(toTimeString(hour,minute)+' '+'暂停导航');
        //若导航已开始，则暂停导航
        trackAni.pause();
    }
}

//停止导航
stopNavigation = function(){
    
    $('#switchTimeRatioBtn').removeAttr('disabled');
    $('#startNavigationBtn').addClass('btn-primary');
    $('#startNavigationBtn').removeClass('btn-danger');
    $('#startNavigationBtn').html(' 开始导航');

    console.log(toTimeString(hour,minute)+' '+'停止移动')
    navStarted = false;
    isNavigating = false;

    // addMarkers();
}

//取消导航（只有在主动取消时被调用）
cancelNavigation = function(){
    trackAni.cancel();
}

//添加标志建筑物标志
addMarkers = function(){
    $.each(district, function(index_1, thisDistrict){
        $.each(thisDistrict.Spot, function(index_2, value){
            var newPoint = new BMapGL.Point(value.X, value.Y);
            var newMarker = new BMapGL.Marker(newPoint);
            marker.push(newMarker);
            bmap.addOverlay(newMarker);
            newMarker.addEventListener('click', function () {
                bmap.openInfoWindow(new BMapGL.InfoWindow(value.Name), newPoint); // 开启信息窗口
            });
        })
    })
}

//初始化地图（初始化界面）
initMap = function(){

	// GL版命名空间为BMapGL
	// 按住鼠标右键，修改倾斜角和角度
	bmap = new BMapGL.Map("allmap");    // 创建Map实例
	bmap.centerAndZoom(new BMapGL.Point(116.29597, 40.16355), 17);  // 初始化地图,设置中心点坐标和地图级别
	bmap.enableScrollWheelZoom(true);     // 开启鼠标滚轮缩放


    addMarkers();
}

//设置倍速开关的HTML（初始化界面）
setSwitcherHTML = function(){
    var switcher = $('#switchTimeRatioBtn');

    if(multi_speed == 1){
        switcher.html('一倍速');
    }
    else if(multi_speed == 2){
        switcher.html('二倍速');
    }
    else if(multi_speed == 5){
        switcher.html('五倍速');
    }
    else if(multi_speed == 10){
        switcher.html('十倍速');
    }
}

//设置管理员相关按钮的HTML（初始化界面）
setAdminBtnsHTML = function(){
    if(isAdmin == false){
        $('#switchAdminBtn').html('开启管理员模式');
        $("#changeClassTimeBtn").attr('disabled','disabled');
        $("#assignHomeworkBtn").attr('disabled','disabled');
        $("#assignExamBtn").attr('disabled','disabled');
    }
    else{
        $('#switchAdminBtn').html('关闭管理员模式');
        $("#changeClassTimeBtn").removeAttr('disabled');
        $("#assignHomeworkBtn").removeAttr('disabled');
        $("#assignExamBtn").removeAttr('disabled');
    }
}

//设置右下角时间的HTML（初始化界面）
setTimeHTML = function(){
    $('#timestamp li:eq(4)').html(toTimeString(hour, minute));
    $('#timestamp li:eq(3)').html(week[(dayOfWeek)]);
    $('#timestamp li:eq(2)').html(day+1);
    $('#timestamp li:eq(1)').html(month+1);
    $('#timestamp li:eq(0)').html(year);
}

//填满目标时间下拉框（初始化界面）
fillDestClassTimeSelect = function(){
    var str = '';
    var sel = $('#destLocate .destClassTimeSelect');

    $.each(schedulTimeSlot, function(index, value){
        str += '<option value=' + index + '>' + toTimeString(value.StartHour, value.StartMinute) + '</option>';
    })

    sel.html(str)
}

//把所有包含所有课程的下拉框填满（初始化界面）
fillCurriculumSelect = function(){
    var str = '';

    $.each(curriculumSchedul, function(index, curriculumInSchedul){
        str += '<option value=' + curriculumInSchedul.Name + '>' + curriculumInSchedul.Name + '</option>';
    })

    //包含所有课程的下拉框
    $('.curriculumSelect').each(function(index, value){
        $(value).html(str);
    })
}

//把所有包含校区的下拉框填满（初始化界面）
fillDistrict = function(){
    var str = '';
    var sel = $('.district');

    $.each(district, function(index, value){
        str += '<option value=' + value.Name + '>' + value.Name + '</option>';
    });

    sel.each(function(index, value){
        $(value).html(str);
    })
}

//当按下切换管理员模式按钮时，切换管理员模式
switchAdmin = function(){
    if(isAdmin == true){
        isAdmin = false;
        $('#switchAdminBtn').html('开启管理员模式');
        $("#changeClassTimeBtn").attr('disabled','disabled');
        $("#assignHomeworkBtn").attr('disabled','disabled');
        $("#assignExamBtn").attr('disabled','disabled');
    }
    else{
        isAdmin = true;
        $('#switchAdminBtn').html('关闭管理员模式');
        $("#changeClassTimeBtn").removeAttr('disabled');
        $("#assignHomeworkBtn").removeAttr('disabled');
        $("#assignExamBtn").removeAttr('disabled');
    }
    $.get('/api/setController', {controllerStr: JSON.stringify({IsAdmin:isAdmin, IsPausing:isPausing, Multi_speed:multi_speed})})
}

//切换计时器倍速
switchTimeRatio = function(){
    var switcher = $('#switchTimeRatioBtn');
    
    if(timerBtn.hasClass('btn-success')){
        isPausing = true;
    }

    if(multi_speed == 1){
        switcher.html('二倍速');
        multi_speed = 2;
    }
    else if(multi_speed == 2){
        switcher.html('五倍速');
        multi_speed = 5;
    }
    else if(multi_speed == 5){
        switcher.html('十倍速');
        multi_speed = 10;
    }
    else if(multi_speed == 10){
        switcher.html('一倍速');
        multi_speed = 1;
    }

    pauseTimer();
    //若按下切换倍速按钮时，时间处于流动状态，则打开计时器
    if(isPausing == false){
        startTimer();
    }
}

//开始计时器
startTimer = function(){
    var millisecondsPerMinute = originMillisecondsPerHour / MinutesPerHour / multi_speed;
    
    //切换按钮样式
    timerBtn.removeClass('btn-success');
    timerBtn.addClass('btn-danger');
    timerBtn.html('暂停计时');
    
    //以下是每十秒所要更新的全部数据
    time = setInterval(function(){
        //设置右下角的时间
        setTime();
        //设置闹钟相关
        setClock();
        //刷新 今日课程
        refreshTodayClass();
        //刷新 今日活动
        refreshTodayActivities();
        //删除已过期的考试
        deleteExam();

        //当正在导航时，每次调用该setInterval（过了一分钟）则让导航的剩余时间navMinute减一
        if(isNavigating == true){
            if(navMinute > 0){
                --navMinute;
            }
        }
    }, millisecondsPerMinute);

    $.get("/api/setController", {controllerStr: JSON.stringify({IsAdmin:isAdmin, IsPausing:isPausing, Multi_speed:multi_speed})})
}
//暂停计时器
pauseTimer = function(){
    //切换按钮样式
    timerBtn.removeClass('btn-danger');
    timerBtn.addClass('btn-success');
    timerBtn.html('开始计时');

    clearInterval(time);
    $.get("/api/setController", {controllerStr: JSON.stringify({IsAdmin:isAdmin, IsPausing:isPausing, Multi_speed:multi_speed})})
}

//设置右下角的时间
setTime = function(){
    minute = (++minute) % MinutesPerHour;

    var str = toTimeString(hour, minute);
    $('#timestamp li:eq(4)').html(str);
    if(minute == 0){

        hour = (++hour) % HoursPerDay;
        //设置小时
        var str = toTimeString(hour, minute);
        $('#timestamp li:eq(4)').html(str);
        
        if(hour == 0){
            //设置星期几和日
            day = (++day) % DaysPerMonth[month];
            dayOfWeek = (++dayOfWeek) % DaysPerWeek;
            $('#timestamp li:eq(3)').html(week[(dayOfWeek)]);
            $('#timestamp li:eq(2)').html(day+1);
    
            if(day == 0){
                //设置月份
                month = (++month) % MonthsPerYear;
                $('#timestamp li:eq(1)').html(month+1);
    
                if(month == 0){
                    //设置年份
                    year++;
                    $('#timestamp li:eq(0)').html(year);
                }
            }
        }
    }
}

//设置闹钟信息
setClock = function(){
    //当新的一周开始时，将当前所有闹钟的overTime设置为false
    // if(dayOfWeek == 0 && hour == 0){
    //     $.each(clock, function(index, value){
    //         value.OverTime = false;
    //     });
    // }

    //当闹钟响了以后弹窗，可能删除闹钟
    $.each(clock, function(index, value){
        //若是每天一次的闹钟到时间
        if(value && (value.ClockCycle == '每天一次') && (value.Hour == hour) && (value.Minute == minute)){
            clockTimeUp(value);
        }
        //若每仅响一次或每周一次的闹钟到时间
        if(value && (value.ClockCycle == '仅响一次' || value.ClockCycle == '每周一次') && (value.Week == dayOfWeek) && (value.Hour == hour) && (value.Minute == minute)){
            clockTimeUp(value);
        }
    });
}

//刷新 今日课程
refreshTodayClass = function(){
    var str = '';

    todayClass = [];

    //遍历课程表的每一种课
    $.each(curriculumSchedul, function(index_1, curriculumInSchedul){
        var thisCurriculum = curriculumInfo.find(function(value){
            return value.Name == curriculumInSchedul.Name;
        }); //取得这节课的共有信息

        //遍历这种课的每一节
        $.each(curriculumInSchedul.Info, function(index_2, value){
            var classInSchedul = {};    //需要深复制

            if(value.Week == dayOfWeek){  //如果是今天的课
                classInSchedul.Week = value.Week;
                classInSchedul.Order = value.Order;
                classInSchedul.IsExam = value.IsExam;
                classInSchedul.District = value.District;  //存入这节课的地点
                classInSchedul.Spot = value.Spot;
                classInSchedul.Classroom = value.Classroom;
                classInSchedul.Name = thisCurriculum.Name;  //存入这节课的名字
                classInSchedul.Instructor = thisCurriculum.Instructor;  //存入这节课的教师
                classInSchedul.Group = thisCurriculum.Group;    //存入这节课的课程群
                todayClass.push(classInSchedul);  //将这节课存入今日课程的数组
            }
        })
    })

    todayClass.sort(function(a, b){return a.Order - b.Order});  //按时间顺序排序
    
    $.each(todayClass, function(index, value){
        var thisSlot = schedulTimeSlot[value.Order];
        if(60*thisSlot.EndHour + thisSlot.EndMinute >= 60*hour + minute){ //若这节课还没到结束时间
            //则这节课还存在于今日课表中，开始填充
            if(value.IsExam == true){
                str += '<ul class="list-group exam-card">';
            }
            else{
                str += '<ul class="list-group class-card">';
            }
            str += '<li class="list-group-item active"> &nbsp;';
            str += '<span class="pull-left">[ ';
            str += toTimeString(thisSlot.StartHour, thisSlot.StartMinute) + ' - ';
            str += toTimeString(thisSlot.EndHour, thisSlot.EndMinute) + ' ]</span>'
            if(value.IsExam == true){
                str += '<span class="pull-right">考试</span>';
            }
            str += '</li>';
            str += '<li class="list-group-item">' + value.Name + '</li>';
            str += '<li class="list-group-item">' + value.Instructor + '</li>';
            str += '<li class="list-group-item">' + value.District + '-' + value.Spot + '-' + value.Classroom + '</li></ul>';
        }
    })

    

    if(str == ''){
        str = '<strong>今天没有其他课程了哦！<strong>'
    }

    $('.class-card-holder').html(str);
}

//刷新 今日活动
refreshTodayActivities = function(){
    var str = '';

    $.each(activity, function(index, value){
        if(value.Week == dayOfWeek
            && (60*value.Hour + value.Minute >= 60*hour + minute)){
                str += '<ul class="list-group activity-card">';
                str += '<li class="list-group-item active"> &nbsp;';
                str += '<span class="pull-left">[ ';
                str += toTimeString(value.Hour, value.Minute) + ' ]</span>';
                str += '<span class="pull-right">' + value.ActivityType + '-' + value.ActivityContent + '</span></li>';
                str += '<li class="list-group-item">';
                str += value.Activity + '</li>';
                str += '<li class="list-group-item">';
                str += value.District + '-' + value.Spot + '-' + value.Classroom + '</li></ul>';
            }
    })

    if(str == ''){
        str = '<strong>今天没有其他活动了哦！<strong>'
    }

    $('.activity-card-holder').html(str);
}

//刷新 课程表 窗口
refreshSchedul = function(){
    //先清空课程表
    for(var i = 0; i < 14; ++i){
        for(var j = 0; j < 7; ++j){
            $('#schedulModal tbody tr:eq('+i+')').children('td:eq('+(j+1)+')').html('');
        }
    }
    
    $.each(curriculumSchedul, function(index_1, curriculumInSchedul){

        var thisCurriculum = curriculumInfo.find(function(value){
            return value.Name == curriculumInSchedul.Name;
        }); //取得这节课的共有信息

        //遍历这种课的每一节
        $.each(curriculumInSchedul.Info, function(index_2, value){
            var classInSchedul = {};    //需要深复制

            classInSchedul.Week = value.Week;
            classInSchedul.Order = value.Order;
            classInSchedul.IsExam = value.IsExam;
            classInSchedul.District = value.District;  //存入这节课的地点
            classInSchedul.Spot = value.Spot;
            classInSchedul.Classroom = value.Classroom;
            classInSchedul.Name = thisCurriculum.Name;  //存入这节课的名字
            classInSchedul.Instructor = thisCurriculum.Instructor;  //存入这节课的教师
            classInSchedul.Group = thisCurriculum.Group;    //存入这节课的课程群
            
            var thisSlot = $('#schedulTable tbody tr:eq(' + classInSchedul.Order +')' 
                                                + ' td:eq(' + (classInSchedul.Week + 1) +')');
            var str = '<div onclick="showSpecificCurriculum(\'' + thisCurriculum.Name + '\')">'
                    + '<p>' + classInSchedul.Name + '</p>'
                    + '<p>' + classInSchedul.Instructor + '</p>'
                    + '<p>' + classInSchedul.District + '-' + classInSchedul.Spot + '-' + classInSchedul.Classroom + '</p>';
            if(classInSchedul.IsExam == true){
                str += '<p style="color: red;">考试</p>';
            }
            str += '</div>';
            
            thisSlot.html(str);
        })
    })
}

//刷新 所有课程 窗口
refreshSubjects = function(){
    var holder = $('#curriculumsHolder');
    var curriculumNames = [];
    var str = '';

    //将保存课程信息的JSON 中的课程表schedul 中的所有课程名 存入curriculums数组
    $.each(curriculumSchedul, function(index, value){
        curriculumNames.push(value.Name);
    });
    
    //开始填充
    $.each(curriculumNames, function(index_1, name){
        str += '<a class="list-group-item" onclick="showSpecificCurriculum(\'' + name + '\')">';
        str += '<span class="badge"></span>';
        str += name;
        str += '</a>';
    });
    
    holder.html(str);
}

//点击搜索后，刷新 所有课程 窗口
refreshSearchedSubjects = function(){
    var text = $('#curriculumSearchText').val();
    var holder = $('#curriculumsHolder');
    var str = '';

    if(text == ""){
        refreshSubjects();
    }
    else{
        $.get('/api/searchCurriculum', {Text:text}, function(data){

            if(data == null){
                '<strong style="margin: 10px;">没有找到相关课程！</strong>';
            }
            else{
                //开始填充
                $.each(data, function(index_1, name){
                    str += '<a class="list-group-item" onclick="showSpecificCurriculum(\'' + name + '\')">';
                    str += '<span class="badge"></span>';
                    str += name;
                    str += '</a>';
                });
            }

            holder.html(str);
        })
    }

}

//在所有课程窗口中，按下特定科目，弹出其对应特定作业窗口
showSpecificCurriculum = function(name){

    //将弹窗标题设置为该科目名称
    $('#specificCurriculum .modal-title').html(name);

    currentPageCurriculumName = name;

    refreshSpecClassAndExam(name);
    refreshSpecHomework(name);
    refreshSpecUploadHomework(name);
    refreshSpecUploadResource(name);

    $('#specificCurriculum').modal('show');
}

//刷新该科目的课程和考试信息
refreshSpecClassAndExam = function(){
    var classStr = '';
    var examStr = '';

    //提取该特定科目的共有信息
    var specificCurriculum = curriculumInfo.find(function(value){
        return value.Name == currentPageCurriculumName;
    })

    //提取该科目每节课的信息
    specificCurriculum.Info = curriculumSchedul.find(function(value){
        return value.Name == specificCurriculum.Name;
    }).Info;
    //此时specificCurriculum存储了该科目的共有信息，以及每节课的信息

    //开始设置弹窗内容
    $.each(specificCurriculum.Info, function(index, thisClass){
        
        var timeSlotStr = toTimeString(schedulTimeSlot[thisClass.Order].StartHour, schedulTimeSlot[thisClass.Order].StartMinute)
                + ' - ' + toTimeString(schedulTimeSlot[thisClass.Order].EndHour, schedulTimeSlot[thisClass.Order].EndMinute);

        if(thisClass.IsExam == false){
            classStr += '<tr><td>' + week[thisClass.Week] + '&nbsp;' + timeSlotStr + '</td>'
                    + '<td>' + thisClass.District + '-' + thisClass.Spot + '-' + thisClass.Classroom + '</td>'
                    + '<td>' + specificCurriculum.Instructor + '</td>'
                    + '<td>' + specificCurriculum.Group + '</td></tr>';
        }
        else{
            examStr += '<tr><td>' + week[thisClass.Week] + '&nbsp;' + timeSlotStr + '</td>'
                    + '<td>' + thisClass.District + '-' + thisClass.Spot + '-' + thisClass.Classroom + '</td>'
                    + '<td>' + specificCurriculum.Instructor + '</td></tr>';
        }
    })

    if(examStr == ''){
        examStr = '<tr><td>现在还没有考试哦！</td><td></td><td></td></tr>';
    }

    $('#curriculumInfo table tbody').html(classStr);
    $('#examInfo table tbody').html(examStr);
}

//刷新该科目的已布置作业
refreshSpecHomework = function(){
    var homeworkStr = '';
    
    //提取该特定科目的共有信息
    var specificCurriculum = curriculumInfo.find(function(value){
        return value.Name == currentPageCurriculumName;
    });

    $.each(specificCurriculum.Homework, function(index, thisHomework){
        var temp = '<div class="panel panel-default">'
                 + '<div class="panel-heading">'
                 + '<h4 class="panel-title">'
                 + '<a data-toggle="collapse" data-parent="#homeworks" href="#homework_' + index + '">&nbsp;';

        if(thisHomework.HasFinished == true){
            temp += '<span class="pull-left title" style="color: green">（已完成）</span>';
        }
        else{
            temp += '<span class="pull-left title" style="color: red">（未完成）</span>';
        }

            temp += '<span class="pull-left title">' + thisHomework.Title + '</span>'
                  + '<span class="pull-right date">' + thisHomework.Year + ' / ' + (thisHomework.Month+1) + ' / ' + (thisHomework.Day+1) + ' ' + toTimeString(thisHomework.Hour, thisHomework.Minute) + '</span>'
                  + '</a></h4></div>'
                  + '<div id="homework_' + index + '" class="panel-collapse collapse">'
                  + '<div class="panel-body Description">'
                  + thisHomework.Description
                  + '</div></div></div>';

        homeworkStr = temp + homeworkStr;
    })

    if(homeworkStr == ''){
        homeworkStr = '<p>老师还没有布置过作业哦！</p>'
    }
    
    $('#homeworkContainer').html(homeworkStr);
}

//点击搜索后，刷新该科目的已布置作业
refreshSearchedSpecHomework = function(){
    var text = $('#homeworkSearchText').val();
    var holder = $('#homeworkContainer');
    var homeworkStr = '';

    if(text == ""){
        refreshSpecHomework();
    }
    else{
        $.get('/api/searchHomework', {Text:text, CurriculumName:currentPageCurriculumName}, function(data){

            if(data == null){
                homeworkStr = '没有找到相关作业！';
            }
            else{
                //开始填充
                $.each(data, function(index, thisHomework){
                    var temp = '<div class="panel panel-default">'
                            + '<div class="panel-heading">'
                            + '<h4 class="panel-title">'
                            + '<a data-toggle="collapse" data-parent="#homeworks" href="#homework_' + index + '">&nbsp;';

                    if(thisHomework.HasFinished == true){
                        temp += '<span class="pull-left title" style="color: green">（已完成）</span>';
                    }
                    else{
                        temp += '<span class="pull-left title" style="color: red">（未完成）</span>';
                    }

                        temp += '<span class="pull-left title">' + thisHomework.Title + '</span>'
                            + '<span class="pull-right date">' + thisHomework.Year + ' / ' + (thisHomework.Month+1) + ' / ' + (thisHomework.Day+1) + ' ' + toTimeString(thisHomework.Hour, thisHomework.Minute) + '</span>'
                            + '</a></h4></div>'
                            + '<div id="homework_' + index + '" class="panel-collapse collapse">'
                            + '<div class="panel-body Description">'
                            + thisHomework.Description
                            + '</div></div></div>';

                    homeworkStr = temp + homeworkStr;
                });
            }
            
            holder.html(homeworkStr);
        })
    }
}

//刷新该科目的已上传作业
refreshSpecUploadHomework = function(){
    var uploadHomeworkStr = '';

    //提取该特定科目的共有信息
    var specificCurriculum = curriculumInfo.find(function(value){
        return value.Name == currentPageCurriculumName;
    })

    $.each(specificCurriculum.Homework, function(index_1, thisHomework){
        
        if(thisHomework.HasFinished == false){
            return;
        }

        var temp = '<div class="panel panel-default">'
                 + '<div class="panel-heading">'
                 + '<h4 class="panel-title">'
                 + '<a data-toggle="collapse" data-parent="#homeworks" href="#uploadedHomework_' + index_1 + '">&nbsp;'
                 + '<span class="pull-left title">' + thisHomework.Title + '</span>'
                 + '</a></h4></div>'
                 + '<div id="uploadedHomework_' + index_1 + '" class="panel-collapse collapse">'
                 + '<div class="panel-body">';

        var foo = '';

        $.each(thisHomework.Uploaded, function(index_2, thisUploaded){
            foo = '<div class="media">'
                + '<div class="media-left media-top">'
                + '<span class="glyphicon glyphicon-bookmark" style="color: red;"></span></div>'
                + '<div class="media-body">'
                + '<h4 class="pull-right" style="color: grey; font-size: small;">version_' + (thisUploaded.Version) + '<br>'
                + thisUploaded.Year + ' / ' + (thisUploaded.Month+1) + ' / ' + (thisUploaded.Day+1) + ' ' + toTimeString(thisUploaded.Hour, thisUploaded.Minute) + '</h4>'
                + '<h4 class="media-heading">' + thisUploaded.HomeworkName + '</h4>'
                + '<p>' + thisUploaded.Remark + '</p></div></div>'
                + foo;
        })

        temp = temp + foo;

        temp += '</div></div></div>';
        
        uploadHomeworkStr = temp + uploadHomeworkStr;
    })
    
    uploadHomeworkStr = '<div class="panel-group" id="homeworks">' + uploadHomeworkStr + '</div>';

    if(uploadHomeworkStr == '<div class="panel-group" id="homeworks"></div>'){
        uploadHomeworkStr = '<p>没有已上传的作业哦！</p>';
    }
    $('#uploadHomeworkContainer').html(uploadHomeworkStr);
}

//点击搜索后，刷新该科目的已上传作业
refreshSearchedSpecUploadHomework = function(){
    var text = $('#uploadHomeworkSearchText').val();
    var holder = $('#uploadHomeworkContainer');
    var uploadHomeworkStr = '';

    if(text == ""){
        refreshSpecUploadHomework();
    }
    else{
        $.get('/api/searchHomework', {Text:text, CurriculumName:currentPageCurriculumName}, function(data){

            if(data == null){
                uploadHomeworkStr = '没有找到相关作业！';
            }
            else{
                //开始填充
                $.each(data, function(index_1, thisHomework){
            
                    if(thisHomework.HasFinished == false){
                        return;
                    }
                    var temp = '<div class="panel panel-default">'
                             + '<div class="panel-heading">'
                             + '<h4 class="panel-title">'
                             + '<a data-toggle="collapse" data-parent="#homeworks" href="#uploadedHomework_' + index_1 + '">&nbsp;'
                             + '<span class="pull-left title">' + thisHomework.Title + '</span>'
                             + '</a></h4></div>'
                             + '<div id="uploadedHomework_' + index_1 + '" class="panel-collapse collapse">'
                             + '<div class="panel-body">';
            
                    var foo = '';
            
                    $.each(thisHomework.Uploaded, function(index_2, thisUploaded){
                        foo = '<div class="media">'
                            + '<div class="media-left media-top">'
                            + '<span class="glyphicon glyphicon-bookmark" style="color: red;"></span></div>'
                            + '<div class="media-body">'
                            + '<h4 class="pull-right" style="color: grey; font-size: small;">version_' + (thisUploaded.Version) + '<br>'
                            + thisUploaded.Year + ' / ' + (thisUploaded.Month+1) + ' / ' + (thisUploaded.Day+1) + ' ' + toTimeString(thisUploaded.Hour, thisUploaded.Minute) + '</h4>'
                            + '<h4 class="media-heading">' + thisUploaded.HomeworkName + '</h4>'
                            + '<p>' + thisUploaded.Remark + '</p></div></div>'
                            + foo;
                    })

                    temp = temp + foo;
                    temp += '</div></div></div>';
                    uploadHomeworkStr = temp + uploadHomeworkStr;
                })
            }
            
            holder.html(uploadHomeworkStr);
        })
    }
}

//刷新该科目的已上传资料
refreshSpecUploadResource = function(){
    // var uploadResourceStr = '';
    
    // //提取该特定科目的共有信息
    // var specificCurriculum = curriculumInfo.find(function(value){
    //     return value.Name == currentPageCurriculumName;
    // })

    // if(uploadResourceStr == ''){
    //     uploadResourceStr = '<p>没有已上传的资料哦！</p>';
    // }
    // $('#uploadResourceContainer').html(uploadResourceStr);
    var uploadResourceStr = '';

    //提取该特定科目的共有信息
    var specificCurriculum = curriculumInfo.find(function(value){
        return value.Name == currentPageCurriculumName;
    })

    $.each(specificCurriculum.Resource, function(index_1, thisResource){

        uploadResourceStr = '<div class="media">'
                        + '<div class="media-left media-top">'
                        + '<span class="glyphicon glyphicon-bookmark" style="color: red;"></span></div>'
                        + '<div class="media-body">'
                        + '<h4 class="pull-right" style="color: grey; font-size: small;">'
                        + thisResource.Year + ' / ' + (thisResource.Month+1) + ' / ' + (thisResource.Day+1) + ' ' + toTimeString(thisResource.Hour, thisResource.Minute) + '</h4>'
                        + '<h4 class="media-heading">' + thisResource.ResourceName + '</h4>'
                        + '<p>' + thisResource.Remark + '</p></div></div>'
                        + uploadResourceStr;
    })

    if(uploadResourceStr == ''){
        uploadResourceStr = '<p>没有已上传的资料哦！</p>';
    }
    $('#uploadResourceContainer').html(uploadResourceStr);
}

//点击搜索后，刷新该科目的已上传资料
refreshSearchedSpecUploadResource = function(){
    var text = $('#uploadResourceSearchText').val();
    var holder = $('#uploadResourceContainer');
    var uploadResourceStr = '';

    if(text == ""){
        refreshSpecUploadResource();
    }
    else{
        $.get('/api/searchResource', {Text:text, CurriculumName:currentPageCurriculumName}, function(data){

            if(data == null){
                uploadResourceStr = '没有找到相关资料！'
            }
            else{
                //开始填充
                $.each(data, function(index_1, thisResource){
    
                    uploadResourceStr = '<div class="media">'
                                    + '<div class="media-left media-top">'
                                    + '<span class="glyphicon glyphicon-bookmark" style="color: red;"></span></div>'
                                    + '<div class="media-body">'
                                    + '<h4 class="pull-right" style="color: grey; font-size: small;">'
                                    + thisResource.Year + ' / ' + (thisResource.Month+1) + ' / ' + (thisResource.Day+1) + ' ' + toTimeString(thisResource.Hour, thisResource.Minute) + '</h4>'
                                    + '<h4 class="media-heading">' + thisResource.ResourceName + '</h4>'
                                    + '<p>' + thisResource.Remark + '</p></div></div>'
                                    + uploadResourceStr;
                })
            }

            holder.html(uploadResourceStr);
        })
    }
}

//按下确认添加闹钟按钮，向clock数组中存入新建闹钟数据
addClock = function(){
    var newClock = {
        Week: parseInt($('#addBellModal .week').val()),
        Hour: parseInt($('#addBellModal .hour').val()),
        Minute: parseInt($('#addBellModal .minute').val()),
        Remark: $('#addBellModal .remark').val(),   //备注
        ClockCycle: $('#addBellModal input:radio:checked').val(),
        // OverTime: false //若该时间小于当前时间则为true，反之为false
    };

    // newClock.OverTime = 1440*newClock.Week + 60*newClock.Hour + newClock.Minute
    //                   < 1440*dayOfWeek + 60*hour + minute;

    clock.push(newClock);
    //对闹钟按时间顺序进行排序
    clock.sort(function(a, b){
        return (100*a.Week + 10*a.Hour + a.Minute) - (100*b.Week + 10*b.Hour + b.Minute);
    })

    refreshClocks();

    $.ajaxSettings.async = false;
    $.get("/api/setTime", {TimeStr:JSON.stringify({
        Year: year,
        Month: month,
        Day: day,
        Week: dayOfWeek,
        Hour: hour,
        Minute: minute
    })})////
    $.ajaxSettings.async = true;
    $.get("/api/addClock", {ClockStr:JSON.stringify(newClock)});////
}

//按下确认添加活动按钮，像activity数组中存入新建活动数据
addActivity = function(){

    //当活动内容填写了的情况下
    if($('#addActivityModal .activity').val()){
        var newActivity = {
            Week: parseInt($('#addActivityModal .week').val()),
            Hour: parseInt($('#addActivityModal .hour').val()),
            Minute: parseInt($('#addActivityModal .minute').val()),
            District: $('#addActivityModal .district').val(),
            Spot: $('#addActivityModal .spot').val(),
            Classroom: $('#addActivityModal .classroom').val(),
            Activity: $('#addActivityModal .activity').val(),   //活动内容
            ActivityType: $('#addActivityModal .activityType').val(),
            ActivityContent: $('#addActivityModal .activityContent').val()
        };
        activity.push(newActivity);
        //对活动按时间顺序进行排序
        activity.sort(function(a, b){
            return (1440*a.Week + 60*a.Hour + a.Minute) - (1440*b.Week + 60*b.Hour + b.Minute);
        })
        refreshActivities();
        refreshTodayActivities();
        $('#addActivityModal .modal-footer span strong').html('');
        
        $('#addActivityModal').modal('hide');

        $.ajaxSettings.async = false;
        $.get("/api/setTime", {TimeStr:JSON.stringify({
            Year: year,
            Month: month,
            Day: day,
            Week: dayOfWeek,
            Hour: hour,
            Minute: minute
        })})////
        $.ajaxSettings.async = true;
        $.get("/api/addActivity", {ActivityStr:JSON.stringify(newActivity)});////
    }
    else{
        $('#addActivityModal .modal-footer span strong').html('还没有填写活动内容！');
    }
}

//在选中活动类型下拉框后，填满活动类型的具体内容下拉框
fillActivityContentSelect = function(typeSel, contentSel){
    var str = '';
    thisType = activityType.find(function(value){
        return value.Type == typeSel.val();
    })

    $.each(thisType.Content, function(index, value){
        str += '<option value="' + value + '">' + value + '</option>'
    })
    contentSel.html(str);
}

//刷新 设置闹钟 窗口
refreshClocks = function(){
    var bellsHolder = $('#bellsHolder');
    var str = '';
    $.each(clock, function(index, value){
        str += '<div class="alert alert-info">';
        str += '<a href="#" class="close" data-dismiss="alert" onclick="deleteClock(clock[$(this).parent().index()])">&times;</a>';
        str += '<strong>';
        if(value.ClockCycle != '每天一次'){
            str += week[value.Week] + '&nbsp;&nbsp;';
        }
        str += toTimeString(value.Hour, value.Minute); 
        str += '&nbsp;&nbsp;丨&nbsp;&nbsp;';
        str += '<span class="pull-right" style="margin-right: 20px">' + value.ClockCycle + '</span></strong>'
        str += value.Remark;
        str += '</div>';
    })

    //若clock数组中没有对象
    if(str == ''){
        str += '<strong style="margin: 10px;">当前没有闹钟哦！</strong>';
    }
    
    bellsHolder.html(str);
}

//刷新 我的活动 窗口
refreshActivities = function(){
    var activitiesHolder = $('#activitiesHolder');
    var str = '';
    $.each(activity, function(index, value){
        str += '<div class="alert alert-warning">';
        str += '<a href="#" class="close" data-dismiss="alert" onclick="deleteActivity(activity[$(this).parent().index()])">&times;</a>';
        str += '<strong>';
        str += week[value.Week] + '&nbsp;&nbsp;';
        str += toTimeString(value.Hour, value.Minute) + '&nbsp;&nbsp;';
        str += value.District + '-' + value.Spot + '-' + value.Classroom;
        str += '<span class="pull-right" style="margin-right: 20px;">' + value.ActivityType + '-' + value.ActivityContent + '</span>'
        str += '</strong><br><br>';
        str += value.Activity;
        str += '</div>';
    })

    //若activity数组中没有对象
    if(str == ''){
        str += '<strong style="margin: 10px;">当前没有活动哦！</strong>';
    }
    
    activitiesHolder.html(str);
}

//在点击搜索后，刷新 我的活动 窗口
refreshSearchedActivities = function(){
    var text = $('#activitySearchText').val();
    var activityType = $('#activityModal .activityType').val();
    var activityContent = $('#activityModal .activityContent').val();
    var holder = $('#activitiesHolder');
    var str = '';

    $.get('/api/searchActivity', {Text:text, Type:activityType, Content:activityContent}, function(data){

        if(data == null){
            str = '<strong style="margin: 10px;">没有找到相关活动！</strong>';
        }
        else{
            //开始填充
            $.each(data, function(index, value){
                str += '<div class="alert alert-warning">';
                str += '<a href="#" class="close" data-dismiss="alert" onclick="deleteActivity(activity[$(this).parent().index()])">&times;</a>';
                str += '<strong>';
                str += week[value.Week] + '&nbsp;&nbsp;';
                str += toTimeString(value.Hour, value.Minute) + '&nbsp;&nbsp;';
                str += value.District + '-' + value.Spot + '-' + value.Classroom;
                str += '<span class="pull-right" style="margin-right: 20px;">' + value.ActivityType + '-' + value.ActivityContent + '</span>'
                str += '</strong><br><br>';
                str += value.Activity;
                str += '</div>';
            })
        }
        
        holder.html(str);
    })
}

//删除该闹钟
deleteClock = function(obj){
    $.ajaxSettings.async = false;
    $.get("/api/setTime", {Time:JSON.stringify({
        Year: year,
        Month: month,
        Day: day,
        Week: dayOfWeek,
        Hour: hour,
        Minute: minute
    })})////
    $.ajaxSettings.async = true;
    $.get("/api/deleteClock", {ClockStr:JSON.stringify(obj)});

    clock.splice($.inArray(obj, clock), 1);
    refreshClocks();
}

//删除该活动
deleteActivity = function(obj){
    $.ajaxSettings.async = false;
    $.get("/api/setTime", {Time:JSON.stringify({
        Year: year,
        Month: month,
        Day: day,
        Week: dayOfWeek,
        Hour: hour,
        Minute: minute
    })})////
    $.ajaxSettings.async = true;
    $.get("/api/deleteActivity", {ActivityStr:JSON.stringify(obj)});

    activity.splice($.inArray(obj, activity), 1);
    refreshActivities();
}

//闹钟时间到，闹钟响铃，弹出窗口
clockTimeUp = function(obj){
    pauseTimer();
    var str = '';

    str += '<h4><strong>';
    str += week[obj.Week] + '&nbsp;&nbsp;';
    str += toTimeString(obj.Hour, obj.Minute);
    str += '</strong></h4>';
    str += '<p>' + obj.Remark + '<p>';

    $('#ringBellModal .modal-body').html(str);
    $('#ringBellModal').modal('show');

    if(obj.ClockCycle == '仅响一次'){
        deleteClock(obj);
    }
}

//输入时与分，返回时刻字符串（例如输入17、35，返回"17:35"）
toTimeString = function(h,m){
    var ret = '';
    if(h >= 0 && h < 10){
        ret += '0' + h;
    }
    else{
        ret += h;
    }
    ret += ':'
    if(m >= 0 && m< 10){
        ret += '0' + m;
    }
    else{
        ret += m;
    }
    return ret;
}

//按下确认布置作业按钮后更新curriculumSchedul数组
assignExam = function(){

    var newExamGroup = [];
    var curriculumName = $('#assignExamModal .curriculumSelect').val();
    var examWeek = $('#assignExamModal .week').val();
    var examStartOrder = $('#assignExamModal .startTime').val();
    var examEndOrder = $('#assignExamModal .endTime').val();
    var examDistrict = $('#assignExamModal .district').val();
    var examSpot = $('#assignExamModal .spot').val();
    var examClassroom = $('#assignExamModal .classroom').val();
    
    var errorWarning = $('#assignExamModal .modal-footer span strong');

    var timeError = false;

    //看看这个时间段内有没有其他课程
    for(var i = examStartOrder; i <= examEndOrder; i++){
        $.each(curriculumSchedul, function(index_1, curriculumInSchedul){
            $.each(curriculumInSchedul.Info, function(index_2, classInSchedul){
                if((i == classInSchedul.Order) && (examWeek == classInSchedul.Week)){
                    timeError = timeError || true;
                }
            })
        })
    }
    //看看时间段设置错没
    timeError = timeError || (examStartOrder > examEndOrder);

    if(timeError == true){
        errorWarning.html('该时间段已被占用或时间有误！');
        return;
        //如果时间有问题就展示警告，然后return
    }
    else{
        errorWarning.html('');

        $.ajaxSettings.async = false;
        $.get("/api/setTime", {TimeStr:JSON.stringify({
            Year: year,
            Month: month,
            Day: day,
            Week: dayOfWeek,
            Hour: hour,
            Minute: minute
        })})////
        $.ajaxSettings.async = true;
        
        for(var i = examStartOrder; i <= examEndOrder; i++){
            var newExam = {};
            newExam.Week = parseInt(examWeek);
            newExam.Order = parseInt(i);
            newExam.IsExam = true;
            newExam.District = examDistrict;
            newExam.Spot = examSpot;
            newExam.Classroom = examClassroom;
            newExamGroup.push(newExam);

            $.get("/api/assignExam", {NameStr:curriculumName, ExamStr:JSON.stringify(newExam)});////
        }
    
        $.each(newExamGroup, function(index, newExam){
            curriculumSchedul.find(function(value){
                return value.Name == curriculumName;
            }).Info.push(newExam);
        })
        
        refreshSchedul();
    
        $('#assignExamModal').modal('hide');

    }
}

//当考试进行了一次后删除该考试
deleteExam = function(){
    $.each(curriculumSchedul, function(index_1, curriculumInSchedul){
        for(var i = curriculumInSchedul.Info.length-1; i >= 0; --i){
            var obj = curriculumInSchedul.Info[i];
            if(obj.Week == dayOfWeek && obj.IsExam == true 
                && 60*schedulTimeSlot[obj.Order].EndHour + schedulTimeSlot[obj.Order].EndMinute == 60*hour + minute){

                curriculumInSchedul.Info.splice(i, 1);
                refreshSchedul();

                $.ajaxSettings.async = false;
                $.get("/api/setTime", {TimeStr:JSON.stringify({
                    Year: year,
                    Month: month,
                    Day: day,
                    Week: dayOfWeek,
                    Hour: hour,
                    Minute: minute
                })})////
                $.ajaxSettings.async = true;
                $.get("/api/deleteExam", {NameStr: curriculumInSchedul.Name, ExamStr: JSON.stringify(obj)});////
            }
        }
    })
}

//改变某节课程的时间和地点
changeClassInfo = function(){
    var curriculumName = $('#changeClassInfoModal .modal-body .curriculumSelect').val();
    var originWeek = $('#changeClassInfoModal .modal-body .originWeek').val();
    var originTime = $('#changeClassInfoModal .modal-body .originTime').val();
    var destWeek = $('#changeClassInfoModal .modal-body .destWeek').val();
    var destTime = $('#changeClassInfoModal .modal-body .destTime').val();
    var destDistrict = $('#changeClassInfoModal .modal-body .district').val();
    var destSpot = $('#changeClassInfoModal .modal-body .spot').val();
    var destClassroom = $('#changeClassInfoModal .modal-body .classroom').val();

    var errorWarning = $('#changeClassInfoModal .modal-footer span strong');

    //存下课程表中要删除的课程类型，和该课程特定节的下标
    var deleteIndex;
    var deleteCurriculumInSchedul;

    var newClass = {
        Week: parseInt(destWeek),
        Order: parseInt(destTime),
        IsExam: false,
        District: destDistrict,
        Spot: destSpot,
        Classroom: destClassroom
    };

    //原始时间段是否有该课程
    var hasThisClass = false;
    //目的时间是否以及有课程了
    var destHasClass = false;
    $.each(curriculumSchedul, function(index_1, curriculumInSchedul){
        $.each(curriculumInSchedul.Info, function(index_2, value){
            //若在原始时间段找到了该课程
            if(value.Week == parseInt(originWeek) && value.Order == parseInt(originTime)
                && curriculumName == curriculumInSchedul.Name){
                hasThisClass = true;
                deleteIndex = index_2;
                deleteCurriculumInSchedul = curriculumInSchedul;
            }
            //若目的时间段已经有课程了
            if(value.Week == parseInt(destWeek) && value.Order == parseInt(destTime)){
                destHasClass = true;
            }
        })
    })

    if(hasThisClass == false){
        errorWarning.html('原始时间段没有' + curriculumName + '课程！');
    }
    else if(destHasClass == true){
        errorWarning.html('目的时间段已有课程！');
    }
    else{
        var oldClass = deleteCurriculumInSchedul.Info[deleteIndex];
        deleteCurriculumInSchedul.Info.splice(deleteIndex, 1);
        deleteCurriculumInSchedul.Info.push(newClass)
        errorWarning.html('');
        refreshSchedul();
        $('#changeClassInfoModal').modal('hide');

        $.ajaxSettings.async = false;
        $.get("/api/setTime", {TimeStr:JSON.stringify({
            Year: year,
            Month: month,
            Day: day,
            Week: dayOfWeek,
            Hour: hour,
            Minute: minute
        })})////
        $.ajaxSettings.async = true;
        $.get("/api/changeClassInfo", {NameStr: curriculumName, 
                                        NewClassStr: JSON.stringify(newClass), OldClassStr: JSON.stringify(oldClass)});
    }
}

//检测活动与课程是否有冲突，若有则在添加活动页面的左下角显示警告
activityClassConflict = function(){
    var activityWeek = $('#addActivityModal .week').val();
    var activityHour = $('#addActivityModal .hour').val();
    var activityMinute = $('#addActivityModal .minute').val();

    var hasConflict = false;

    $.each(curriculumSchedul, function(index_1, curriculumInSchedul){
        $.each(curriculumInSchedul.Info, function(index_2, value){
            var timeSlot = schedulTimeSlot[value.Order];
            if(60*timeSlot.StartHour + timeSlot.StartMinute <= 60*parseInt(activityHour) + parseInt(activityMinute)
                && 60*timeSlot.EndHour + timeSlot.EndMinute > 60*parseInt(activityHour) + parseInt(activityMinute)
                && value.Week == parseInt(activityWeek)){
                    
                hasConflict = true;
            }
        })
    })

    if(hasConflict == true){
        $('#addActivityModal .modal-footer span strong').html('与课程时间冲突！');
    }
    else{
        $('#addActivityModal .modal-footer span strong').html('');
    }
}

//在选择校区之后，把对应建筑物和教室的下拉框填满
fillSpotSelect = function(districtSel, spotSel, classroomSel){
    var str = '';
    thisDistrict = district.find(function(value){
        return value.Name == districtSel.val();
    })

    $.each(thisDistrict.Spot, function(index, value){
        str += '<option value="' + value.Name + '">' + value.Name + '</option>'
    })
    spotSel.html(str);

    fillClassroomSelect(districtSel, spotSel, classroomSel);
}

//在选择建筑物后，把对应教室的下拉框填满
fillClassroomSelect = function(districtSel, spotSel, classroomSel){
    var str = '';
    thisDistrict = district.find(function(value){
        return value.Name == districtSel.val();
    })
    

    thisSpot = thisDistrict.Spot.find(function(value){
        return value.Name == spotSel.val();
    })

    $.each(thisSpot.Classroom, function(index, value){
        str += '<option value="' + value + '">' + value + '</option>'
    })
    classroomSel.html(str);
}

//布置新的作业
assignHomework = function(){
    var curriculumName = $('#assignHomeworkModal .modal-body .curriculumSelect').val();
    var homeworkTitle = $('#assignHomeworkModal .modal-body .homeworkTitle').val();
    var homeworkDescription = $('#assignHomeworkModal .modal-body .homeworkDescription').val();

    var errorWarning = $('#assignHomeworkModal .modal-footer span strong');

    //当作业标题和作业描述都填写时
    if(homeworkDescription && homeworkTitle){
        errorWarning.html('');

        //找到对应科目的已布置作业集合
        var specCurriculumHomework = curriculumInfo.find(function(value){
            return value.Name == curriculumName;
        }).Homework;

        var newHomework = {
            Title: homeworkTitle,
            Description: homeworkDescription,
            Year: year,
            Month: month,
            Day: day,
            Hour: hour,
            Minute: minute,
            HasFinished: false,
            Uploaded: []
        };

        specCurriculumHomework.push(newHomework);

        fillHomeworkSelect(curriculumName);
        
        $('#assignHomeworkModal').modal('hide');

        $.ajaxSettings.async = false;
        $.get("/api/setTime", {TimeStr:JSON.stringify({
            Year: year,
            Month: month,
            Day: day,
            Week: dayOfWeek,
            Hour: hour,
            Minute: minute
        })})////
        $.ajaxSettings.async = true;

        $.get("/api/assignHomework", {NameStr: curriculumName, HomeworkStr: JSON.stringify(newHomework)});
    }
    else{
        errorWarning.html('作业标题或作业描述未填写！');
    }
}

//填满选择作业的选择栏
fillHomeworkSelect = function(){
    var str = '';
    var thisHomework = curriculumInfo.find(function(value){
        return value.Name == currentPageCurriculumName;
    }).Homework;
    
    $.each(thisHomework, function(index, value){
        str += '<option value="' + value.Title + '">' + value.Title + '</option>';
    })

    $('.homeworkSelect').html(str);
}

uploadHomework = function(){ //在这里进行ajax 文件上传 作业的信息

    var homeworkSelected = $('#uploadHomeworkModal .homeworkSelect').val()
    var uploadHomeworkRemark = $('#uploadHomeworkModal .uploadHomeworkRemark').val();
    var errorWarning = $('#uploadHomeworkModal .modal-footer span strong');

    var $file1 = $("input[name='uploadHomeworkFile']").val();//用户文件内容(文件)
    var fileName1 = $file1.substring($file1.lastIndexOf(".") + 1).toLowerCase();
    var fileName2 = $file1.substring($file1.lastIndexOf("\\") + 1).toLowerCase();

    if(!homeworkSelected){
        errorWarning.html('请选择要提交哪一次作业！');
        return false;
    }
    // 判断文件是否为空 
    else if ($file1 == "") {
        errorWarning.html('请选择文件！');
        return false;
    }
    //判断文件类型,我这里根据业务需求判断的是word/bmp文件
    else if(fileName1 != "doc" && fileName1 !="docx" && fileName1 != "bmp"){
        errorWarning.html('请选择word或bmp文件!');			
        return false;
    }
    else{
        errorWarning.html('');
    }
    
    var exist = false;

    var homework = curriculumInfo.find(function(value){
        return value.Name == currentPageCurriculumName;
    }).Homework;

    var specHomework = homework.find(function(value){
        return value.Title == homeworkSelected;
    });
    specHomework.HasFinished = true;

    $.each(specHomework.Uploaded, function(index, value){
        if(value.HomeworkName == fileName2)
            exist = true;
    })

    if(exist == true){
        errorWarning.html('该文件已存在！');	
        return false;
    }


    var formData = new FormData();//这里需要实例化一个FormData来进行文件上传
    // formData.append('CurriculumName',currentPageCurriculumName);
    // formData.append('Title',homeworkSelected);
    formData.append('upfile',$("#uploadHomeworkFile")[0].files[0]);
    formData.append('curriculumName', currentPageCurriculumName);
    formData.append('homeworkName', homeworkSelected);
    // formData.append('HomeworkName',$file1.substring($file1.lastIndexOf("\\") + 1).toLowerCase());
    // formData.append('Remark',uploadHomeworkRemark);
    // formData.append('Year',year);
    // formData.append('Month',month);
    // formData.append('Day',day);
    // formData.append('Hour',hour);
    // formData.append('Minute',minute);
    // formData.append('Version',specHomework.Uploaded.length + 1);
    
    $.ajaxSettings.async = false;
    $.get("/api/setTime", {TimeStr:JSON.stringify({
        Year: year,
        Month: month,
        Day: day,
        Week: dayOfWeek,
        Hour: hour,
        Minute: minute
    })})////
    $.ajaxSettings.async = true;

    $.ajax({
        type : "post",
        url : "/api/upLoadHomework",
        data : formData,
        processData : false,
        contentType : false
    });

    var newUpload = {
        HomeworkName: fileName2,
        Remark: uploadHomeworkRemark,
        Year: year,
        Month: month,
        Day: day,
        Hour: hour,
        Minute: minute,
        Version: specHomework.Uploaded.length + 1
    }


    specHomework.Uploaded.push(newUpload);

    specHomework.Uploaded.sort(function(a,b){
        return a.Version - b.Version;
    })
    
    refreshSpecHomework();
    refreshSpecUploadHomework();

    $('#uploadHomeworkModal').modal('hide');

    
    $.get('/api/uploadHomeworkFile', {TitleStr:homeworkSelected, CurriculumNameStr:currentPageCurriculumName, UpFileStr:JSON.stringify(newUpload)});////
}

uploadResource = function(){ //在这里进行ajax 文件上传 资料的信息

    // var homeworkSelected = $('#uploadHomeworkModal .homeworkSelect').val()
    var uploadResourceRemark = $('#uploadResourceModal .uploadResourceRemark').val();
    var errorWarning = $('#uploadResourceModal .modal-footer span strong');
    
    var resource = curriculumInfo.find(function(value){
        return value.Name == currentPageCurriculumName;
    }).Resource;

    var $file1 = $("input[name='uploadResourceFile']").val();//用户文件内容(文件)
    var fileName1 = $file1.substring($file1.lastIndexOf(".") + 1).toLowerCase();
    var fileName2 = $file1.substring($file1.lastIndexOf("\\") + 1).toLowerCase();

    var exist = false;

    $.each(resource, function(index, value){
        if(value.ResourceName == fileName2)
            exist = true;
    })

    // 判断文件是否为空 
    if ($file1 == "") {
        errorWarning.html('请选择文件！');
        return false;
    }
    //判断文件类型,我这里根据业务需求判断的是word/bmp文件
    else if(fileName1 != "doc" && fileName1 !="docx" && fileName1 != "bmp" && fileName1 != "txt"){
        errorWarning.html('请选择word或bmp/txt文件!');			
        return false;
    }
    else if(exist == true){
        errorWarning.html('该文件已存在！');	
        return false;
    }
    else{
        errorWarning.html('');
    }

    var formData = new FormData();//这里需要实例化一个FormData来进行文件上传
    // formData.append('CurriculumName',currentPageCurriculumName);
    formData.append('upfile',$("#uploadResourceFile")[0].files[0]);
    formData.append('curriculumName', currentPageCurriculumName);
    // formData.append('ResourceName',$file1.substring($file1.lastIndexOf("\\") + 1).toLowerCase());
    // formData.append('Remark',uploadResourceRemark);
    // formData.append('Year',year);
    // formData.append('Month',month);
    // formData.append('Day',day);
    // formData.append('Hour',hour);
    // formData.append('Minute',minute);
    
    $.ajaxSettings.async = false;
    $.get("/api/setTime", {TimeStr:JSON.stringify({
        Year: year,
        Month: month,
        Day: day,
        Week: dayOfWeek,
        Hour: hour,
        Minute: minute
    })})////
    $.ajaxSettings.async = true;

    $.ajax({
        type : "post",
        url : "/api/upLoadResource",
        data : formData,
        processData : false,
        contentType : false
    });


    var newUpload = {
        ResourceName: fileName2,
        Remark: uploadResourceRemark,
        Year: year,
        Month: month,
        Day: day,
        Hour: hour,
        Minute: minute
    }

    resource.push(newUpload);
    
    refreshSpecUploadResource();

    $('#uploadResourceModal').modal('hide');

    $.get('/api/uploadResourceFile', {CurriculumNameStr:currentPageCurriculumName, ResourceStr:JSON.stringify(newUpload)});////
}




//

// clock[
//     {
//         week: 0,
//         hour: 5,
//         minute: 40,
//         remark: "这是备注"
//     },

//     ……
// ]

// activity[
//     {
//         week: 0,
//         hour: 5,
//         minute: 40,
//         activity: "打篮球",
//         location: "操场"
//     }

//     ……
// ]

// {
//     hour: 7,
//     day: 5,
//     month: 12,
//     year: 2021,
//     dayOfWeek: 3
// }