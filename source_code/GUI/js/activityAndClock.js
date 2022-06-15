
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
        $('#addActivityModal .modal-footer span strong').html('与课程时间或活动时间冲突！');
    }
    else{
        $('#addActivityModal .modal-footer span strong').html('');
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

    $('#addBellModal').modal('hide');
    $('#bellModal').css({'overflow-y':'scroll'});

    sendTimeInfo();
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
        $('#activityModal').css({'overflow-y':'scroll'});

        sendTimeInfo();
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
    var sortType = $('#activityModal input:radio:checked').val();
    var holder = $('#activitiesHolder');
    var str = '';
    console.log(sortType)

    $.get('/api/searchActivity', {Text:text, Type:activityType, Content:activityContent, Option:sortType}, function(data){

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
    sendTimeInfo();
    $.get("/api/deleteClock", {ClockStr:JSON.stringify(obj)});

    clock.splice($.inArray(obj, clock), 1);
    refreshClocks();
}

//删除该活动
deleteActivity = function(obj){
    sendTimeInfo();
    $.get("/api/deleteActivity", {ActivityStr:JSON.stringify(obj)});

    activity.splice($.inArray(obj, activity), 1);
    refreshActivities();
}

//闹钟时间到，闹钟响铃，弹出窗口
clockTimeUp = function(obj){
    pauseTimer();
    var str = '';

    str += '<h4><strong>';
    if(obj.ClockCycle != '每天一次')
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
