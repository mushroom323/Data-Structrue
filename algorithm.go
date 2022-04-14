package main

import (
	"fmt"
	"strings"
)

/*
增加闹钟并对已有闹钟排序
由于每次只增加一个闹钟，且已有闹钟列表必为有序，因此采用插入排序
也可以用二分插入。但写起来会麻烦一点所以懒得用。
*/
func addClock(newClock Clock) {
	if len(clockList) == 0 {
		clockList = append(clockList, newClock)
		Log(fmt.Sprintln("新增闹钟，时间: 星期", (newClock.Week + 1), "-", newClock.Hour, "时 -", newClock.Minute, "分,备注：", newClock.Remark, ",重复次数:", newClock.ClockCycle))
		return
	} else {
		for index, clock := range clockList {
			if clockCompare(newClock, clock) == 1 {
				rear := append([]Clock{}, clockList[index:]...)
				clockList = append(clockList[0:index], newClock)
				clockList = append(clockList, rear...)
				Log(fmt.Sprintln("新增闹钟，时间: 星期", (newClock.Week + 1), "-", newClock.Hour, "时 -", newClock.Minute, "分,备注：", newClock.Remark, ",重复次数:", newClock.ClockCycle))
				return
			}
		}
		//如果新增的闹钟比所有已有的时间都靠后
		clockList = append(clockList, newClock)
		Log(fmt.Sprintln("新增闹钟，时间: 星期", (newClock.Week + 1), "-", newClock.Hour, "时 -", newClock.Minute, "分,备注：", newClock.Remark, ",重复次数:", newClock.ClockCycle))
		return
	}
}

/*
比较闹钟的时间先后，若clock_1先于clock_2就返回1，否则返回0
暴力逻辑判断。
*/
func clockCompare(clock_1 Clock, clock_2 Clock) int {
	if clock_1.Week < clock_2.Week {
		return 1
	} else if clock_1.Week == clock_2.Week {
		if clock_1.Hour < clock_2.Hour {
			return 1
		} else if clock_1.Hour == clock_2.Hour {
			if clock_1.Minute < clock_2.Minute {
				return 1
			} else if clock_1.Minute == clock_2.Minute {
				return 0
			} else {
				return 0
			}
		} else {
			return 0
		}
	} else {
		return 0
	}
}

/*删除闹钟*/
func deleteClock(deClock Clock) {
	for index, clock := range clockList {
		if deClock.Week == clock.Week && deClock.Hour == clock.Hour && deClock.Minute == clock.Minute {
			clockList = append(clockList[:index], clockList[index+1:]...)
			Log(fmt.Sprintln("删除闹钟，时间: 星期", (deClock.Week + 1), "-", deClock.Hour, "时 -", deClock.Minute, "分,备注：", deClock.Remark, ",重复次数:", deClock.ClockCycle))
			return
		}
	}
}

/*插入新增活动到适当位置，活动列表根据时间排序，从小到大*/
func addActivity(newActivity Activity, activityList []Activity) []Activity {
	if len(activityList) == 0 {
		activityList = append(activityList, newActivity)
		return activityList
	} else {
		for index, activity := range activityList {
			if activityCompare(newActivity, activity) == 1 {
				rear := append([]Activity{}, activityList[index:]...)
				activityList = append(activityList[0:index], newActivity)
				activityList = append(activityList, rear...)
				return activityList
			}
		}
		//如果新增的活动比所有已有活动的时间都靠后
		activityList = append(activityList, newActivity)
		return activityList
	}
}

/*
比较活动的时间先后，若activity_1先于activity_2就返回1，否则返回0
暴力逻辑判断。
*/
func activityCompare(activity_1 Activity, activity_2 Activity) int {
	if activity_1.Week < activity_2.Week {
		return 1
	} else if activity_1.Week == activity_2.Week {
		if activity_1.Hour < activity_2.Hour {
			return 1
		} else if activity_1.Hour == activity_2.Hour {
			if activity_1.Minute < activity_2.Minute {
				return 1
			} else if activity_1.Minute == activity_2.Minute {
				return 0
			} else {
				return 0
			}
		} else {
			return 0
		}
	} else {
		return 0
	}
}

/*删除活动*/
func deleteActivity(deActivity Activity) {
	for index, activity := range activityList {
		if activity.Activity == deActivity.Activity {
			activityList = append(activityList[:index], activityList[index+1:]...)
			Log(fmt.Sprintln("删除活动，时间: 星期", (deActivity.Week + 1), "-", deActivity.Hour, "时 -", deActivity.Minute, "分，校区：", deActivity.District, "，地点：", deActivity.Spot, ",教室号:", deActivity.Classroom, ",备注:", deActivity.Activity, ",活动类型:", deActivity.ActivityType, ",活动内容:", deActivity.ActivityContent))
			return
		}
	}
}

/*增加考试*/
func assignExam(newExam Schedule_Info, curriName string) {
	for index, curri := range scheList {
		if curri.Name == curriName {
			scheList[index].Info = append(scheList[index].Info, newExam)
			Log(fmt.Sprintln("增加考试信息：课程名：", curriName, ",考试时间:星期", (newExam.Week + 1), "- 第", (newExam.Order + 1), "节,考试校区:", newExam.District, "，考试地点：", newExam.Spot, ",教室号：", newExam.Classroom))
			return
		}
	}
}

/*删除考试*/
func deleteExam(deExam Schedule_Info, deExamName string) {
	for index_1, schedule := range scheList {
		if schedule.Name == deExamName {
			for index, exam := range schedule.Info {
				if exam.IsExam == true && exam.Week == deExam.Week && exam.Order == deExam.Order {
					scheList[index_1].Info = append(scheList[index_1].Info[:index], scheList[index_1].Info[index+1:]...)
					Log(fmt.Sprintln("删除考试,时间：星期", (deExam.Week + 1), "- 第", (deExam.Order + 1), "节，校区：", deExam.District, "，地点：", deExam.Spot, "，教室号:", deExam.Classroom, "，名称：", deExamName))
					return
				}
			}
		}
	}
}

/*更改课程信息*/
func changeClassInfo(InfoName string, NewClass Schedule_Info, OldClass Schedule_Info) {
	for index_1, schedule := range scheList {
		if schedule.Name == InfoName {
			for index, class := range schedule.Info {
				if class.Week == OldClass.Week && class.Order == class.Order {
					scheList[index_1].Info[index] = NewClass
					Log(fmt.Sprintln("更改课程内容，课程名:", InfoName, "，时间改变：星期", (OldClass.Week + 1), "- 第", (OldClass.Order + 1), "节 到 星期", (NewClass.Week + 1), "- 第", (NewClass.Order + 1), "节；地点改变：", OldClass.District, "-", OldClass.Spot, "-", OldClass.Classroom, "到", NewClass.District, "-", NewClass.Spot, "-", NewClass.Classroom))
					return
				}
			}
		}
	}
}

/*增加作业*/
func assignHomework(HomeworkName string, NewHomework Homework) {
	for index_1, curri := range curriList {
		if curri.Name == HomeworkName {
			curriList[index_1].Homework = append(curriList[index_1].Homework, NewHomework)
			Log(fmt.Sprintln("新增课程作业: 课程名：", HomeworkName, "，作业标题：", NewHomework.Title, "，作业发布时间：", NewHomework.Year, "年 -", (NewHomework.Month + 1), "月 -", (NewHomework.Day + 1), "日 -", NewHomework.Hour, "时 -", NewHomework.Minute, "分,作业描述：", NewHomework.Description, ",作业是否完成:", NewHomework.HasFinished))
			return
		}
	}
}

/*上传作业文件*/
func uploadHomeworkFile(upFile Uploaded, curriName string, homeworkName string) {
	for index_1, curri := range curriList {
		if curri.Name == curriName {
			for index, homework := range curri.Homework {
				if homework.Title == homeworkName {
					curriList[index_1].Homework[index].HasFinished = true
					curriList[index_1].Homework[index].Uploaded = append(curriList[index_1].Homework[index].Uploaded, upFile)
					Log(fmt.Sprintln("上传作业文件：课程名：", curriName, ",作业标题：", homeworkName, ",作业名:", upFile.HomeworkName, ",备注：", upFile.Remark, ",上传时间：", upFile.Year, "年 -", (upFile.Month + 1), "月 -", (upFile.Day + 1), "日 -", upFile.Hour, "时 -", upFile.Minute, "分"))
					return
				}
			}
		}
	}
}

/*上传资料*/
func uploadResourceFile(upFile Resource, curriName string) {
	for index_1, curri := range curriList {
		if curri.Name == curriName {
			curriList[index_1].Resource = append(curriList[index_1].Resource, upFile)
			Log(fmt.Sprintln("上传资料文件：资料名：", upFile.ResourceName, ",资料备注：", upFile.Remark, ",上传时间:", upFile.Year, "年 -", (upFile.Minute + 1), "月 -", (upFile.Day + 1), "日 -", upFile.Hour, "时 -", upFile.Minute, "分"))
			return
		}
	}

}

/*
前端字符搜索课程显示全名称
我也不知道我在说什么。反正意思是这个意思。
本质上是个中文字符串匹配。
用的是go库里自带的字符串匹配，不能用之后再改
*/
func searchCurriculum(text string) []string {
	var result []string
	for _, curri := range curriList {
		if strings.Contains(curri.Name, text) {
			Log(curri.Name)
			result = append(result, curri.Name)
		}
	}
	return result
}

/*前端字符搜索作业*/
func searchHomework(text string, curriName string) []Homework {
	var result []Homework
	var i int
	for index, curri := range curriList {
		if curri.Name == curriName {
			i = index
			break
		}
	}
	for _, homework := range curriList[i].Homework {
		if strings.Contains(homework.Title, text) {
			result = insertHomework(homework, result)
		}
	}
	return result
}

/*插入新增作业到适当位置，作业列表根据时间排序，从小到大*/
func insertHomework(newHomework Homework, homeworkList []Homework) []Homework {
	if len(homeworkList) == 0 {
		homeworkList = append(homeworkList, newHomework)
		return homeworkList
	} else {
		for index, homework := range homeworkList {
			if homeworkCompare(newHomework, homework) == 1 {
				rear := append([]Homework{}, homeworkList[index:]...)
				homeworkList = append(homeworkList[0:index], newHomework)
				homeworkList = append(homeworkList, rear...)
				return homeworkList
			}
		}
		//如果新增的活动比所有已有作业的时间都靠后
		homeworkList = append(homeworkList, newHomework)
		return homeworkList
	}
}

/*
比较作业的时间先后
暴力逻辑判断。
真暴力啊。牛逼。
*/
func homeworkCompare(Homework_1 Homework, Homework_2 Homework) int {
	if Homework_1.Year < Homework_2.Year {
		return 1
	} else if Homework_1.Year == Homework_2.Year {
		if Homework_1.Month < Homework_2.Month {
			return 1
		} else if Homework_1.Month == Homework_2.Month {
			if Homework_1.Day < Homework_2.Day {
				return 1
			} else if Homework_1.Day == Homework_2.Day {
				if Homework_1.Hour < Homework_2.Hour {
					return 1
				} else if Homework_1.Hour == Homework_2.Hour {
					if Homework_1.Minute < Homework_2.Minute {
						return 1
					} else {
						return 0
					}
				} else {
					return 0
				}
			} else {
				return 0
			}
		} else {
			return 0
		}
	} else {
		return 0
	}
}

/*搜索资料*/
func searchResource(text string, curriName string) []Resource {
	var result []Resource
	var i int
	for index, curri := range curriList {
		if curri.Name == curriName {
			i = index
			break
		}
	}
	for _, resource := range curriList[i].Resource {
		if strings.Contains(resource.ResourceName, text) {
			result = insertResource(resource, result)
		}
	}
	return result
}

/*插入新增资料到适当位置，资料列表根据时间排序，从小到大*/
func insertResource(newResource Resource, resourceList []Resource) []Resource {
	if len(resourceList) == 0 {
		resourceList = append(resourceList, newResource)
		return resourceList
	} else {
		for index, resource := range resourceList {
			if resourceCompare(newResource, resource) == 1 {
				rear := append([]Resource{}, resourceList[index:]...)
				resourceList = append(resourceList[0:index], newResource)
				resourceList = append(resourceList, rear...)
				return resourceList
			}
		}
		//如果新增的活动比所有已有作业的时间都靠后
		resourceList = append(resourceList, newResource)
		return resourceList
	}
}

/*
比较资料的时间先后
暴力逻辑判断。
真暴力啊。牛逼。
*/
func resourceCompare(Resource_1 Resource, Resource_2 Resource) int {
	if Resource_1.Year < Resource_2.Year {
		return 1
	} else if Resource_1.Year == Resource_2.Year {
		if Resource_1.Month < Resource_2.Month {
			return 1
		} else if Resource_1.Month == Resource_2.Month {
			if Resource_1.Day < Resource_2.Day {
				return 1
			} else if Resource_1.Day == Resource_2.Day {
				if Resource_1.Hour < Resource_2.Hour {
					return 1
				} else if Resource_1.Hour == Resource_2.Hour {
					if Resource_1.Minute < Resource_2.Minute {
						return 1
					} else {
						return 0
					}
				} else {
					return 0
				}
			} else {
				return 0
			}
		} else {
			return 0
		}
	} else {
		return 0
	}
}

/*
搜索活动
text可能为空
得到的结果按照时间从小到大排序
*/
func searchActivity(text string, typeName string, content string) ActivityList {
	var result ActivityList
	var flag bool = false //如果text不为空，flag为false，否则为true
	if len(text) == 0 {
		flag = true
	}
	for _, activity := range activityList {
		if activity.ActivityType == typeName && activity.ActivityContent == content {
			if flag {
				result = addActivity(activity, result)
			} else {
				if strings.Contains(activity.Activity, text) {
					result = addActivity(activity, result)
				}
			}
		}
	}
	return result
}
