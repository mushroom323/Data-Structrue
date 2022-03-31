package main

//课程表信息
type Schedule_atom struct
{
	Name string
	Info []struct{
		Week int
		Order int
		IsExam bool
	}
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
	Instructor string
	Group string
	District string
	Spot string
	Classroom string
}
