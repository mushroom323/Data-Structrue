package main

import (
	"fmt"
	"strings"
	"unicode"

	"github.com/mozillazg/go-pinyin"
)

/*
增加闹钟并对已有闹钟排序
由于每次只增加一个闹钟，且已有闹钟列表必为有序，因此采用插入排序
也可以用二分插入。但写起来会麻烦一点所以懒得用。
*/
func addClock(newClock Clock) {
	if len(clockList) == 0 {
		clockList = append(clockList, newClock)
		Log(fmt.Sprintf("%s  新增闹钟: [星期%d %02d:%02d, 备注: %s, 重复次数: %s]\n", timeString(nowTime), (newClock.Week + 1), newClock.Hour, newClock.Minute, newClock.Remark, newClock.ClockCycle))
		return
	} else {
		for index, clock := range clockList {
			if clockCompare(newClock, clock) == 1 {
				rear := append([]Clock{}, clockList[index:]...)
				clockList = append(clockList[0:index], newClock)
				clockList = append(clockList, rear...)
				Log(fmt.Sprintf("%s  新增闹钟: [星期%d %02d:%02d, 备注: %s, 重复次数: %s]\n", timeString(nowTime), (newClock.Week + 1), newClock.Hour, newClock.Minute, newClock.Remark, newClock.ClockCycle))
				return
			}
		}
		//如果新增的闹钟比所有已有的时间都靠后
		clockList = append(clockList, newClock)
		Log(fmt.Sprintf("%s  新增闹钟: [星期%d %02d:%02d, 备注: %s, 重复次数: %s]\n", timeString(nowTime), (newClock.Week + 1), newClock.Hour, newClock.Minute, newClock.Remark, newClock.ClockCycle))
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
			Log(fmt.Sprintf("%s  删除闹钟: [星期%d %02d:%02d, 备注: %s, 重复次数: %s]\n", timeString(nowTime), (deClock.Week + 1), deClock.Hour, deClock.Minute, deClock.Remark, deClock.ClockCycle))
			return
		}
	}
}

/*插入新增活动到适当位置，活动列表根据时间排序，从小到大*/
func addActivity(newActivity Activity, activityList []Activity, option int) []Activity {
	if len(activityList) == 0 {
		activityList = append(activityList, newActivity)
		return activityList
	} else {
		for index, activity := range activityList {
			if option == 0 {
				if activityCompare(newActivity, activity) == 1 {
					rear := append([]Activity{}, activityList[index:]...)
					activityList = append(activityList[0:index], newActivity)
					activityList = append(activityList, rear...)
					return activityList
				}
			} else {
				if compareName(newActivity.Activity, activity.Activity) {
					rear := append([]Activity{}, activityList[index:]...)
					activityList = append(activityList[0:index], newActivity)
					activityList = append(activityList, rear...)
					return activityList
				}
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
			Log(fmt.Sprintf("%s  删除活动: [星期%d %02d:%02d, 地点: %s-%s-%s, 活动: %s, 活动类型: %s-%s]\n", timeString(nowTime), (deActivity.Week + 1), deActivity.Hour, deActivity.Minute, deActivity.District, deActivity.Spot, deActivity.Classroom, deActivity.Activity, deActivity.ActivityType, deActivity.ActivityContent))
			return
		}
	}
}

/*增加考试*/
func assignExam(newExam Schedule_Info, curriName string) {
	for index, curri := range scheList {
		if curri.Name == curriName {
			scheList[index].Info = append(scheList[index].Info, newExam)
			Log(fmt.Sprintf("%s  增加考试: [星期%d 第%d节, 课程名: %s, 地点: %s-%s-%s]\n", timeString(nowTime), (newExam.Week + 1), (newExam.Order + 1), curriName, newExam.District, newExam.Spot, newExam.Classroom))
			return
		}
	}
}

/*增加课程*/
func assignClass(newExam Schedule_Info, curriName string) {
	for index, curri := range scheList {
		if curri.Name == curriName {
			scheList[index].Info = append(scheList[index].Info, newExam)
			Log(fmt.Sprintf("%s  增加考试: [星期%d 第%d节, 课程名: %s, 地点: %s-%s-%s]\n", timeString(nowTime), (newExam.Week + 1), (newExam.Order + 1), curriName, newExam.District, newExam.Spot, newExam.Classroom))
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
					Log(fmt.Sprintf("%s  删除考试: [星期%d 第%d节, 课程名: %s, 地点: %s-%s-%s]\n", timeString(nowTime), (deExam.Week + 1), (deExam.Order + 1), deExamName, deExam.District, deExam.Spot, deExam.Classroom))
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
					Log(fmt.Sprintf("%s  更改课程: [星期%d 第%d节, 课程名: %s, 地点: %s-%s-%s] -> [星期%d 第%d节, 课程名: %s, 地点: %s-%s-%s]\n", timeString(nowTime), (OldClass.Week + 1), (OldClass.Order + 1), InfoName, OldClass.District, OldClass.Spot, OldClass.Classroom, (NewClass.Week + 1), (NewClass.Order + 1), InfoName, NewClass.District, NewClass.Spot, NewClass.Classroom))
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
			Log(fmt.Sprintf("%s  新增作业: [%d/%d/%d %02d:%02d, 课程名: %s, 作业标题: %s, 作业描述: %s]\n", timeString(nowTime), NewHomework.Year, (NewHomework.Month + 1), (NewHomework.Day + 1), NewHomework.Hour, NewHomework.Minute, HomeworkName, NewHomework.Title, NewHomework.Description))
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
					Log(fmt.Sprintf("%s  上传作业: [%d/%d/%d %02d:%02d, 课程名: %s, 作业标题: %s, 作业名: %s, 作业备注: %s]\n", timeString(nowTime), upFile.Year, (upFile.Month + 1), (upFile.Day + 1), upFile.Hour, upFile.Minute, curriName, homeworkName, upFile.HomeworkName, upFile.Remark))
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
			Log(fmt.Sprintf("%s  上传资料: [%d/%d/%d %02d:%02d, 课程名: %s, 资料名: %s, 资料备注: %s]\n", timeString(nowTime), upFile.Year, (upFile.Month + 1), (upFile.Day + 1), upFile.Hour, upFile.Minute, curriName, upFile.ResourceName, upFile.Remark))
			return
		}
	}

}

/**  搜索函数  **/

// 前缀树的节点
type Node struct {
	//  	若干个子节点: 字符(中文操作)： 节点
	Children map[rune]*Node
	// 		标识节点是否是一个单词最后的一个字符
	isWord bool
	//		标识对应的id，即在对应切片里的位置
	id int
}

// 给子节点 列表添加新的节点
func (n *Node) Add(c rune) {
	// 构造节点：  nil 类型 map 不可直接使用添加元素等
	node := Node{
		Children: make(map[rune]*Node, 0),
	}
	n.Children[c] = &node
}

// 设置节点的 isword
func (n *Node) SetIsword(flag bool) {
	n.isWord = flag
}

// 设置节点的 id
func (n *Node) SetID(id int) {
	n.id = id
}

// 整棵树的根节点
type Trie struct {
	// 字典树的根节点
	Root *Node
}

// 初始化根节点为 "/"
func (t *Trie) Init() *Trie {
	t.Root = &Node{
		make(map[rune]*Node, 0),
		false,
		-1,
	}
	return t
}

// 外部调用初始化一个 字典树
func New() *Trie {
	return new(Trie).Init()
}

// 添加名称
func (t *Trie) Add(word string, id int) {
	// 转换为 rune
	w := []rune(word)
	// 找到每一个节点
	cur := t.Root
	// 遍历 word的每一个字符
	for _, c := range w {
		// 1. 查找子节点中是否包含当前字符
		// 如果不包含, 添加一下
		if _, ok := cur.Children[c]; !ok {
			// 添加新节点
			cur.Add(c)
		}
		// cur 指向下一个子节点
		cur = cur.Children[c]
	}
	// 将最后一个节点字符的 尾设置为 true
	cur.SetIsword(true)
	cur.SetID(id)
}

// 查询字符串前缀
func (t *Trie) SearchPre(word string) (*Node, bool) {
	w := []rune(word)
	cur := t.Root
	var c rune
	for _, c = range w {
		// 1. 查找子节点中是否包含当前字符
		if _, ok := cur.Children[c]; !ok {
			return cur, false
		}
		// cur 指向下一个子节点
		cur = cur.Children[c]
	}
	return cur, true
}

//递归添加以pre_str为前缀的字符串到ret集合
func AddStr(root *Node, pre_str string, ret *[]string) {
	for i, index := range root.Children {
		AddStr(index, pre_str+string(i), ret)
	}

	if root.isWord {
		*ret = append(*ret, pre_str)
		//fmt.Println(*ret)
	}
}

//递归添加以pre_str为前缀的id到id集合
func AddID(root *Node, pre_str string, id *[]int) {
	for i, index := range root.Children {
		AddID(index, pre_str+string(i), id)
	}

	if root.isWord {
		*id = append(*id, root.id)
		//fmt.Println(*ret)
	}
}

//返回所有前缀为str的字符串 以及对应id
func (t *Trie) GetStrPre(word string) ([]string, []int) {
	var ret []string
	var id []int
	var find_node *Node
	var ok bool = false
	find_node, ok = t.SearchPre(word)
	if ok {
		AddStr(find_node, word, &ret)
		AddID(find_node, word, &id)
	}

	return ret, id
}

/*前缀字符搜索课程显示全名称*/
func searchCurriculum(text string, option int) []string {
	/*构建对应二叉树*/
	t := New()
	for i, curri := range curriList {
		t.Add(curri.Name, i)
	}
	var result []string
	result, _ = t.GetStrPre(text)
	if option == 1 {
		result = sortName(result)
	}
	return result
	/*
		for _, curri := range curriList {
			if Rabin_Karp_Hash(curri.Name, text) {
				result = append(result, curri.Name)
			}
		}
		return result*/
}

func sortName(originStrings []string) []string {
	/*sort.SliceStable(originStrings, func(i, j int) bool {
		return compareName(originStrings[i], originStrings[j])
	})*/
	var ret []string
	var flag bool = true //是否比所有的都靠后
	for _, index := range originStrings {
		if len(ret) == 0 {
			ret = append(ret, index)
		} else {
			flag = true
			for i, str := range ret {
				if compareName(index, str) {
					rear := append([]string{}, ret[i:]...)
					ret = append(ret[0:i], index)
					ret = append(ret, rear...)
					flag = false
					break
				}
			}
			if flag {
				ret = append(ret, index)
			}
		}
	}
	return ret
}

func compareName(aName, bName string) bool {
	aName = strings.ToLower(aName)
	bName = strings.ToLower(bName)
	aNamePinyinCharList := genStringPinyinAndToLower(aName)
	bNamePinyinCharList := genStringPinyinAndToLower(bName)
	aNameCharList := strings.Split(aName, "")
	bNameCharList := strings.Split(bName, "")
	bNameMaxIndex := len(bNameCharList) - 1

	for i, s := range aNameCharList {
		if i > bNameMaxIndex {
			return false
		}

		if checkStringContainHan(s) && checkStringContainHan(bNameCharList[i]) {
			s = aNamePinyinCharList[i]
			bNameCharList[i] = bNamePinyinCharList[i]
		}

		if s != bNameCharList[i] {
			return s < bNameCharList[i]
		}
	}

	return true
}

func checkStringContainHan(r string) bool {
	for _, i2 := range r {
		if unicode.Is(unicode.Han, i2) {
			return true
		}
	}
	return false
}

// genStringPinyinAndToLower 获取字符串拼音并全部转小写(支持中文)
func genStringPinyinAndToLower(str string) []string {
	pinyinArgs := pinyin.NewArgs()
	pinyinArgs.Fallback = func(r rune, a pinyin.Args) []string {
		return []string{strings.ToLower(string(r))}
	}
	return pinyin.LazyPinyin(str, pinyinArgs)
}

/*
搜索活动
text可能为空
得到的结果按照时间从小到大排序
*/
func searchActivity(text string, typeName string, content string, option int) ActivityList {
	var result ActivityList
	var flag bool = false //如果text不为空，flag为false，否则为true
	if len(text) == 0 {
		flag = true
	}
	t := New()
	for i, activity := range activityList {
		if activity.ActivityType == typeName && activity.ActivityContent == content {
			if flag { //关键词为空，则直接把所有满足要求的都放进去
				result = addActivity(activity, result, option)
			} else { //关键词不为空吗，则构建前缀树
				t.Add(activity.Activity, i)
				/*if Rabin_Karp_Hash(activity.Activity, text) {
					result = addActivity(activity, result)

				}*/
			}
		}
	}
	var id []int
	if !flag { //获取id
		_, id = t.GetStrPre(text)
	}
	for _, i := range id {
		result = addActivity(activityList[i], result, option)
	}
	return result
}

/*前缀字符搜索作业*/
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
		if Rabin_Karp_Hash(homework.Title, text) {
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
		if Rabin_Karp_Hash(resource.ResourceName, text) {
			result = insertResource(resource, result)
		}
	}
	return result
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
传入Time对象
返回时间的字符串
*/
func timeString(time Time) string {
	retStr := fmt.Sprintf("%d/%d/%d 星期%d %02d:%02d", time.Year, time.Month+1, time.Day+1, time.Week+1, time.Hour, time.Minute)
	return retStr
}

/*
对树进行的操作，根据上学期数据结构改编
*/
func (p treeHeap) Less(i, j int) bool {
	return p[i].Times <= p[j].Times
}

func (p treeHeap) Len() int {
	return len(p)
}

func (p treeHeap) Swap(i, j int) {
	p[i], p[j] = p[j], p[i]
}

func (p *treeHeap) Push(node interface{}) {
	*p = append(*p, node.(*TreeNode))
}

func (p *treeHeap) Pop() interface{} {
	n := len(*p)
	t := (*p)[n-1]
	*p = (*p)[:n-1]
	return t
}

// Calculate a string's hash function
func Hash(str string, m []int) int {
	if len(str) == 0 {
		return 0
	}

	var (
		t   int
		res int = 0
	)

	for i := 0; i < len(str); i++ {
		t = m[i] * int(str[i]-'a')
		res = res + t
	}
	return res
}

// match the substring with hash function
// we can calculate the string's hash value with below formula
//
// 's' is source string, m is the length of the substring
// h(i-1) = 26^0 * (s[i-1] - 'a') +
// 			26^1 * (s[i] - 'a') + ... +
// 			26^(m-1) * (s[i+m-2] -'a')
//
// h(i) = 26^0 * (s[i] - 'a') + ... +
// 		  26^(m-2) * (s[i + m - 2] - 'a') +
// 		  26^(m-1) * (s[i+m-2] -'a')
//
// so
// h(i) = (h(i-1) - s[i-1] -'a' ) / 26 + 26^(m-1) * (s[i+m-2] -'a')
// we can use the formula to reduce the cpu's calculation

func Rabin_Karp_Hash(str1 string, str2 string) bool {
	if len(str1) < len(str2) {
		return false
	}

	var m []int
	var t int = 1
	m = append(m, 1)

	for i := 1; i < len(str2)+1; i++ {
		t = t * 26
		m = append(m, t) // m store with 26^0, 26^1, 26^2 ... 26^(len(str2))
	}

	str2_hash := Hash(str2, m)
	//fmt.Println(str2_hash)
	str1_hash := Hash(string([]byte(str1)[:len(str2)]), m)

	if str2_hash == str1_hash {
		return true
	}

	for i := 1; i < len(str1)-len(str2)+1; i++ {
		new_hash := (str1_hash-int(str1[i-1]-'a'))/26 +
			m[len(str2)-1]*int(str1[i+len(str2)-1]-'a')

		if new_hash == str2_hash {
			return true
		} else {
			str1_hash = new_hash
		}
	}
	return false
}
