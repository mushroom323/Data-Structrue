var time = null;
var timer = null;
var minute = 0;
var hour = 0;
var day = 3;
var month = 0;
var year = 2021;
var dayOfWeek = 0;
var millisecondsPerMinute;
var week = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
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

var isAdmin = true;    //当前账户是否是管理员

var district = [
    {
        Name: "沙河校区",
        Spot: [
            {
                Name: "教学楼",
                Classroom: ["N111","N222","N333"]
            },
            {
                Name: "操场",
                Classroom: ["操场"]
            },
            {
                Name: "办公楼",
                Classroom: ["S111","S222","S333"]
            }
        ]
    },
      
    {
        Name: "西土城校区",
        Spot: [
            {
                Name: "实验楼",
                Classroom: ["A111","A222","A333"]
            },
            {
                Name: "创业楼",
                Classroom: ["B111","B222","B333"]
            },
            {
                Name: "活动楼",
                Classroom: ["C111","C222","C333"]
            }
        ]
    }
]


//及其重要的取消异步
$.ajaxSettings.async = false;
//课程信息相关
$.getJSON('/api/getCurriculums', function(data){curriculumInfo = data;})
$.getJSON('/api/getSchedule', function(data){curriculumSchedul = data;})
$.getJSON('/api/getScheduleTimeSlot', function(data){schedulTimeSlot = data;})


// $.getJSON('config.json', function(data){curriculumInfo = data;})
// curriculumSchedul = curriculumInfo.schedul;
// schedulTimeSlot = curriculumInfo.schedulTimeSlot;
// curriculumInfo = curriculumInfo.curriculums;

$.ajaxSettings.async = true;





$(document).ready(function(){
    millisecondsPerMinute = originMillisecondsPerHour / MinutesPerHour;

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
    fillCurriculumSelect();

    //触发所有选择地点下拉框的onchange事件，该事件将三个地点全部加载好
    $('.district').trigger('onchange');
})

//切换计时器速度
switchTimeRatio = function(){
    var switcher = $('#switchTimeRatioBtn');
    var ratio;
    var isPausing = false;
    if(timer.hasClass('btn-success')){
        isPausing = true;
    }

    if(switcher.html() == '一倍速'){
        switcher.html('二倍速');
        ratio = 2;
    }
    else if(switcher.html() == '二倍速'){
        switcher.html('五倍速');
        ratio = 5;
    }
    else if(switcher.html() == '五倍速'){
        switcher.html('十倍速');
        ratio = 10;
    }
    else if(switcher.html() == '十倍速'){
        switcher.html('一倍速');
        ratio = 1;
    }

    pauseTimer();
    millisecondsPerMinute = originMillisecondsPerHour / MinutesPerHour / ratio;
    //若按下切换倍速按钮时，时间处于流动状态，则打开计时器
    if(isPausing == false){
        startTimer();
    }
}

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
        //删除已过期的考试
        deleteExam();
        
    }, millisecondsPerMinute);
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
    if(dayOfWeek == 0 && hour == 0){
        $.each(clock, function(index, value){
            value.OverTime = false;
        });
    }

    //当闹钟响了以后弹窗并删除闹钟
    $.each(clock, function(index, value){
        if(value && (value.OverTime == false) && (value.Week <= dayOfWeek) && (value.Hour <= hour)){
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
            && 60*value.Hour + value.Minute >= 60*hour + minute){
                str += '<ul class="list-group activity-card">';
                str += '<li class="list-group-item active"> &nbsp;';
                str += '<span class="pull-left">[ ';
                str += toTimeString(value.Hour, value.Minute) + ' ]</span>';
                str += '<span class="pull-right">' + value.ActivityType + '</span></li>';
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

//待完善
//在所有课程窗口中，按下特定科目，弹出其对应特定作业窗口
showSpecificCurriculum = function(name){

    //将弹窗标题设置为该科目名称
    $('#specificCurriculum .modal-title').html(name);

    refreshSpecClassAndExam(name);
    refreshSpecHomework(name);
    refreshSpecUploadHomework(name);
    refreshSpecUploadResource(name);

    $('#specificCurriculum').modal('show');
}

//刷新该科目的课程和考试信息
refreshSpecClassAndExam = function(name){
    var classStr = '';
    var examStr = '';
    
    // if(isAdmin == true){
    //     $('#assignExamBtn').css('display', 'block');
    // }
    // else{
    //     $('#assignExamBtn').css('display', 'none');
    // }

    //提取该特定科目的共有信息
    var specificCurriculum = curriculumInfo.find(function(value){
        return value.Name == name;
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
refreshSpecHomework = function(name){
    var homeworkStr = '';

    // if(isAdmin == true){
    //     $('#assignHomeworkBtn').css('display', 'block');
    // }
    // else{
    //     $('#assignHomeworkBtn').css('display', 'none');
    // }
    
    //提取该特定科目的共有信息
    var specificCurriculum = curriculumInfo.find(function(value){
        return value.Name == name;
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
                  + '<span class="pull-right date">' + thisHomework.Year + ' / ' + (thisHomework.Month+1) + ' / ' + (thisHomework.Day+1) + '</span>'
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

//刷新该科目的已上传作业
refreshSpecUploadHomework = function(name){
    var uploadHomeworkStr = '';

    //提取该特定科目的共有信息
    var specificCurriculum = curriculumInfo.find(function(value){
        return value.Name == name;
    })

    if(uploadHomeworkStr == ''){
        uploadHomeworkStr = '<p>没有已上传的作业哦！</p>';
    }
    $('#uploadHomeworkContainer').html(uploadHomeworkStr);
}

//刷新该科目的已上传资料
refreshSpecUploadResource = function(name){
    var uploadResourceStr = '';
    
    //提取该特定科目的共有信息
    var specificCurriculum = curriculumInfo.find(function(value){
        return value.Name == name;
    })

    if(uploadResourceStr == ''){
        uploadResourceStr = '<p>没有已上传的资料哦！</p>';
    }
    $('#uploadResourceContainer').html(uploadResourceStr);
}

//按下确认添加闹钟按钮，向clock数组中存入新建闹钟数据
addClock = function(){
    var newClock = {
        Week: $('#addBellModal .week').val(),
        Hour: $('#addBellModal .hour').val(),
        Minute: $('#addBellModal .minute').val(),
        Remark: $('#addBellModal .remark').val(),   //备注
        OverTime: false //若该时间小于当前时间则为true，反之为false
    };

    newClock.OverTime = 1440*newClock.Week + 60*newClock.Hour + newClock.Minute
                      < 1440*dayOfWeek + 60*hour + minute;

    clock.push(newClock);
    //对闹钟按时间顺序进行排序
    clock.sort(function(a, b){
        return (100*a.Week + 10*a.Hour + a.Minute) - (100*b.Week + 10*b.Hour + b.Minute);
    })

    refreshClocks();
}

//按下确认添加活动按钮，像activity数组中存入新建活动数据
addActivity = function(){

    //当活动内容填写了的情况下
    if($('#addActivityModal .activity').val()){
        var newActivity = {
            Week: $('#addActivityModal .week').val(),
            Hour: $('#addActivityModal .hour').val(),
            Minute: $('#addActivityModal .minute').val(),
            District: $('#addActivityModal .district').val(),
            Spot: $('#addActivityModal .spot').val(),
            Classroom: $('#addActivityModal .classroom').val(),
            Activity: $('#addActivityModal .activity').val(),   //活动内容
            ActivityType: $('#addActivityModal .activityType input:radio:checked').val()
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
    }
    else{
        $('#addActivityModal .modal-footer span strong').html('还没有填写活动内容！');
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
        str += week[value.Week] + '&nbsp;&nbsp;';
        str += toTimeString(value.Hour, value.Minute); 
        str += '</strong>&nbsp;&nbsp;丨&nbsp;&nbsp;';
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
        str += '<span class="pull-right" style="margin-right: 20px;">' + value.ActivityType + '</span>'
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
    str += week[obj.Week] + '&nbsp;&nbsp;';
    str += toTimeString(obj.Hour, obj.Minute);
    str += '</strong></h4>';
    str += '<p>' + obj.Remark + '<p>';

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

        for(var i = examStartOrder; i <= examEndOrder; i++){
            var newExam = {};
            newExam.Week = parseInt(examWeek);
            newExam.Order = parseInt(i);
            newExam.IsExam = true;
            newExam.District = examDistrict;
            newExam.Spot = examSpot;
            newExam.Classroom = examClassroom;
            newExamGroup.push(newExam);
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
                && 60*schedulTimeSlot[obj.Order].EndHour + schedulTimeSlot[obj.Order].EndMinute <= 60*hour + minute){

                curriculumInSchedul.Info.splice(i, 1);
                refreshSchedul();
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
        deleteCurriculumInSchedul.Info.splice(deleteIndex, 1);
        deleteCurriculumInSchedul.Info.push(newClass)
        errorWarning.html('');
        refreshSchedul();
        $('#changeClassInfoModal').modal('hide');
    }
}

//把所有包含所有课程的下拉框填满
fillCurriculumSelect = function(){
    var str = '';

    $.each(curriculumSchedul, function(index, curriculumInSchedul){
        str += '<option value=' + curriculumInSchedul.Name + '>' + curriculumInSchedul.Name + '</option>';
    })

    //包含所有课程的下拉框
    $('.curriculumSelect').each(function(index, value){
        $(value).html(str)
    })
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
            HasFinished: false
        };

        specCurriculumHomework.push(newHomework);
        
        $('#assignHomeworkModal').modal('hide');
    }
    else{
        errorWarning.html('作业标题或作业描述未填写！');
    }
}

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