package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
)

type ConfigFile struct {
	Port             int
	Time             Time
	Schedule         []Schedule_atom
	ScheduleTimeSlot []ScheduleTimeSlot_atom
	Curriculums      []Curriculums_atom
	Location         []Location
	Road             []Road
	ActivityType     []ActivityType_atom
	BusSchedule      []BusSchedule_atom
	District         []Coordinate
	Activity         ActivityList
}

func LoadConfig() {
	data, err := ioutil.ReadFile("source_code/config.json")
	if err != nil {
		Log("打开数据文件失败，请将 config.json 置于程序所在目录下")
		os.Exit(1)
	}

	var config ConfigFile
	err = json.Unmarshal(data, &config)
	if err != nil {
		fmt.Println("解析 config.json 失败，请检查JSON格式")
		os.Exit(1)
	}

	port = config.Port
	nowTime = config.Time
	scheList = config.Schedule
	scheSlotList = config.ScheduleTimeSlot
	curriList = config.Curriculums
	location = config.Location
	roadlist = config.Road
	activityType = config.ActivityType
	busSchedule = config.BusSchedule
	coordiList = config.District
	activityList = config.Activity

	Log(fmt.Sprintf("成功加载 %d 门课程", len(curriList)))
}

func WriteConfig() {
	fp, err := os.OpenFile("source_code/config.json", os.O_RDWR|os.O_TRUNC|os.O_CREATE, 0766)
	if err != nil {
		Log("打开数据文件失败，请将 config.json 置于程序所在目录下")
		os.Exit(1)
	}
	defer fp.Close()
	var config ConfigFile

	config.Port = port
	config.Time = nowTime
	config.Schedule = scheList
	config.ScheduleTimeSlot = scheSlotList
	config.Curriculums = curriList
	config.Location = location
	config.Road = roadlist
	config.ActivityType = activityType
	config.BusSchedule = busSchedule
	config.District = coordiList
	config.Activity = activityList

	data, _ := json.Marshal(config)

	_, err = fp.Write(data)
	if err != nil {
		Log("写入 config.json 失败")
	}
}
