package main

import (
	"container/heap"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
)


const INT_MAX int = int(^uint(0) >> 1)
const IFpeed int = 3      //步行理想速度定义为3m/s
const IBpeed int = 10 		//自行车理想速度定义为10m/s
var vertexIndex map[int]int
var graph []Vertex

type Vertex struct {
	VID   int
	ArcList []Arc
}

type Arc struct{
	TargetIndex int
	Duration   float32
	Length      int
	IsBycle     bool
}

type HeapNode struct {
    Index    int
	Length   int
    Duration float32  
}

type MinHeap []HeapNode