package main

import (
    "fmt"
    "os"
    "io/ioutil"
    "encoding/json"
)

type Schedule_atom struct
{
	Name string
	Time []int
}

type ScheduleTimeSlot_atom struct{
	StartHour int
	StartMinute int
	EndHour int
	EndMinute int
}



type Curriculums_atom struct{
	Name string
	Time []struct{
		Week int
		Instructor string
		Group string
		Location string
		Order int
		ExamTime interface{}
		ExamPlace interface{}
	}
}

var port int
var  scheList []Schedule_atom
var scheSlotList []ScheduleTimeSlot_atom
var curriList []Curriculums_atom

var  num string
type ConfigFile struct {
	Port int
	Schedule []Schedule_atom
	ScheduleTimeSlot []ScheduleTimeSlot_atom
	Curriculums []Curriculums_atom
}


func main(){
	data,err := ioutil.ReadFile("config.json")
	if err != nil{
		fmt.Println("打开文件失败")
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
	fmt.Println(config.Port)
	num = scheList[0].Name
	fmt.Printf("成功加载 %d 门课程",len(num))
}