
var clock = []; //保存当前所有闹钟的数据
var time = null;
var hour = 0;
var day = 0;
var month = 0;
var year = 2021;
var dayOfWeek = 0;
var week = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
const HoursPerDay = 24;
const DaysPerWeek = 7;
const DaysPerMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
const MonthsPerYear = 12;

$(document).ready(function(){
    //计时器，实现时间暂停与继续的功能
    var timer = $('#timer').on('click', function(){

        //当时间停止时按下按钮
        if(timer.hasClass('btn-success')){
            startTimer();
        }
        //当时间流动时按下按钮
        else if(timer.hasClass('btn-danger')){
            pauseTimer();   //暂停计时器
        }
    })

    startTimer = function(){
        //切换按钮样式
        timer.removeClass('btn-success');
        timer.addClass('btn-danger');
        timer.html('暂停计时');
        
        time = setInterval(function(){
            //设置时间
            hour = (++hour) % HoursPerDay;
            //设置小时
            var str = (hour < 10) ? '0' + hour + ':00' : hour + ':00';
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

        }, 12)
    }

    //暂停计时器
    pauseTimer = function(){
        //切换按钮样式
        timer.removeClass('btn-danger');
        timer.addClass('btn-success');
        timer.html('开始计时');

        clearInterval(time);
    }

    
    //课程信息相关
    $.getJSON('curriculum.json', function(curriculumInfo){

        //刷新 所有课程 窗口
        refreshSubjects = function(){
            var holder = $('#curriculumsHolder');
            var curriculums = [];

            //将保存课程信息的JSON 中的课程表schedul 中的所有课程名 存入curriculums数组
            $.each(curriculumInfo['schedul'], function(index, value){
                curriculums.push(value.curriculum);
            });
            
            //开始填充
            $.each(curriculums, function(index_1, value){
                holder.html(function(index_2, oldcontent){
                    var retval = oldcontent;

                    retval += '<a class="list-group-item" onclick="showSpecificCurriculum(this)">';
                    retval += '<span class="badge"></span>';
                    retval += value;
                    retval += '</a>';

                    return retval;
                });
            });
        }


        //在所有课程窗口中，按下特定科目，弹出其对应特定作业窗口
        showSpecificCurriculum = function(obj){
            //将弹窗标题设置为该科目名称
            $('#specificCurriculum .modal-title').html($(obj).text());
            $('#specificCurriculum').modal('show');

            /*
            /
            /
            /   此间待完善，根据课程不同设置窗口的不同内容
            /
            /
            */

        }

        
        refreshSubjects();
    })

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

        refreshClocks();
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
            str += (value.hour < 10) ? ('0' + value.hour) : value.hour;
            str += ':';
            str += (value.minute < 10) ? ('0' + value.minute) : value.minute;
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

    //删除该闹钟
    deleteClock = function(obj){
        clock.splice($.inArray(obj, clock), 1);
        refreshClocks();
    }

    //闹钟时间到，闹钟响铃，弹出窗口
    clockTimeUp = function(obj){
        pauseTimer();
        var str = '';

        str += '<h4><strong>';
        str += week[obj.week] + '&nbsp;&nbsp;';
        str += (obj.hour < 10) ? ('0' + obj.hour) : obj.hour;
        str += ':';
        str += (obj.minute < 10) ? ('0' + obj.minute) : obj.minute;
        str += '</strong></h4>';
        str += '<p>' + obj.remark + '<p>';

        $('#ringBellModal .modal-body').html(str);
        $('#ringBellModal').modal('show');

        deleteClock(obj);
    }

})


