package main

//课程表信息
type Schedule_atom struct {
	Name string
	Info []struct {
		Week      int
		Order     int
		IsExam    bool
		District  string
		Spot      string
		Classroom string
	}
}

//课程时间表
type ScheduleTimeSlot_atom struct {
	StartHour   int
	StartMinute int
	EndHour     int
	EndMinute   int
}

//课程信息
type Curriculums_atom struct {
	Name       string
	Instructor string
	Group      string
	Homework   []struct {
		Title       string
		Description string
		Year        int
		Month       int
		Day         int
		HasFinished bool
	}
}
