package main

import (
	"container/heap"
	"encoding/json"
	"fmt"
)

const INT_MAX int = int(^uint(0) >> 1)

var vertexIndex map[int]int

const IFpeed float32 = 1 //步行理想速度定义为1m/s
const IBpeed float32 = 5 //自行车理想速度定义为5m/s
var graph []Vertex

type Vertex struct {
	VID     int
	ArcList []Arc
	X       float64
	Y       float64
}

type Arc struct {
	TargetIndex   int
	FootDuration  float32
	BycleDuration float32
	Length        int
	IsBycle       bool
}

type HeapNode struct {
	Index    int
	Length   int
	Duration float32
}

func AddTravel(origin int, desination int, IsBycle bool, IsTime bool, pathway []int) []byte {
	startIndex, _ := vertexIndex[origin]
	//暂时不考虑让用户随意标起点，因此不建立临时结点
	var exitIndex int
	var length int
	var duration float32
	var path []Section
	var rawPath interface{}
	var newPathWay []int //多点途径的最短路径历程
	var allLength int = 0
	if len(pathway) == 0 {
		if IsBycle == false {
			if IsTime == false {
				fmt.Printf("收到规划请求：%d -> %d，最短里程，步行\n", origin, desination)
				/*离开的点在邻接链表里的序号，长度，原生路径*/
				exitIndex, length, rawPath = NoCrowdFoot(startIndex, desination)
				duration = float32(length) / float32(IFpeed*60.0)
			} else {
				fmt.Printf("收到规划请求：%d -> %d，最短时间，步行\n", origin, desination)
				exitIndex, length, duration, rawPath = CrowdFoot(startIndex, desination)
			}
		} else {
			/*考虑所有交通工具的最短时间*/
			fmt.Printf("收到规划请求：%d -> %d，最短时间，自行车\n", origin, desination)
			exitIndex, length, duration, rawPath = CrowdBycle(startIndex, desination)
		}
	} else {
		fmt.Printf("收到规划请求：%d -> %d，最短里程，步行， 途径 %d\n", origin, desination, pathway[0])
		newPathWay, allLength = MultiGuide(startIndex, desination, pathway, 0, INT_MAX, len(pathway))
		fmt.Printf("途径点顺序如下:")
		for _, index := range newPathWay {
			fmt.Printf("%d ", index)
		}
		fmt.Printf("\n")
	}

	var returnStr []byte
	if exitIndex == -1 || allLength == -1 {
		fmt.Println("规划失败")
		returnStr = []byte("{\"fail\":true}")
	} else if len(pathway) == 0 {
		var fromID, arcIndex int
		var remain int = length
		/*从终点回溯到起点，依次把路径存入path*/
		for exitIndex != startIndex {
			/*提取出前一节点和对应的的弧序号*/
			fromID, arcIndex = rawPath.([][2]int)[exitIndex][0], rawPath.([][2]int)[exitIndex][1]
			path = append(path, Section{
				graph[fromID].VID,
				graph[exitIndex].VID,
				graph[fromID].X,
				graph[fromID].Y,
				graph[exitIndex].X,
				graph[exitIndex].Y,
				IsBycle,
				graph[fromID].ArcList[arcIndex].FootDuration, //路径用时
				graph[fromID].ArcList[arcIndex].BycleDuration,
				graph[fromID].ArcList[arcIndex].Length})
			exitIndex = fromID
			remain -= graph[fromID].ArcList[arcIndex].Length
		}
		path = reversePath(path)
		ans := Travel{"旅客", length, duration, path}
		returnStr, _ = json.Marshal(ans)
		pathStr, _ := json.Marshal(path)
		Log(fmt.Sprintf("%s规划成功，总距离：%d,总时间：%v秒，路线:%s\n", ans.ID, ans.TotalLength, duration, string(pathStr)))

	} else {
		var pathTemp []Section /// 用来存储上一轮获得的路径
		var totalLength int = 0
		var totalDuration float32 = 0
		var start int = startIndex
		for _, des := range newPathWay {
			pathTemp = []Section{}
			fmt.Printf("des:%d \n", des)
			exitIndex, length, rawPath = NoCrowdFoot(start, des)
			fmt.Println(start)
			duration = float32(length) / float32(IFpeed*60.0)
			totalLength += length
			totalDuration += duration
			var fromID, arcIndex int
			var remain int = length
			/*从终点回溯到起点，依次把路径存入path*/
			for exitIndex != start {
				/*提取出前一节点和对应的的弧序号*/
				fromID, arcIndex = rawPath.([][2]int)[exitIndex][0], rawPath.([][2]int)[exitIndex][1]
				pathTemp = append(pathTemp, Section{
					graph[fromID].VID,
					graph[exitIndex].VID,
					graph[fromID].X,
					graph[fromID].Y,
					graph[exitIndex].X,
					graph[exitIndex].Y,
					IsBycle,
					graph[fromID].ArcList[arcIndex].FootDuration, //路径用时
					graph[fromID].ArcList[arcIndex].BycleDuration,
					graph[fromID].ArcList[arcIndex].Length})
				exitIndex = fromID
				remain -= graph[fromID].ArcList[arcIndex].Length
			}
			pathTemp = reversePath(pathTemp)
			fmt.Println("第一次途径点", len(pathTemp))
			path = append(path, pathTemp...)
			start = vertexIndex[des]
		}
		exitIndex, length, rawPath = NoCrowdFoot(start, desination)
		duration = float32(length) / float32(IFpeed*60.0)
		totalLength += length
		totalDuration += duration
		var fromID, arcIndex int
		var remain int = length
		pathTemp = []Section{}
		/*从终点回溯到起点，依次把路径存入path*/
		for exitIndex != start {
			/*提取出前一节点和对应的的弧序号*/
			fromID, arcIndex = rawPath.([][2]int)[exitIndex][0], rawPath.([][2]int)[exitIndex][1]
			pathTemp = append(pathTemp, Section{
				graph[fromID].VID,
				graph[exitIndex].VID,
				graph[fromID].X,
				graph[fromID].Y,
				graph[exitIndex].X,
				graph[exitIndex].Y,
				IsBycle,
				graph[fromID].ArcList[arcIndex].FootDuration, //路径用时
				graph[fromID].ArcList[arcIndex].BycleDuration,
				graph[fromID].ArcList[arcIndex].Length})
			exitIndex = fromID
			remain -= graph[fromID].ArcList[arcIndex].Length
		}
		pathTemp = reversePath(pathTemp)
		path = append(path, pathTemp...)
		ans := Travel{"旅客", length, duration, path}
		returnStr, _ = json.Marshal(ans)
		pathStr, _ := json.Marshal(path)
		Log(fmt.Sprintf("%s规划成功，总距离：%d,总时间：%v秒，路线:%s\n", ans.ID, ans.TotalLength, duration, string(pathStr)))
	}
	return returnStr
}

/*逆转从原生路径里提取的第一手路径，得到正确顺序的路径，方便输出*/
func reversePath(s []Section) []Section {
	for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {
		s[i], s[j] = s[j], s[i]
	}
	return s
}

//初始化建图
//因为是无向图所以存边的时候两个端点都要存
func CreateGraph() {
	vertexIndex = make(map[int]int)

	//创建弧
	for _, road := range roadlist {
		leftIndex, leftExist := vertexIndex[road.FromL]
		rightIndex, rightExist := vertexIndex[road.ToL]
		if !leftExist {
			leftIndex = len(graph)
			graph = append(graph, Vertex{road.FromL, []Arc{}, location[road.FromL-1].X, location[road.FromL-1].Y}) //因为LID是从1开始的，所以这里为了锚定选择-1.这也就对config.json里的LID作出了严格要求
			vertexIndex[road.FromL] = leftIndex
		}
		if !rightExist {
			rightIndex = len(graph)
			graph = append(graph, Vertex{road.ToL, []Arc{}, location[road.ToL-1].X, location[road.ToL-1].Y})
			vertexIndex[road.ToL] = rightIndex
		}
		graph[leftIndex].ArcList = append(graph[leftIndex].ArcList, Arc{
			rightIndex,
			float32(road.Length) / (road.Crowd * float32(IFpeed) * 60.0), //步行经过这条边需要的时间
			float32(road.Length) / (road.Crowd * float32(IBpeed) * 60.0),
			road.Length,
			road.IsBycle,
		})
		graph[rightIndex].ArcList = append(graph[rightIndex].ArcList, Arc{
			leftIndex,
			float32(road.Length) / (road.Crowd * float32(IFpeed) * 60), //步行经过这条边需要的时间
			float32(road.Length) / (road.Crowd * float32(IBpeed) * 60),
			road.Length,
			road.IsBycle,
		})
	}
}

/*步行不考虑拥挤度*/
func NoCrowdFoot(startIndex int, destination int) (int, int, [][2]int) {
	graphlen := len(graph)
	visited := make([]bool, graphlen)
	path := make([][2]int, graphlen) // path[i] = [i号节点的前一节点, 前一节点的弧序号]
	length := make([]int, graphlen)
	h := &MinHeap{HeapNode{startIndex, 0, 0}}

	for i := 0; i < graphlen; i++ {
		visited[i] = false
		length[i] = INT_MAX
	}
	for i := 0; i < graphlen; i++ { //初始化path，方便MultiGuide操作
		path[i] = [2]int{-1, -1}
	}
	length[startIndex] = 0

	var exitIndex int = -1
	var totalLength int
	for h.Len() > 0 {
		x := heap.Pop(h).(HeapNode)
		if visited[x.Index] {
			continue
		}
		visited[x.Index] = true
		if graph[x.Index].VID == destination {
			exitIndex = x.Index
			totalLength = x.Length
			break
		}
		for index, val := range graph[x.Index].ArcList {
			if length[val.TargetIndex] > length[x.Index]+val.Length {
				length[val.TargetIndex] = length[x.Index] + val.Length
				heap.Push(h, HeapNode{val.TargetIndex, length[val.TargetIndex], float32(length[val.TargetIndex])}) //因为不考虑拥挤度，直接以长度作为堆排标准
				path[val.TargetIndex] = [2]int{x.Index, index}
			}
		}
	}
	return exitIndex, totalLength, path
}

/*步行考虑拥挤度*/

func CrowdFoot(startIndex int, destination int) (int, int, float32, [][2]int) {
	graphlen := len(graph)
	visited := make([]bool, graphlen)
	path := make([][2]int, graphlen) // path[i] = [i号节点的前一节点, 前一节点的弧序号]
	length := make([]int, graphlen)
	duration := make([]float32, graphlen)
	h := &MinHeap{HeapNode{startIndex, 0, 0}}

	for i := 0; i < graphlen; i++ {
		visited[i] = false
		length[i] = INT_MAX
		duration[i] = float32(INT_MAX)
	}
	length[startIndex] = 0
	duration[startIndex] = 0

	var exitIndex int = -1
	var totalLength int
	var totalDuration float32
	for h.Len() > 0 {
		x := heap.Pop(h).(HeapNode)
		if visited[x.Index] {
			continue
		}
		visited[x.Index] = true
		if graph[x.Index].VID == destination {
			exitIndex = x.Index
			totalLength = x.Length
			totalDuration = x.Duration
			break
		}
		for index, val := range graph[x.Index].ArcList {
			if duration[val.TargetIndex] > duration[x.Index]+val.FootDuration {
				length[val.TargetIndex] = length[x.Index] + val.Length
				duration[val.TargetIndex] = duration[x.Index] + val.FootDuration
				heap.Push(h, HeapNode{val.TargetIndex, length[val.TargetIndex], val.FootDuration + x.Duration}) //这里考虑最短时间，存入经历时间
				path[val.TargetIndex] = [2]int{x.Index, index}
			}
		}
	}
	return exitIndex, totalLength, totalDuration, path
}

/*所有交通工具最短时间*/

func CrowdBycle(startIndex int, destination int) (int, int, float32, [][2]int) {
	graphlen := len(graph)
	visited := make([]bool, graphlen)
	path := make([][2]int, graphlen) // path[i] = [i号节点的前一节点, 前一节点的弧序号]
	length := make([]int, graphlen)
	duration := make([]float32, graphlen)
	h := &MinHeap{HeapNode{startIndex, 0, 0}}

	for i := 0; i < graphlen; i++ {
		visited[i] = false
		length[i] = INT_MAX
		duration[i] = float32(INT_MAX)
	}
	length[startIndex] = 0
	duration[startIndex] = 0

	var exitIndex int = -1
	var totalLength int
	var totalDuration float32
	for h.Len() > 0 {
		x := heap.Pop(h).(HeapNode)
		if visited[x.Index] {
			continue
		}
		visited[x.Index] = true
		if graph[x.Index].VID == destination {
			exitIndex = x.Index
			totalLength = x.Length
			totalDuration = x.Duration
			break
		}
		for index, val := range graph[x.Index].ArcList {
			if val.IsBycle == true { //如果允许使用自行车，则以自行车时间为准
				if duration[val.TargetIndex] > duration[x.Index]+val.BycleDuration { //则比较的是加上自行车的时间
					length[val.TargetIndex] = length[x.Index] + val.Length
					duration[val.TargetIndex] = duration[x.Index] + val.BycleDuration
					heap.Push(h, HeapNode{val.TargetIndex, length[val.TargetIndex], val.BycleDuration + x.Duration}) //这里考虑最短时间，存入经历时间
					path[val.TargetIndex] = [2]int{x.Index, index}
				}
			} else { //如果不允许使用自行车，则以步行时间为准
				if duration[val.TargetIndex] > duration[x.Index]+val.FootDuration {
					if val.IsBycle == false {
						continue
					} //如果该边不允许自行车通行，则在计算距离的时候跳过该条边
					length[val.TargetIndex] = length[x.Index] + val.Length
					duration[val.TargetIndex] = duration[x.Index] + val.FootDuration
					heap.Push(h, HeapNode{val.TargetIndex, length[val.TargetIndex], val.FootDuration + x.Duration}) //这里考虑最短时间，存入经历时间
					path[val.TargetIndex] = [2]int{x.Index, index}
				}
			}
		}
	}
	return exitIndex, totalLength, totalDuration, path
}

/*多点导航, 全排列递归，用来计算最短途径历程*/
/*其中k是递归层次，m是递归树的总层次*/
func MultiGuide(startIndex int, destination int, rawpathway []int, k int, totalLength int, m int) ([]int, int) {

	var length int
	pathway := make([]int, m)
	copy(pathway, rawpathway)
	tempPath := make([]int, m)
	newPathWay := make([]int, m)
	var allLength int = INT_MAX
	var tempLength int
	var start int
	var temp int
	var exit int
	if k == (m - 1) { //如果此时递归的层次为递归总层次，则返回路径长度和对应顺序
		start = startIndex
		allLength = 0
		for _, des := range pathway {
			exit, length, _ = NoCrowdFoot(start, des)
			if exit == -1 {
				return pathway, -1
			}
			allLength += length
			start = vertexIndex[des]
		}
		exit, length, _ = NoCrowdFoot(start, destination)
		if exit == -1 {
			return pathway, -1
		}
		allLength += length
		return pathway, allLength
	} else {
		allLength = INT_MAX
		for i := k; i < m; i++ {
			temp = pathway[i]
			pathway[i] = pathway[k]
			pathway[k] = temp
			tempPath, tempLength = MultiGuide(startIndex, destination, pathway, k+1, allLength, m)

			if tempLength < allLength {
				allLength = tempLength
				copy(newPathWay, tempPath)

			}
			temp = pathway[i]
			pathway[i] = pathway[k]
			pathway[k] = temp
		}

		return newPathWay, allLength
	}
}

func printTravelInfo(travelInfo TravelInfo) {
	switch travelInfo.TravelContent {
	case "start":
		Log(fmt.Sprintf("%s  开始导航\n", timeString(nowTime)))
	case "stop":
		Log(fmt.Sprintf("%s  停止导航\n", timeString(nowTime)))
	case "cancel":
		Log(fmt.Sprintf("%s  取消导航\n", timeString(nowTime)))
	case "pause":
		Log(fmt.Sprintf("%s  暂停导航\n", timeString(nowTime)))
	case "continue":
		Log(fmt.Sprintf("%s  继续导航\n", timeString(nowTime)))
	case "waitBus":
		Log(fmt.Sprintf("%s  开始等待巴士\n", timeString(nowTime)))
	case "noBus":
		Log(fmt.Sprintf("%s  已无巴士，取消导航\n", timeString(nowTime)))
	case "busArrive":
		Log(fmt.Sprintf("%s  巴士到达当前站点\n", timeString(nowTime)))
	case "busReachDest":
		Log(fmt.Sprintf("%s  巴士抵达目的站点\n", timeString(nowTime)))
	default:
		Log(fmt.Sprintf("%s  TravelContent有误！\n", timeString(nowTime)))
	}
}

/* 绑定 MinHeap 的方法 */

func (h MinHeap) Len() int {
	return len(h)
}

func (h MinHeap) Less(i, j int) bool {
	return int(h[i].Duration) < int(h[j].Duration) // 保证是基于时间的小根堆
}

func (h MinHeap) Swap(i, j int) {
	h[i], h[j] = h[j], h[i]
}

func (h *MinHeap) Push(x interface{}) {
	*h = append(*h, x.(HeapNode))
}

func (h *MinHeap) Pop() interface{} {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[0 : n-1]
	return x
}

type MinHeap []HeapNode
