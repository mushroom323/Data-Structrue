$(document).ready(function(){
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

    //计时器，实现时间暂停与继续的功能
    var timer = $('#timer').on('click', function(){

        //当时间停止时按下按钮
        if(timer.hasClass('btn-success')){
            //切换按钮样式
            timer.removeClass('btn-success');
            timer.addClass('btn-danger');
            timer.html('暂停计时');
            
            time = setInterval(function(){
                //设置时间
                ++hour;
                //设置小时
                var str = (hour % 24 < 10) ? '0' + (hour % HoursPerDay) + ':00' : (hour % HoursPerDay) + ':00'
                $('#timestamp li:eq(4)').html(str);
                
                if(hour % HoursPerDay == 0){
                    //设置星期几和日
                    ++day;
                    dayOfWeek = (++dayOfWeek) % DaysPerWeek;
                    $('#timestamp li:eq(3)').html(week[(dayOfWeek)]);
                    $('#timestamp li:eq(2)').html(day+1);

                    if(day % DaysPerMonth[month] == 0){
                        //设置月份
                        day = 0;
                        ++month;
                        $('#timestamp li:eq(2)').html(day+1);
                        $('#timestamp li:eq(1)').html(month+1);

                        if(month % MonthsPerYear == 0){
                            //设置年份
                            month = 0;
                            year++;
                            $('#timestamp li:eq(1)').html(month+1);
                            $('#timestamp li:eq(0)').html(year);
                        }
                    }
                }

            }, 12)
        }
        //当时间流动时按下按钮
        else if(timer.hasClass('btn-danger')){
            //切换按钮样式
            timer.removeClass('btn-danger');
            timer.addClass('btn-success');
            timer.html('开始计时');

            clearInterval(time);
        }
    })
})