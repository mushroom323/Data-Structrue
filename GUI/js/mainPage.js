var time = null;
var timer = null;
var hour = 0;
var day = 3;
var month = 0;
var year = 2021;
var dayOfWeek = 0;
var week = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
const HoursPerDay = 24;
const DaysPerWeek = 7;
const DaysPerMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
const MonthsPerYear = 12;


var clock = [];     //按照时间顺序保存当前所有闹钟的数据
var activity = [];  //按照时间顺序保存当前所有待完成活动的数据
var curriculumInfo = null;   //保存所有课程的信息
var curriculumSchedul = null;//保存课程表信息
var schedulTimeSlot = null;  //保存课程表中每节课的时间段

var isAdmin = false;    //当前账户是否是管理员


//及其重要的取消异步
$.ajaxSettings.async = false;
//课程信息相关
$.getJSON('curriculum.json', function(data){curriculumInfo = data;})
$.ajaxSettings.async = true;

curriculumSchedul = curriculumInfo.schedul;
schedulTimeSlot = curriculumInfo.schedulTimeSlot;
curriculumInfo = curriculumInfo.curriculums;


$(document).ready(function(){
    //计时器，实现时间暂停与继续的功能
    timer = $('#timer').on('click', function(){

        //当时间停止时按下按钮
        if(timer.hasClass('btn-success')){
            startTimer();
        }
        //当时间流动时按下按钮
        else if(timer.hasClass('btn-danger')){
            pauseTimer();   //暂停计时器
        }
    })

    refreshSubjects();
    refreshTodayClass();
    refreshTodayActivities();
    refreshSchedul();
})


//开始计时器
startTimer = function(){
    //切换按钮样式
    timer.removeClass('btn-success');
    timer.addClass('btn-danger');
    timer.html('暂停计时');
    
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
    }, 100)
}
//暂停计时器
pauseTimer = function(){
    //切换按钮样式
    timer.removeClass('btn-danger');
    timer.addClass('btn-success');
    timer.html('开始计时');

    clearInterval(time);
}

//设置右下角的时间
setTime = function(){
    hour = (++hour) % HoursPerDay;
    //设置小时
    var str = toTimeString(hour, 0);
    $('#timestamp li:eq(4)').html(str);
    
    if(hour == 0){
        //设置星期几和日
        ++day;
        dayOfWeek = (++dayOfWeek) % DaysPerWeek;
        $('#timestamp li:eq(3)').html(week[(dayOfWeek)]);
        $('#timestamp li:eq(2)').html(day+1);

        if(day % DaysPerMonth[month] == 0){
            //设置月份
            day = 0;
            month = (++month) % MonthsPerYear;
            $('#timestamp li:eq(2)').html(day+1);
            $('#timestamp li:eq(1)').html(month+1);

            if(month == 0){
                //设置年份
                month = 0;
                year++;
                $('#timestamp li:eq(1)').html(month+1);
                $('#timestamp li:eq(0)').html(year);
            }
        }
    }
}

//设置闹钟信息
setClock = function(){
    //当新的一周开始时，将当前所有闹钟的overTime设置为false
    if(dayOfWeek == 0 && hour == 0){
        $.each(clock, function(index, value){
            value.overTime = false;
        });
    }

    //当闹钟响了以后弹窗并删除闹钟
    $.each(clock, function(index, value){
        if(value && (value.overTime == false) && (value.week <= dayOfWeek) && (value.hour <= hour)){
            clockTimeUp(value);
        }
    });
}

//刷新 今日课程
refreshTodayClass = function(){
    var str = '';
    var todayClass = [];    //按照时间顺序保存今日课程的数组

    //遍历课程表的每一种课
    $.each(curriculumSchedul, function(index_1, curriculumInSchedul){
        var thisCurriculum = curriculumInfo.find(function(value){
            return value.name == curriculumInSchedul.name;
        }); //取得这节课的共有信息

        //遍历这种课的每一节
        $.each(curriculumInSchedul.info, function(index_2, value){
            var classInSchedul = {};    //需要深复制

            if(classInSchedul.week == dayOfWeek){  //如果是今天的课
                classInSchedul.week = value.week;
                classInSchedul.order = value.order;
                classInSchedul.isExam = value.isExam;
                classInSchedul.name = thisCurriculum.name;  //存入这节课的名字
                classInSchedul.instructor = thisCurriculum.instructor;  //存入这节课的教师
                classInSchedul.group = thisCurriculum.group;    //存入这节课的课程群
                classInSchedul.district = thisCurriculum.district;  //存入这节课的地点
                classInSchedul.spot = thisCurriculum.spot;
                classInSchedul.classroom = thisCurriculum.classroom;
                todayClass.push(classInSchedul);  //将这节课存入今日课程的数组
            }
        })
    })

    todayClass.sort(function(a, b){return a.order - b.order});  //按时间顺序排序
    
    $.each(todayClass, function(index, value){
        var thisSlot = schedulTimeSlot[value.order];
        if(thisSlot.endHour >= hour){ //若这节课还没到结束时间
            //则这节课还存在于今日课表中，开始填充
            str += '<ul class="list-group class-card">';
            str += '<li class="list-group-item active"> &nbsp;';
            str += '<span class="pull-left">[ ';
            str += toTimeString(thisSlot.startHour, thisSlot.startMinute) + ' - ';
            str += toTimeString(thisSlot.endHour, thisSlot.endMinute) + ' ]</span></li>'
            str += '<li class="list-group-item">' + value.name + '</li>';
            str += '<li class="list-group-item">' + value.instructor + '</li>';
            str += '<li class="list-group-item">' + value.district + '-' + value.spot + '-' + value.classroom + '</li></ul>';
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
        if(value.week == dayOfWeek
            && value.hour >= hour){
                str += '<ul class="list-group activity-card">';
                str += '<li class="list-group-item active"> &nbsp;';
                str += '<span class="pull-left">[ ';
                str += toTimeString(value.hour, value.minute) + ' ]</span></li>';
                str += '<li class="list-group-item">';
                str += value.activity + '</li>';
                str += '<li class="list-group-item">';
                str += value.location + '</li></ul>';
            }
    })

    if(str == ''){
        str = '<strong>今天没有其他活动了哦！<strong>'
    }

    $('.activity-card-holder').html(str);
}

//刷新 课程表 窗口
refreshSchedul = function(){
    
    $.each(curriculumSchedul, function(index_1, curriculumInSchedul){

        var thisCurriculum = curriculumInfo.find(function(value){
            return value.name == curriculumInSchedul.name;
        }); //取得这节课的共有信息

        //遍历这种课的每一节
        $.each(curriculumInSchedul.info, function(index_2, value){
            var classInSchedul = {};    //需要深复制

            classInSchedul.week = value.week;
            classInSchedul.order = value.order;
            classInSchedul.isExam = value.isExam;
            classInSchedul.name = thisCurriculum.name;  //存入这节课的名字
            classInSchedul.instructor = thisCurriculum.instructor;  //存入这节课的教师
            classInSchedul.group = thisCurriculum.group;    //存入这节课的课程群
            classInSchedul.district = thisCurriculum.district;  //存入这节课的地点
            classInSchedul.spot = thisCurriculum.spot;
            classInSchedul.classroom = thisCurriculum.classroom;
            
            var thisSlot = $('#schedulTable tbody tr:eq(' + classInSchedul.order +')' 
                                                + ' td:eq(' + (classInSchedul.week + 1) +')');
            var str = '<div onclick="showSpecificCurriculum(\'' + thisCurriculum.name + '\')">'
                    + '<p>' + classInSchedul.name + '</p>'
                    + '<p>' + classInSchedul.instructor + '</p>'
                    + '<p>' + classInSchedul.district + '-' + classInSchedul.spot + '-' + classInSchedul.classroom + '</p>';
            if(classInSchedul.isExam == true){
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
        curriculumNames.push(value.name);
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

//待完善
//在所有课程窗口中，按下特定科目，弹出其对应特定作业窗口
showSpecificCurriculum = function(name){

    var classStr = '';
    var examStr = '';
    var homeworkStr = '';
    var uploadHomeworkStr = '';
    var uploadResourceStr = '';

    //将弹窗标题设置为该科目名称
    $('#specificCurriculum .modal-title').html(name);

    //提取该特定科目的共有信息
    var specificCurriculum = curriculumInfo.find(function(value){
        return value.name == name;
    })

    //提取该科目每节课的信息
    specificCurriculum.info = curriculumSchedul.find(function(value){
        return value.name == name;
    }).info;
    //此时specificCurriculum存储了该科目的共有信息，以及每节课的信息

    //开始设置弹窗内容
    $.each(specificCurriculum.info, function(index, thisClass){
        var timeSlotStr = toTimeString(schedulTimeSlot[thisClass.order].startHour, schedulTimeSlot[thisClass.order].startMinute)
                + ' - ' + toTimeString(schedulTimeSlot[thisClass.order].endHour, schedulTimeSlot[thisClass.order].endMinute);

        if(thisClass.isExam == false){
            classStr += '<tr><td>' + week[thisClass.week] + '&nbsp;' + timeSlotStr + '</td>'
                      + '<td>' + specificCurriculum.district + '-' + specificCurriculum.spot + '-' + specificCurriculum.classroom + '</td>'
                      + '<td>' + specificCurriculum.instructor + '</td>'
                      + '<td>' + specificCurriculum.group + '</td></tr>';
        }
        else{
            examStr += '<tr><td>' + week[thisClass.week] + '&nbsp;' + timeSlotStr + '</td>'
                      + '<td>' + specificCurriculum.district + '-' + specificCurriculum.spot + '-' + specificCurriculum.classroom + '</td>'
                      + '<td>' + specificCurriculum.instructor + '</td></tr>';
        }
    })


    /*
    /
    /
    /   此间待完善，根据课程不同设置窗口的不同内容
    /
    /
    */


    if(examStr == ''){
        examStr = '<tr><td>现在还没有考试哦！</td><td></td><td></td></tr>';
    }
    if(homeworkStr == ''){
        homeworkStr = '<p>老师还没有布置过作业哦！</p>'
    }
    if(uploadHomeworkStr == ''){
        uploadHomeworkStr = '<p>没有已上传的作业哦！</p>';
    }
    if(uploadResourceStr == ''){
        uploadResourceStr = '<p>没有已上传的资料哦！</p>';
    }

    $('#curriculumInfo table tbody').html(classStr);
    $('#examInfo table tbody').html(examStr);
    $('#homeworkContainer').html(homeworkStr);
    $('#uploadHomeworkContainer').html(uploadHomeworkStr);
    $('#uploadResourceContainer').html(uploadResourceStr);

    $('#specificCurriculum').modal('show');
}

//按下确认添加闹钟按钮，向clock数组中存入新建闹钟数据
addClock = function(){
    var newClock = {
        week: $('#addBellModal .week').val(),
        hour: $('#addBellModal .hour').val(),
        minute: $('#addBellModal .minute').val(),
        remark: $('#addBellModal .remark').val(),   //备注
        overTime: false //若该时间小于当前时间则为true，反之为false
    };

    newClock.overTime = (newClock.week == dayOfWeek) && (newClock.hour < hour)
                        || (newClock.week < dayOfWeek);

    clock.push(newClock);
    //对闹钟按时间顺序进行排序
    clock.sort(function(a, b){
        return (100*a.week + 10*a.hour + a.minute) - (100*b.week + 10*b.hour + b.minute);
    })

    refreshClocks();
}

//按下确认添加活动按钮，像activity数组中存入新建活动数据
addActivity = function(){

    //当活动内容和活动地点都填写了的情况下
    if($('#addActivityModal .location').val() && $('#addActivityModal .activity').val()){
        var newActivity = {
            week: $('#addActivityModal .week').val(),
            hour: $('#addActivityModal .hour').val(),
            minute: $('#addActivityModal .minute').val(),
            activity: $('#addActivityModal .activity').val(),   //活动内容
            location: $('#addActivityModal .location').val()    //活动地点
        };
        activity.push(newActivity);
        //对活动按时间顺序进行排序
        activity.sort(function(a, b){
            return (100*a.week + 10*a.hour + a.minute) - (100*b.week + 10*b.hour + b.minute);
        })
        refreshActivities();
        refreshTodayActivities();
        
        $('#addActivityModal').modal('hide');
    }
    
    //当活动内容没填写的情况下
    if($('#addActivityModal .activity').val() == ''){
        $('#activityWarning').css('visibility', 'visible');
    }
    else{
        $('#activityWarning').css('visibility', 'hidden');
    }

    //当活动地点没填写的情况下
    if(!$('#addActivityModal .location').val()){
        $('#locationWarning').css('visibility', 'visible');
    }
    else{
        $('#locationWarning').css('visibility', 'hidden');
    }
}

//刷新 设置闹钟 窗口
refreshClocks = function(){
    var bellsHolder = $('#bellsHolder');
    var str = '';
    $.each(clock, function(index, value){
        str += '<div class="alert alert-info">';
        str += '<a href="#" class="close" data-dismiss="alert" onclick="deleteClock(clock[$(this).parent().index()])">&times;</a>';
        str += '<strong>';
        str += week[value.week] + '&nbsp;&nbsp;';
        str += toTimeString(value.hour, value.minute); 
        str += '</strong>&nbsp;&nbsp;丨&nbsp;&nbsp;';
        str += value.remark;
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
        str += week[value.week] + '&nbsp;&nbsp;';
        str += toTimeString(value.hour, value.minute) + '&nbsp;&nbsp;';
        str += value.location;
        str += '</strong><br><br>';
        str += value.activity;
        str += '</div>';
    })

    //若activity数组中没有对象
    if(str == ''){
        str += '<strong style="margin: 10px;">当前没有活动哦！</strong>';
    }
    
    activitiesHolder.html(str);
}

//删除该闹钟
deleteClock = function(obj){
    clock.splice($.inArray(obj, clock), 1);
    refreshClocks();
}

//删除该活动
deleteActivity = function(obj){
    activity.splice($.inArray(obj, activity), 1);
    refreshActivities();
}

//闹钟时间到，闹钟响铃，弹出窗口
clockTimeUp = function(obj){
    pauseTimer();
    var str = '';

    str += '<h4><strong>';
    str += week[obj.week] + '&nbsp;&nbsp;';
    str += toTimeString(obj.hour, obj.minute);
    str += '</strong></h4>';
    str += '<p>' + obj.remark + '<p>';

    $('#ringBellModal .modal-body').html(str);
    $('#ringBellModal').modal('show');

    deleteClock(obj);
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

