var time = null;
var timerBtn = null;   //计时器按钮


var minute;
var hour;
var day;
var month;
var year;
var dayOfWeek;  //星期几

var multi_speed;    //当前倍速
var isPausing;      //当前是否暂停
var isAdmin;        //当前账户是否是管理员


var navBtn = null;      //导航按钮
var stopNav = null;     //监听导航是否结束
var isNavigating = false;   //当前是否正在导航
var navStarted = false;     //当前路段导航是否已经起步
var busStart = null;    //监听公交车是否到达
var busTime = [];           //保存公交发车时间
var busStationID_ShaHe;     //沙河车站的ID
var busStationID_XiTuCheng; //西土城车站的ID
var isWatingBus = false;    //当前是否在等巴士
var navMinute = 0;          //当前路段导航所需时间
var trackAni;               //导航动画对象
var bmap;                   //地图
var marker = [];            //地图上标志建筑物的标识
var route = [];         //保存导航的途径路线坐标
var crowdConsidered = false;    //导航是否考虑拥挤度


const week = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
const MinutesPerHour = 60
const HoursPerDay = 24;
const DaysPerWeek = 7;
const DaysPerMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
const DaysPerYear = 365;
const MonthsPerYear = 12;
const originMillisecondsPerHour = 10000;


var currentPageCurriculumName;   //当前打开的课程信息框的课程名
var clock = [];     //按照时间顺序保存当前所有闹钟的数据
var activity = [];  //按照时间顺序保存当前所有待完成活动的数据
var curriculumInfo = null;   //保存所有课程的信息
var curriculumSchedul = null;//保存课程表信息
var schedulTimeSlot = null;  //保存课程表中每节课的时间段
var activityType = null;     //保存活动类型及其内容


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

