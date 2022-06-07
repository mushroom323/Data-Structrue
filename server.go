package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strconv"
	"strings"
)

func ServerTest() {
	for {
		res, err := http.Get("http://localhost:" + strconv.FormatInt(int64(port), 10) + "/api/isServing")
		if err == nil {
			defer res.Body.Close()
			body, _ := ioutil.ReadAll(res.Body)
			if string(body) == "true" {
				Log(fmt.Sprintf("Web 服务启动成功，请访问 http://localhost:%d 进入系统", port))
				break
			}
		}
	}

}

func APIHandler(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("content-type", "application/json")

	query := req.URL.Query()
	switch req.URL.Path {
	case "/api/isServing": //判断web服务是否成功启动
		w.Write([]byte("true"))
	case "/api/getCurriculums": //获取课程信息
		data, _ := json.Marshal(curriList)
		w.Write(data)
	case "/api/getSchedule": //获取课程表信息
		data, _ := json.Marshal(scheList)
		w.Write(data)
	case "/api/getScheduleTimeSlot": //获取课程时间表信息
		data, _ := json.Marshal(scheSlotList)
		w.Write(data)
	case "/api/getActivityType": //获取活动种类
		data, _ := json.Marshal(activityType)
		w.Write(data)
	case "/api/getBusTime": //获取巴士发车时间
		data, _ := json.Marshal(busSchedule)
		w.Write(data)
	case "/api/upLoadHomework": //上传作业文件
		file, header, _ := req.FormFile("upfile")
		curriName := req.FormValue("curriculumName")
		homeworkName := req.FormValue("homeworkName")
		version := req.FormValue("version")
		b, _ := ioutil.ReadAll(file)
		data, _ := json.Marshal(uploadHomework(b, header.Filename, curriName, homeworkName, version))
		w.Write(data)
	case "/api/upLoadResource": //上传资料文件
		file, header, _ := req.FormFile("upfile")
		curriName := req.FormValue("curriculumName")
		b, _ := ioutil.ReadAll(file)
		data, _ := json.Marshal(uploadResource(b, header.Filename, curriName))
		w.Write(data)
	case "/api/downLoad": //下载文件api
		fn := req.FormValue("filename")
		header := w.Header()
		header.Add("Content-Type", "application/octet-stream")
		header.Add("Content-Disposition", "attachment;filename="+fn)
		b := download(fn)
		w.Write(b)
	case "/api/getClocks": //获取闹钟列表
		data, _ := json.Marshal(clockList)
		w.Write(data)
	case "/api/getTime": //获取系统时间
		data, _ := json.Marshal(nowTime)
		w.Write(data)
	case "/api/getActivity": //获取活动列表
		data, _ := json.Marshal(activityList)
		w.Write(data)
	case "/api/getCoordinate": //获取校区信息
		data, _ := json.Marshal(coordiList)
		w.Write(data)
	case "/api/getController": //获取校区信息
		data, _ := json.Marshal(controller)
		w.Write(data)
	case "/api/setController": //设置校区信息
		controllerStr := query.Get("controllerStr")
		err = json.Unmarshal([]byte(controllerStr), &controller)
		Log(fmt.Sprintf("%s  控制信息：[是否为管理员: %t, 是否暂停时间: %t, 时间倍速: %d]\n", timeString(nowTime), controller.IsAdmin, controller.IsPausing, controller.Multi_speed))
	case "/api/setTime": //设置系统时间信息
		TimeStr := query.Get("TimeStr")
		err = json.Unmarshal([]byte(TimeStr), &nowTime)
	case "/api/addClock": //添加闹钟
		ClockStr := query.Get("ClockStr")
		var newClock Clock
		err = json.Unmarshal([]byte(ClockStr), &newClock)
		addClock(newClock)
	case "/api/addActivity": //添加活动
		ActivityStr := query.Get("ActivityStr")
		var newActivity Activity
		err = json.Unmarshal([]byte(ActivityStr), &newActivity)
		activityList = addActivity(newActivity, activityList)
		Log(fmt.Sprintf("%s  增加活动: [星期%d %02d:%02d, 地点: %s-%s-%s, 活动: %s, 活动类型: %s-%s]\n", timeString(nowTime), (newActivity.Week + 1), newActivity.Hour, newActivity.Minute, newActivity.District, newActivity.Spot, newActivity.Classroom, newActivity.Activity, newActivity.ActivityType, newActivity.ActivityContent))
	case "/api/deleteClock": //删除闹钟
		ClockStr := query.Get("ClockStr")
		var deClock Clock
		err = json.Unmarshal([]byte(ClockStr), &deClock)
		deleteClock(deClock)
	case "/api/deleteActivity": //删除活动
		ActivityStr := query.Get("ActivityStr")
		var deActivity Activity
		err = json.Unmarshal([]byte(ActivityStr), &deActivity)
		deleteActivity(deActivity)
	case "/api/assignExam": //新增考试
		ExamStr := query.Get("ExamStr")
		curriName := query.Get("NameStr")
		var newExam Schedule_Info
		err = json.Unmarshal([]byte(ExamStr), &newExam)
		assignExam(newExam, curriName)
	case "/api/deleteExam": //删除考试
		ExamStr := query.Get("ExamStr")
		curriName := query.Get("NameStr")
		var deExam Schedule_Info
		err = json.Unmarshal([]byte(ExamStr), &deExam)
		deleteExam(deExam, curriName)
	case "/api/changeClassInfo": //变更课程信息
		NameStr := query.Get("NameStr")
		NewClassStr := query.Get("NewClassStr")
		OldClassStr := query.Get("OldClassStr")
		var NewClass Schedule_Info
		var OldClass Schedule_Info
		err = json.Unmarshal([]byte(NewClassStr), &NewClass)
		err = json.Unmarshal([]byte(OldClassStr), &OldClass)
		changeClassInfo(NameStr, NewClass, OldClass)
	case "/api/assignHomework": //删除考试
		HomeworkStr := query.Get("HomeworkStr")
		NameStr := query.Get("NameStr")
		var NewHomework Homework
		err = json.Unmarshal([]byte(HomeworkStr), &NewHomework)
		assignHomework(NameStr, NewHomework)
	case "/api/uploadHomeworkFile": //上传作业文件
		TitleStr := query.Get("TitleStr")
		curriName := query.Get("CurriculumNameStr")
		upFileStr := query.Get("UpFileStr")
		var upFile Uploaded
		err = json.Unmarshal([]byte(upFileStr), &upFile)
		uploadHomeworkFile(upFile, curriName, TitleStr)
	case "/api/uploadResourceFile": //上传资料文件
		curriName := query.Get("CurriculumNameStr")
		newResourceStr := query.Get("ResourceStr")
		var newResource Resource
		err = json.Unmarshal([]byte(newResourceStr), &newResource)
		uploadResourceFile(newResource, curriName)
	case "/api/searchCurriculum": //搜索课程
		Text := query.Get("Text")
		result := searchCurriculum(Text)
		data, _ := json.Marshal(result)
		w.Write(data)
	case "/api/searchHomework": //搜索作业
		Text := query.Get("Text")
		CurriName := query.Get("CurriculumName")
		result := searchHomework(Text, CurriName)
		data, _ := json.Marshal(result)
		w.Write(data)
	case "/api/searchResource": //搜索资料
		Text := query.Get("Text")
		CurriName := query.Get("CurriculumName")
		result := searchResource(Text, CurriName)
		data, _ := json.Marshal(result)
		w.Write(data)
	case "/api/searchActivity": //搜索活动
		Text := query.Get("Text")
		typeName := query.Get("Type")
		Content := query.Get("Content")
		result := searchActivity(Text, typeName, Content)
		data, _ := json.Marshal(result)
		w.Write(data)
	case "/api/getRoute": //导航
		originStr := query.Get("CurrentID")
		destinationStr := query.Get("DestID")
		pattern := query.Get("BikeOrWalk")
		isCrowdStr := query.Get("CrowdConsidered")
		origin, _ := strconv.Atoi(originStr)
		destination, _ := strconv.Atoi(destinationStr)
		isCrowd, _ := strconv.ParseBool(isCrowdStr)
		var pathway []int
		if pattern == "walk" {
			w.Write(AddTravel(origin, destination, false, isCrowd, pathway))
		} else {
			w.Write(AddTravel(origin, destination, true, isCrowd, pathway))
		}
	case "/api/getMultiRoute": //途径多个地点的最短路径策略
		originStr := query.Get("CurrentID")
		destinationStr := query.Get("DestID")
		st := ","
		pathwayStr := query.Get("PathWay")
		pathwaySlice := strings.Split(pathwayStr, st)
		var pathway []int
		for _, v := range pathwaySlice {
			vv, _ := strconv.Atoi(v)
			pathway = append(pathway, vv)
		}
		origin, _ := strconv.Atoi(originStr)
		destination, _ := strconv.Atoi(destinationStr)
		isCrowd := false
		w.Write(AddTravel(origin, destination, false, isCrowd, pathway))
	case "/api/travelInfo": //导航Log输出
		travelInfoStr := query.Get("TravelInfo")
		var travelInfo TravelInfo
		err = json.Unmarshal([]byte(travelInfoStr), &travelInfo)
		printTravelInfo(travelInfo)
	case "/api/getTransInfo":
		//TODO 获取路径信息
		// data, _ := json.Marshal(transportList)
		// w.Write(data)
	case "/api/getStatus":
		//TODO 获取当前状态
		// data, _ := json.Marshal(status)
		// w.Write(data)
	case "/api/startTimer":
		//TODO 开始计时
		// if !status.IsRunning {
		// 	wg.Add(1)
		// 	go StartTimer()
		// }
	case "/api/pauseTimer":
		//TODO 暂停计时
		// if status.IsRunning {
		// 	PauseTimer()
		// }
	// case "/api/exit": //退出后端服务器api
	// 	Log("系统已退出，您可以到log目录中查看日志")
	// 	WriteConfig()
	// 	os.Exit(1)
	case "/api/save":
		Log("数据保存成功！")
		Zip("./file", "./file.zip")
		WriteConfig()
	}

}

func StartServer() {
	http.HandleFunc("/api/", APIHandler)
	http.Handle("/", http.FileServer(http.Dir("GUI")))
	go ServerTest()
	err := http.ListenAndServe(":"+strconv.FormatInt(int64(port), 10), nil)
	if err != nil {
		Log(fmt.Sprintf("Web 服务启动失败，请检查您的防火墙设置并确保 %d 端口没有被占用", port))
		os.Exit(1)
	}
	wg.Done()
}
