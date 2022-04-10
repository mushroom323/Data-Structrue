package main

//课程表信息
type Schedule_atom struct {
	Name string
	Info []Schedule_Info
}

type Schedule_Info struct {
	Week      int
	Order     int
	IsExam    bool
	District  string
	Spot      string
	Classroom string
}

//课程时间表
type ScheduleTimeSlot_atom struct {
	StartHour   int
	StartMinute int
	EndHour     int
	EndMinute   int
}

/*作业信息*/
type Homework struct {
	Title       string
	Description string
	Year        int
	Month       int
	Hour        int
	Minute      int
	Day         int
	HasFinished bool
	Uploaded    []Uploaded
}

/*上传作业文件信息*/
type Uploaded struct {
	HomeworkName string
	Remark       string
	Year         int
	Month        int
	Day          int
	Hour         int
	Minute       int
	version      int
}

/*上传资料文件信息*/
type Resource struct {
	ResourceName string
	Remark       string
	Year         int
	Month        int
	Day          int
	Hour         int
	Minute       int
}

//课程信息
type Curriculums_atom struct {
	Name       string
	Instructor string
	Group      string
	Homework   []Homework
	Resource   []Resource
}

type ClockList []Clock

type Clock struct {
	Week       int
	Hour       int
	Minute     int
	Remark     string
	ClockCycle string
}

type ActivityList []Activity

type Activity struct {
	Week         int
	Hour         int
	Minute       int
	District     string
	Spot         string
	Classroom    string
	Activity     string
	ActivityType string
}

type Time struct {
	Year   int
	Month  int
	Day    int
	Week   int
	Hour   int
	Minute int
}

type Controller struct {
	IsAdmin     bool
	IsPausing   bool
	Multi_speed int
}

/*校区信息*/
type Coordinate struct {
	Name string
	Spot []struct {
		Name      string
		Classroom []string
		x         float64
		y         float64
	}
}
