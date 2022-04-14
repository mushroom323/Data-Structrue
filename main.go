package main

import (
	"sync"
)

var port int
var scheList []Schedule_atom
var scheSlotList []ScheduleTimeSlot_atom
var curriList []Curriculums_atom
var wg sync.WaitGroup
var nowTime = Time{
	Year:   2021,
	Month:  0,
	Day:    3,
	Week:   0,
	Hour:   0,
	Minute: 0,
}
var location []Location
var roadlist []Road
var clockList ClockList
var coordiList [2]Coordinate
var activityList ActivityList
var activityType ActivityType
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

	wg.Add(1)
	go StartServer()
	wg.Wait()
}
