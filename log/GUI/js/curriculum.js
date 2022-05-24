
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

//在所有课程窗口中，按下特定科目，弹出其对应特定课程信息窗口
showSpecificCurriculum = function(name){

    //将弹窗标题设置为该科目名称
    $('#specificCurriculum .modal-title').html(name);

    currentPageCurriculumName = name;   //当前科目名称

    refreshSpecClassAndExam(name);      //刷新该科目的课程和考试信息
    refreshSpecHomework(name);          //刷新该科目的已布置作业
    refreshSpecUploadHomework(name);    //刷新该科目的已上传作业
    refreshSpecUploadResource(name);    //刷新该科目的已上传资料

    $('#specificCurriculum').modal('show'); //弹出课程信息窗口
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
        
        sendTimeInfo();
        
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

                sendTimeInfo();
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

        sendTimeInfo();
        $.get("/api/changeClassInfo", {NameStr: curriculumName, 
                                        NewClassStr: JSON.stringify(newClass), OldClassStr: JSON.stringify(oldClass)});
    }
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
        
        $('#assignHomeworkModal').modal('hide');

        sendTimeInfo();

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

    sendTimeInfo();
    $.ajaxSettings.async = false;
    $.ajax({
        type : "post",
        url : "/api/upLoadHomework",
        data : formData,
        processData : false,
        contentType : false,
        success: function(data){
            if(data.IsDuplicated == true){
                errorWarning.html('该文件已存在！');
                exist = true;
            }
        }
    })
    $.ajaxSettings.async = true;

    if(exist == true)
        return false;

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
    else if(fileName1 != "doc" && fileName1 !="docx" && fileName1 != "bmp"){
        errorWarning.html('请选择word或bmp文件!');			
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
    
    sendTimeInfo();
    $.ajaxSettings.async = false;
    $.ajax({
        type : "post",
        url : "/api/upLoadResource",
        data : formData,
        processData : false,
        contentType : false,
        success: function(data){
            if(data.IsDuplicated == true){
                errorWarning.html('该文件已存在！');
                exist = true;
            }
        }
    })
    $.ajaxSettings.async = true;

    if(exist == true)
        return false;

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

