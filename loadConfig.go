package main

import (
    "fmt"
    "os"
    "io/ioutil"
    "encoding/json"
)

type ConfigFile struct {
	Port int
	Schedule []Schedule_atom
	ScheduleTimeSlot []ScheduleTimeSlot_atom
	Curriculums []Curriculums_atom
	Location []Location
	Road     []Road
}


func LoadConfig(){
	data,err := ioutil.ReadFile("config.json")
	if err != nil{
		Log("打开数据文件失败，请将 config.json 置于程序所在目录下")
		os.Exit(1)
	}

	var config ConfigFile
	err = json.Unmarshal(data,&config)
	if err != nil {
		fmt.Println("解析 config.json 失败，请检查JSON格式")
		os.Exit(1)
	}

	port = config.Port
	scheList = config.Schedule
	scheSlotList = config.ScheduleTimeSlot
	curriList = config.Curriculums
	
	Log(fmt.Sprintf("成功加载 %d 门课程",len(curriList)))

}