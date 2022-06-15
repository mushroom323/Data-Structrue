package main

import (
	"sync"
)

var port int
var scheList []Schedule_atom
var scheSlotList []ScheduleTimeSlot_atom
var curriList []Curriculums_atom
var wg sync.WaitGroup
var nowTime Time
var location []Location
var roadlist []Road
var clockList ClockList
var coordiList []Coordinate
var activityList ActivityList
var activityType []ActivityType_atom
var busSchedule []BusSchedule_atom
var controller = Controller{
	IsAdmin:     false,
	IsPausing:   true,
	Multi_speed: 1,
}

func main() {
	InitLog()
	Log("正在初始化")
	LoadConfig()
	Log("初始化完成")
	CreateGraph()

	wg.Add(1)
	go StartServer()
	wg.Wait()
}
