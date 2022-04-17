
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
    $.get("/api/setController", {controllerStr: JSON.stringify({IsAdmin:isAdmin, IsPausing:isPausing, Multi_speed:multi_speed})})
}

//暂停计时器
pauseTimer = function(){
    //切换按钮样式
    timerBtn.removeClass('btn-danger');
    timerBtn.addClass('btn-success');
    timerBtn.html('开始计时');

    clearInterval(time);
    
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
