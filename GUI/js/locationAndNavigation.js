
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
    
    var passbyDistrictName = $('#passbyLocate .district').val();
    var passbySpotName = $('#passbyLocate .spot').val();
    var passbyChecked = $('#passby').prop("checked");
    var passbyDistrict, passbySpot;
    var passbyID;

    if(passbyChecked){
        $.each(district, function(index, value){
            if(value.Name == passbyDistrictName){
                passbyDistrict = value;
                return;
            }
        })
        $.each(passbyDistrict.Spot, function(index, value){
            if(value.Name == passbySpotName){
                passbySpot = value;
                return;
            }
        })
        passbyID = passbySpot.ID;
    }

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
        $('#startNavigation #navTip').html('<span style="color: red; font-weight: bold;">您已在目的地点，无需导航！</span>');
        $('#startNavigation #navTip').css('opacity','1')
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
        if(passbyDistrictName != currentDistrictName){
            $('#startNavigation #navTip').html('<span style="color: red; font-weight: bold;">途径点不在同一校区！</span>');
            $('#startNavigation #navTip').css('opacity','1')
            return;
        }

        $.ajaxSettings.async = false;
        if(passbyChecked)
            $.get('/api/getMultiRoute', {CurrentID:JSON.stringify(currentID), DestID:JSON.stringify(destID),
                PathWay:JSON.stringify(passbyID)}, function(data){setRoute(data.Path);});
        else
            $.get('/api/getRoute', {CurrentID:JSON.stringify(currentID), DestID:JSON.stringify(destID),
                                    BikeOrWalk:bikeOrWalk, CrowdConsidered:JSON.stringify(crowdConsidered)}, function(data){setRoute(data.Path);});
        $.ajaxSettings.async = true;

        sendTimeInfo();
        $.get('/api/travelInfo', {TravelInfo:JSON.stringify({TravelContent:"start"})});

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

                    
                    sendTimeInfo();
                    $.get('/api/travelInfo', {TravelInfo:JSON.stringify({TravelContent:"stop"})});
                }
            }
        }, millisecondsPerMinute);
    }
    else{           //若起点和终点在不同校区
        if(passbyChecked){
            $('#startNavigation #navTip').html('<span style="color: red; font-weight: bold;">起点、终点不在同一校区！</span>');
            $('#startNavigation #navTip').css('opacity','1')
            return;
        }
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
        if(currentID != busStationID_ShaHe && currentID != busStationID_XiTuCheng){
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
        
        sendTimeInfo();
        $.get('/api/travelInfo', {TravelInfo:JSON.stringify({TravelContent:"start"})});
        
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
                        $.get('/api/travelInfo', {TravelInfo:JSON.stringify({TravelContent:"noBus"})});
                        stopNavigation();
                        $('#startNavigation #navTip').html('<span style="color: red; font-weight: bold;">今天已经没有巴士了</span>');
                        $('#startNavigation #navTip').css('opacity','1')
                        isWatingBus = false;
                        return;
                    }

                    sendTimeInfo();
                    $.get('/api/travelInfo', {TravelInfo:JSON.stringify({TravelContent:"waitBus"})});

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
                        
                        sendTimeInfo();
                        $.get('/api/travelInfo', {TravelInfo:JSON.stringify({TravelContent:"busArrive"})});
                        
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

                                    
                                    $.ajaxSettings.async = false;
                                    $.get('/api/getRoute', {CurrentID:JSON.stringify(destBusStationID), DestID:JSON.stringify(destID),
                                                            BikeOrWalk:bikeOrWalk, CrowdConsidered:JSON.stringify(crowdConsidered)}, function(data){setRoute(data.Path);});
                                    $.ajaxSettings.async = true;

                                    sendTimeInfo();
                                    $.get('/api/travelInfo', {TravelInfo:JSON.stringify({TravelContent:"busReachDest"})});
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

                                                sendTimeInfo();
                                                $.get('/api/travelInfo', {TravelInfo:JSON.stringify({TravelContent:"stop"})});
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
    //地图上途径路线的点集
    navMinute = parseInt(navMinute) + 1;
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
    $('#startNavigationBtn').removeAttr('disabled');
    console.log(1)
    if(trackAni == null)
        return;
        console.log(2)

    if(navStarted == true || isWatingBus == true){
        //若导航已开始，则继续导航
        console.log(toTimeString(hour,minute)+' '+'继续移动');
        trackAni.continue();
    }
    else{
        //若导航未开始，则开始导航，并设置导航已开始，设置取消导航按钮为可点击状态
        trackAni.start();
        navStarted = true;
    }

    sendTimeInfo();
    $.get('/api/travelInfo', {TravelInfo:JSON.stringify({TravelContent:"continue"})});
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

    sendTimeInfo();
    $.get('/api/travelInfo', {TravelInfo:JSON.stringify({TravelContent:"pause"})});
}

//停止导航
stopNavigation = function(){
    
    $('#switchTimeRatioBtn').removeAttr('disabled');
    $('#startNavigationBtn').removeAttr('disabled');
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
    sendTimeInfo();
    $.get('/api/travelInfo', {TravelInfo:JSON.stringify({TravelContent:"cancel"})});

    if(trackAni != null)
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
