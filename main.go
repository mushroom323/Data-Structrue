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
var clockList ClockList
var coordiList [2]Coordinate
var activityList ActivityList
var controller Controller

func main() {
	InitLog()
	Log("正在初始化")
	LoadConfig()
	Log("初始化完成")

	wg.Add(1)
	go StartServer()
	wg.Wait()
}
