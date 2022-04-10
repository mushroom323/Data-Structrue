package main

import (
	"fmt"
)

func deleteClock(deClock Clock) {
	for index, clock := range clockList {
		if deClock.Week == clock.Week && deClock.Hour == clock.Hour && deClock.Minute == clock.Minute {
			clockList = append(clockList[:index], clockList[index+1:]...)
			Log(fmt.Sprintln("删除闹钟，时间:", deClock.Week, "-", deClock.Hour, "-", deClock.Minute, ",备注：", deClock.Remark, ",重复次数:", deClock.ClockCycle))
			return
		}
	}
}

func deleteActivity(deActivity Activity) {
	for index, activity := range activityList {
		if activity.Activity == deActivity.Activity {
			activityList = append(activityList[:index], activityList[index+1:]...)
			Log(fmt.Sprintln("删除活动，时间:", deActivity.Week, "-", deActivity.Hour, "-", deActivity.Minute, "，校区：", deActivity.District, "，地点：", deActivity.Spot, ",教室号:", deActivity.Classroom, ",备注:", deActivity.Activity, ",活动类型:", deActivity.ActivityType))
			return
		}
	}
}

func assignExam(newExam Schedule_Info,curriName string) {
	for index,curri := range scheList {
		if curri.Name == curriName {
			scheList[index].Info = append(scheList[index].Info, newExam)
			Log(fmt.Sprintln("增加考试信息：课程名：",curriName,",考试时间:",newExam.Week,"-",newExam.Order,",考试校区:",newExam.District,"，考试地点：",newExam.Spot,",教室号：",newExam.Classroom))
			return
		}
	}
}

func deleteExam(deExam Schedule_Info, deExamName string) {
	for index_1, schedule := range scheList {
		if schedule.Name == deExamName {
			for index, exam := range schedule.Info {
				if exam.IsExam == true && exam.Week == deExam.Week && exam.Order == deExam.Order {
					scheList[index_1].Info = append(scheList[index_1].Info[:index], scheList[index_1].Info[index+1:]...)
					Log(fmt.Sprintln("删除考试,时间：", deExam.Week, "-", deExam.Order, "，校区：", deExam.District, "，地点：", deExam.Spot, "，教室号:", deExam.Classroom, "，名称：", deExamName))
					return
				}
			}
		}
	}
}

func changeClassInfo(InfoName string, NewClass Schedule_Info, OldClass Schedule_Info) {
	for index_1, schedule := range scheList {
		if schedule.Name == InfoName {
			for index, class := range schedule.Info {
				if class.Week == OldClass.Week && class.Order == class.Order {
					scheList[index_1].Info[index] = NewClass
					Log(fmt.Sprintln("更改课程内容，新课程：时间：", NewClass.Week, "-", NewClass.Order, "，校区：", NewClass.District, "，地点：", NewClass.Spot, "，教室号:", NewClass.Classroom, "，名称：", InfoName))
					return
				}
			}
		}
	}
}

func assignHomework(HomeworkName string, NewHomework Homework) {
	for index_1, curri := range curriList {
		if curri.Name == HomeworkName {
			curriList[index_1].Homework = append(curriList[index_1].Homework, NewHomework)
			Log(fmt.Sprintln("新增课程作业:课程名：", HomeworkName, "，作业标题：", NewHomework.Title, "，作业时间：", NewHomework.Year, "-", NewHomework.Month, "-", NewHomework.Day,"-",NewHomework.Hour,"-",NewHomework.Minute, ",作业描述：", NewHomework.Description, ",作业是否完成:", NewHomework.HasFinished))
			return
		}
	}
}

func uploadHomeworkFile(upFile Uploaded,curriName string,homeworkName string) {
	for index_1,curri := range curriList {
		if curri.Name == curriName {
			for index,homework := range curri.Homework {
				if homework.Title == homeworkName {
					curriList[index_1].Homework[index].Uploaded = append(curriList[index_1].Homework[index].Uploaded, upFile)
					Log(fmt.Sprintln("上传作业文件：课程名：",curriName,",作业标题：",homeworkName,",作业名:",upFile.HomeworkName,",备注：",upFile.Remark,",时间：",upFile.Year,"-",upFile.Month,"-",upFile.Day,"-",upFile.Day,"-",upFile.Hour,"-",upFile.Minute))
					return
				}
			}
		}
	}
}

func uploadResourceFile(upFile Resource,curriName string) {
	for index_1,curri := range curriList {
		if curri.Name == curriName {
			curriList[index_1].Resource = append(curriList[index_1].Resource, upFile)
			Log(fmt.Sprintf("上传资料文件：资料名：",upFile.ResourceName,",资料备注：",upFile.Remark,",上传时间:",upFile.Year,"-",upFile.Minute,"-",upFile.Day,"-",upFile.Hour,"-",upFile.Minute))
			return
		}
	}
}