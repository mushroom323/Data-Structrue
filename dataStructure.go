package main

//课程表信息
type Schedule_atom struct
{
	Name string
	Time []int
}

//课程时间表
type ScheduleTimeSlot_atom struct{
	StartHour int
	StartMinute int
	EndHour int
	EndMinute int
}

//课程信息
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
