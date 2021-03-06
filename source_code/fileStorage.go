package main

import (
	"archive/zip"
	"bufio"
	"bytes"
	"container/heap"
	"crypto/md5"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"math"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"unsafe"
)

const contentBuffer = 5000000

var testString1 string = "北京邮电大学（Beijing University of Posts and Telecommunications），简称北邮，位于北京市，是中华人民共和国教育部直属、工业和信息化部共建的全国重点大学，位列国家“双一流”建设高校、“211工程”、“985工程优势学科创新平台”，为北京高科大学联盟、中国人工智能教育联席会、CDIO工程教育联盟创始成员，入选国家“111计划”、“2011计划”、中国政府奖学金来华留学生接收院校、教育部第一批卓越工程师教育培养计划高校、国家建设高水平大学公派研究生项目、教育部首批“新工科”研究与实践项目、全国首批深化创新创业教育改革示范高校、一流网络安全学院建设示范项目高校、国家大学生文化素质教育基地、全国邮政行业人才培养基地。"
var testString2 string

func uploadHomework(filedata []byte, filename string, curriName string, homeworkName string, version string) FileError {
	homeworkName = homeworkName + "-" + version + "-"
	filename = homeworkName + filename
	var fileError FileError
	fileError.IsDuplicated = false
	//定义一个查重信号
	flag := false
	//定义文件存储文件夹，并判断是否存在，如果不存在，则创建
	filedir := "document/file"
	_, err = os.Stat(filedir)
	if err != nil {
		os.Mkdir(filedir, 0777)
	}
	//定义作业文件夹，并判断是否存在,若不存在则创建
	hwdir := "document/file/Homework/" + curriName + "/"
	_, err = os.Stat(hwdir)
	if err != nil {
		os.Mkdir(hwdir, 0777)
	}
	//创建压缩文件夹，并判断是否存在，若不存在则创建
	compressdir := "document/file/Compress/" + curriName + "/"
	_, err = os.Stat(compressdir)
	if err != nil {
		os.Mkdir(compressdir, 0777)
	}
	//创建解压文件夹，并判断是否存在，若不存在则创建
	decompressdir := "document/file/Decompress/" + curriName + "/"
	_, err = os.Stat(decompressdir)
	if err != nil {
		os.Mkdir(decompressdir, 0777)
	}
	//简简单单查个重
	//步骤：1、构建map
	md5map, hashmap, err := Md5SumFolder(hwdir)
	if err != nil {
		Log(fmt.Sprintf("Md5map Error: %s", err))
	}
	//步骤：2、计算文件的MD5值，但是先把文件丢到file/目录下，然后再计算
	cachedir := "document/file"
	err = ioutil.WriteFile(cachedir+"/"+filename, filedata, 0777)
	if err != nil {
		Log(fmt.Sprintf("WriteFile Error: %s", err))
	}
	md5value, err := Md5SumFile(cachedir + "/" + filename)
	if err != nil {
		Log(fmt.Sprintf("Md5SumFile Error: %s", err))
	}
	//步骤：3、循环判断map中是否存在该MD5值，如果是就删除文件不存入
	for k, v := range md5map {
		if v == md5value {
			Log(fmt.Sprintf("%s  文件 %s 已存在", timeString(nowTime), k))
			flag = true
			err = os.Remove(cachedir + "/" + filename)
			if err != nil {
				Log(fmt.Sprintf("Error: %s", err))
			}
			fileError.IsDuplicated = true
			break
		}
	}
	//无事发生，存入文件，顺带压缩
	if flag == false {
		f := false
		//稍微确定一下文件名，先是带后缀名的
		fullFilename := cachedir + "/" + filename
		//Log(fmt.Sprintf("fullFilename: %s", fullFilename))
		filenameWithSuffix := path.Base(fullFilename)
		//提取一下文件的后缀名
		fileSuffix := path.Ext(filenameWithSuffix)
		if fileSuffix == ".txt" {
			f = true
		}
		//得到没有后缀名的文件
		filenameOnly := strings.TrimSuffix(filenameWithSuffix, fileSuffix)
		compresspath := compressdir + "/" + filenameOnly
		//Log(fmt.Sprintf("filenameOnly: %s", filenameOnly))
		//顺便获取一下压缩前文件的大小
		fileSizebefore, err := os.Stat(fullFilename)
		if err != nil {
			Log(fmt.Sprintf("上传作业：获取原文件大小失败: %s", err))
		}
		//输出一下原文件的大小
		Log(fmt.Sprintf("上传作业[%s]：原文件大小：%.2f KB", filename, float64(fileSizebefore.Size())/1000))
		//别急，总之别急，先进行一个汉明距离的算
		s := params()
		//teststring1的hash值
		// hash1 := s.Simhash(testString1)
		// Log(fmt.Sprintf("内置测试文件的字符串hash值为 %d ", hash1))
		//再看看上传文件跟测试字符串的相似度
		test2, err := ioutil.ReadFile(cachedir + "/" + filename)
		testString2 = string(test2)

		hash2 := s.Simhash(testString2)
		//Log(fmt.Sprintf("当前文件的字符串hash值为 %d ", hash2))
		//计算相似度
		for k, v := range hashmap {
			sm := s.Similarity(v, hash2)
			Log(fmt.Sprintf("与文件 %s 的相似度为 %.2f %%", k, sm*100))
			//距离
			ts := s.HammingDistance(v, hash2)
			Log(fmt.Sprintf("与文件 %s 汉明距离为 %d", k, ts))
		}
		if f == false {
			//先压缩
			HuffmanEncoding(cachedir+"/"+filename, compresspath)
			//再获取一下压缩后文件的大小
			fileSizeafter, err := os.Stat(compresspath)
			if err != nil {
				Log(fmt.Sprintf("上传作业：获取压缩后文件大小失败: %s", err))
			}
			//输出一下压缩后文件的大小
			Log(fmt.Sprintf("上传作业[%s]：压缩后文件大小：%.2f KB", filename, float64(fileSizeafter.Size())/1000))
			//再解压
			depress(compresspath, decompressdir+"/"+filename)
			//输出日志信息，获得压缩率
			Log(fmt.Sprintf("压缩文件 %s，压缩率 %.2f%%", filename, float64(fileSizeafter.Size())/float64(fileSizebefore.Size())*100))
			//判断一下md5值是否一致
			md5value1, err := Md5SumFile(decompressdir + "/" + filename)
			if err != nil {
				Log(fmt.Sprintf("获取解压文件[%s]MD5失败: %s", filename, err))
			}
			if md5value1 != md5value {
				ErrManage(decompressdir+"/"+filename, cachedir+"/"+filename)
				Log(fmt.Sprintf("验证失败！解压文件[%s]MD5与原文件不一致", filename))
			} else {
				Log(fmt.Sprintf("验证成功！解压文件[%s]MD5与原文件一致", filename))
			}

			address := hwdir + "/" + filename
			err = os.Rename(cachedir+"/"+filename, address)
			if err != nil {
				Log(fmt.Sprintf("Rename Error: %s", err))
			}
			//输出日志信息
			Log(fmt.Sprintf("%s  存入文件 %s", timeString(nowTime), filename))
		} else {
			//先压缩
			HuffmanEncoding(cachedir+"/"+filename, compresspath)
			//再获取一下压缩后文件的大小
			fileSizeafter, err := os.Stat(compresspath)
			if err != nil {
				Log(fmt.Sprintf("上传作业：获取压缩后文件大小失败: %s", err))
			}
			//输出一下压缩后文件的大小
			Log(fmt.Sprintf("上传作业[%s]：压缩后文件大小：%.2f KB", filename, float64(fileSizeafter.Size())/1000))

			//输出日志信息，获得压缩率
			Log(fmt.Sprintf("压缩文件 %s，压缩率 %.2f%%", filename, float64(fileSizeafter.Size())/float64(fileSizebefore.Size())*100))
			ErrManage(decompressdir+"/"+filename, cachedir+"/"+filename)
			Log(fmt.Sprintf("验证成功！解压文件[%s]MD5与原文件一致", filename))
			address := hwdir + "/" + filename
			err = os.Rename(cachedir+"/"+filename, address)
			if err != nil {
				Log(fmt.Sprintf("Rename Error: %s", err))
			}
			//输出日志信息
			Log(fmt.Sprintf("%s  存入文件 %s", timeString(nowTime), filename))
		}
	}
	return fileError
}

func uploadResource(filedata []byte, filename string, curriName string) FileError {
	var fileError FileError
	fileError.IsDuplicated = false
	//定义一个查重信号
	flag := false
	//定义文件存储文件夹，并判断是否存在，如果不存在，则创建
	filedir := "document/file"
	_, err = os.Stat(filedir)
	if err != nil {
		os.Mkdir(filedir, 0777)
	}
	//定义资源文件夹，并判断是否存在,若不存在则创建
	resdir := "document/file/Resource/" + curriName + "/"
	_, err = os.Stat(resdir)
	if err != nil {
		os.Mkdir(resdir, 0777)
	}

	//创建压缩文件夹，并判断是否存在，若不存在则创建
	compressdir := "document/file/Compress/" + curriName + "/"
	_, err = os.Stat(compressdir)
	if err != nil {
		os.Mkdir(compressdir, 0777)
	}

	//创建解压文件夹，并判断是否存在，若不存在则创建
	decompressdir := "document/file/Decompress/" + curriName + "/"
	_, err = os.Stat(decompressdir)
	if err != nil {
		os.Mkdir(decompressdir, 0777)
	}
	//简简单单查个重
	//步骤：1、构建map
	md5map, hashmap, err := Md5SumFolder(resdir)
	if err != nil {
		Log(fmt.Sprintf("Md5map Error: %s", err))
	}
	//步骤：2、计算文件的MD5值，但是先把文件丢到file/目录下，然后再计算
	cachedir := "document/file"
	err = ioutil.WriteFile(cachedir+"/"+filename, filedata, 0777)
	if err != nil {
		Log(fmt.Sprintf("Error: %s", err))
	}
	md5value, err := Md5SumFile(cachedir + "/" + filename)
	if err != nil {
		Log(fmt.Sprintf("Error: %s", err))
	}
	//步骤：3、循环判断map中是否存在该MD5值，如果是就删除文件不存入
	for k, v := range md5map {
		if v == md5value {
			Log(fmt.Sprintf("%s  文件 %s 已存在", timeString(nowTime), k))
			flag = true
			err = os.Remove(cachedir + "/" + filename)
			if err != nil {
				Log(fmt.Sprintf("Error: %s", err))
			}
			fileError.IsDuplicated = true
			break
		}
	}
	//无事发生，存入文件，顺带压缩
	if flag == false {
		//稍微确定一下文件名，先是带后缀名的
		f := false
		fullFilename := cachedir + "/" + filename
		filenameWithSuffix := path.Base(fullFilename)
		//提取一下文件的后缀名
		fileSuffix := path.Ext(filenameWithSuffix)
		if fileSuffix == ".txt" {
			f = true
		}
		//得到没有后缀名的文件
		filenameOnly := strings.TrimSuffix(filenameWithSuffix, fileSuffix)
		compresspath := compressdir + filenameOnly
		//顺便获取一下压缩前文件的大小
		fileSizebefore, err := os.Stat(fullFilename)
		if err != nil {
			Log(fmt.Sprintf("获取原文件大小失败: %s", err))
		}
		//输出一下源文件的大小
		Log(fmt.Sprintf("文件 %s 压缩前大小: %.2f KB", filename, float64(fileSizebefore.Size())/1000))
		//别急，总之别急，先进行一个汉明距离的算
		s := params()
		//teststring1的hash值
		// hash1 := s.Simhash(testString1)
		// Log(fmt.Sprintf("内置测试文件的字符串hash值为 %d ", hash1))
		//再看看上传文件跟测试字符串的相似度
		test2, err := ioutil.ReadFile(cachedir + "/" + filename)
		testString2 = string(test2)

		hash2 := s.Simhash(testString2)
		//Log(fmt.Sprintf("当前文件的字符串hash值为 %d ", hash2))
		//计算相似度
		for k, v := range hashmap {
			sm := s.Similarity(v, hash2)
			Log(fmt.Sprintf("与文件 %s 的相似度为 %.2f %%", k, sm*100))
			//距离
			ts := s.HammingDistance(v, hash2)
			Log(fmt.Sprintf("与文件 %s 汉明距离为 %d", k, ts))
		}
		if f == false {
			//先压缩
			HuffmanEncoding(cachedir+"/"+filename, compresspath)
			//获取一下压缩后文件的大小
			fileSizeafter, err := os.Stat(compresspath)
			if err != nil {
				Log(fmt.Sprintf("获取压缩文件大小失败: %s", err))
			}
			//输出一下压缩后文件的大小
			Log(fmt.Sprintf("文件 %s 压缩后大小: %.2f KB", filename, float64(fileSizeafter.Size())/1000))
			//再解压
			depress(compresspath, decompressdir+"/"+filename)
			//输出日志信息，获得压缩率
			Log(fmt.Sprintf("压缩文件 [%s]，压缩率 %.2f%%", filename, float64(fileSizeafter.Size())/float64(fileSizebefore.Size())*100))
			//判断一下解压之后的文件是否与源文件md5值相同
			md5value1, err := Md5SumFile(decompressdir + "/" + filename)
			if err != nil {
				Log(fmt.Sprintf("获取解压文件[%s]的MD5错误: %s", filename, err))
			}
			address := resdir + "/" + filename
			if md5value1 != md5value {
				ErrManage(decompressdir+"/"+filename, cachedir+"/"+filename)
				Log(fmt.Sprintf("验证失败！解压文件[%s]的MD5值与原文件不一致", filename))
			} else {
				Log(fmt.Sprintf("验证成功！解压文件[%s]的MD5值与原文件一致", filename))
			}
			//资源文件存储路径，错误信息用于判断
			// address := resdir + "/" + filename
			err = os.Rename(cachedir+"/"+filename, address)
			if err != nil {
				Log(fmt.Sprintf("Rename Error: %s", err))
			}
			//输出日志信息
			Log(fmt.Sprintf("%s  存入文件 [%s]", timeString(nowTime), filename))
		} else {
			//先压缩
			HuffmanEncoding(cachedir+"/"+filename, compresspath)
			//获取一下压缩后文件的大小
			fileSizeafter, err := os.Stat(compresspath)
			if err != nil {
				Log(fmt.Sprintf("获取压缩文件大小失败: %s", err))
			}
			//输出一下压缩后文件的大小
			Log(fmt.Sprintf("文件 %s 压缩后大小: %.2f KB", filename, float64(fileSizeafter.Size())/1000))
			//输出日志信息，获得压缩率
			Log(fmt.Sprintf("压缩文件 [%s]，压缩率 %.2f%%", filename, float64(fileSizeafter.Size())/float64(fileSizebefore.Size())*100))
			address := resdir + "/" + filename
			ErrManage(decompressdir+"/"+filename, cachedir+"/"+filename)
			Log(fmt.Sprintf("验证成功！解压文件[%s]的MD5值与原文件一致", filename))
			//资源文件存储路径，错误信息用于判断
			// address := resdir + "/" + filename
			err = os.Rename(cachedir+"/"+filename, address)
			if err != nil {
				Log(fmt.Sprintf("Rename Error: %s", err))
			}
			//输出日志信息
			Log(fmt.Sprintf("%s  存入文件 [%s]", timeString(nowTime), filename))
		}
	}
	return fileError
}

func download(filename string) []byte {
	b, err := ioutil.ReadFile("document/file/" + filename)
	if err != nil {
		Log(fmt.Sprintf("下载文件错误，文件名： %s", filename))
		os.Exit(1)
	}
	return b
}

// Md5SumFile 计算文件filename的MD5值
func Md5SumFile(filename string) (value [md5.Size]byte, err error) {
	data, err := ioutil.ReadFile(filename)
	if err != nil {
		return
	}
	value = md5.Sum(data)
	return value, nil
}

// Md5SumFolder 计算文件夹folderpath中所有文件的MD5值
func Md5SumFolder(folderpath string) (md5map map[string][md5.Size]byte, hashmap map[string]int64, err error) {
	s := params()
	results := make(map[string][md5.Size]byte)
	hashm := make(map[string]int64)
	filepath.Walk(folderpath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		//判断文件属性
		if info.Mode().IsRegular() {
			result, err := Md5SumFile(path)
			bytes, err := ioutil.ReadFile(path)
			str := BytesToString(bytes)
			hash := s.Hash(str)
			if err != nil {
				return err
			}
			results[path] = result
			hashm[path] = hash
		}
		return nil
	})
	return results, hashm, nil
}

/*压缩*/
func HuffmanEncoding(filePath, outPath string) {
	// 思路： 1. 读取文本内容，存放到内存中，或者以流的形式读取文本内容，构建二叉树即可。
	// 统计每个字出现的频次
	file, err := os.Open(filePath)
	if err != nil {
		log.Fatalln(err)
		return
	}
	defer file.Close()
	// 我们不需要关心总量是多少，因为分母是固定的，只需要知道频率按次数排序即可。
	imap := getFrequencyMap(file)
	plist := make(treeHeap, 0)
	// 遍历map ,将键值对存入pair，然后按频率排序
	for k, v := range imap {
		plist = append(plist, &TreeNode{Val: k, Times: v})
	}
	sort.Sort(plist)
	//如果文件是空的，就没必要构造
	if len(plist) == 0 {
		return
	}
	hTree := initHuffmanTree(plist)
	/*遍历哈弗曼树，生成哈夫曼编码表(正表，用于编码),key(ASSCII),value(路径痕迹)*/
	encodeMap := make(map[int]string)
	createEncodingTable(hTree, encodeMap)

	// 将输入文件的字符通过码表编码，输出到另一个文件 , 压缩模块完成
	encoding(filePath, outPath, encodeMap)

}

func writeTable(path string, codeMap map[int]string, left int) {
	file, err := os.Create(path)
	if err != nil {
		return
	}
	// 第一行，写入文件头的长度
	var buff bytes.Buffer
	buff.WriteString(strconv.Itoa(len(codeMap)+1) + "\n")
	for k, v := range codeMap {
		buff.WriteString(strconv.Itoa(k) + ":" + v + "\n")
	}
	buff.WriteString(strconv.Itoa(left) + "\n")
	file.WriteString(buff.String())
	file.Close()
}

/* 一次性读入，存到string或者buffer.string中 */
func encoding(inPath string, outPath string, encodeMap map[int]string) {
	/*1.先尝试一次性读入*/
	inFile, err := os.Open(inPath)
	defer inFile.Close()
	if err != nil {
		return
	}
	reader := bufio.NewReader(inFile)
	fileContent := make([]byte, contentBuffer)
	count, _ := reader.Read(fileContent)
	var buff bytes.Buffer
	//string编码
	for i := 0; i < count; i++ {
		v := fileContent[i]
		if code, ok := encodeMap[int(v)]; len(code) != 0 && ok {
			buff.WriteString(code)
		}
	}
	res := make([]byte, 0)
	var buf byte = 0
	//bit编码
	//TODO 记录bit剩余位，很简单只要对buff.bytes取长度对8取余即可
	for idx, bit := range buff.Bytes() {
		//每八个位使用一个byte读取，结果存入res数组即可
		pos := idx % 8
		if pos == 0 && idx > 0 {
			res = append(res, buf)
			buf = 0
		}
		if bit == '1' {
			buf |= 1 << pos
		}
	}
	//TODO 这个left是剩余待处理的位数
	left := buff.Len() % 8
	res = append(res, buf)
	// 将编码数组写入文件 , TODO 先将码表和left数写入文件，解码时在开头读取
	writeTable(outPath, encodeMap, left)
	outFile, err := os.OpenFile(outPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	wcount, err := outFile.Write(res)
	if err != nil {
		fmt.Println(wcount)
		return
	}
}

//码表，考虑到性能必须要生成 map, key(int对应ASCII，string对应bit编码，后续转成bit)
func createEncodingTable(node *TreeNode, encodeMap map[int]string) {
	/*思路：回溯遍历二叉树，用byte记录0 1，遇到叶子节点就转换成string存入码表
	  遍历顺序：根左右
	*/
	tmp := make([]byte, 0)
	var depth func(treeNode *TreeNode)
	depth = func(root *TreeNode) {
		//如果已经遍历到空，返回
		if root == nil {
			return
		}
		//如果遍历到的是叶子节点 , byte转换成string，入表
		if root.Left == nil && root.Right == nil {
			encodeMap[root.Val] = string(tmp)
		}
		//如果是普通节点，左右递归回溯即可 #规则： 左0右1
		tmp = append(tmp, '0')
		depth(root.Left)
		tmp[len(tmp)-1] = '1'
		depth(root.Right)
		tmp = tmp[:len(tmp)-1]
	}
	depth(node)
}

func initHuffmanTree(plist treeHeap) *TreeNode {
	//使用优先队列构造最小路径权值哈夫曼树
	heap.Init(&plist)
	for plist.Len() > 1 {
		t1 := heap.Pop(&plist).(*TreeNode)
		t2 := heap.Pop(&plist).(*TreeNode)
		root := &TreeNode{Times: t1.Times + t2.Times}
		if t1.Times > t2.Times {
			root.Right, root.Left = t1, t2
		} else {
			root.Right, root.Left = t2, t1
		}
		heap.Push(&plist, root)
	}
	return plist[0]
}

func getFrequencyMap(file *os.File) map[int]int {
	imap := make(map[int]int)
	// 读入文件数据，readline 记入map中，统计频次
	// 注意：Create不区分文件名大小写
	reader := bufio.NewReader(file)
	buffer := make([]byte, contentBuffer)
	readCount, _ := reader.Read(buffer)
	for i := 0; i < readCount; i++ {
		imap[int(buffer[i])]++
	}
	return imap
}

func depress(inPath, depressPath string) {
	// originPath 原文件(或者可以传入码表)， inPath 读入被压缩的文件 , depressPath 还原后的输出路径
	encodeMap := make(map[int]string)
	decodeMap := make(map[string]int)
	//2.读入压缩文件
	compressFile, _ := os.Open(inPath)
	// br 读取文件头 ,返回偏移量
	br := bufio.NewReader(compressFile)
	left, offset := readTable(*br, encodeMap)
	for idx, v := range encodeMap {
		decodeMap[v] = idx
	}
	// 解码string暂存区
	var buff bytes.Buffer
	// 编码bytes暂存区
	codeBuff := make([]byte, contentBuffer)
	codeLen, _ := compressFile.ReadAt(codeBuff, int64(offset))
	//遍历解码 , 读取比特
	for i := 0; i < codeLen; i++ {
		//对每个byte单独进行位运算转string
		perByte := codeBuff[i]
		for j := 0; j < 8; j++ {
			//与运算
			buff.WriteString(strconv.Itoa(int((perByte >> j) & 1)))
		}
	}
	// 对照码表，解码string , 对8取余目的是解决正好读满8个bit的情况发生
	contentStr := buff.String()[:buff.Len()-(8-left)%8]
	bytes := make([]byte, 0)
	//用切片读contenStr即可
	for star, end := 0, 1; end <= len(contentStr); {
		charValue, ok := decodeMap[contentStr[star:end]]
		if ok {
			bytes = append(bytes, byte(charValue))
			star = end
		}
		end++
	}

	depressFile, _ := os.Create(depressPath)
	depressFile.Write(bytes)
	depressFile.Close()
}

func readTable(br bufio.Reader, encodeMap map[int]string) (int, int) {
	lineStr, _, _ := br.ReadLine()
	lines, _ := strconv.Atoi(string(lineStr))
	for i := 0; i < lines-1; i++ {
		lineContent, _, _ := br.ReadLine()
		kvArr := strings.Split(string(lineContent), ":")
		k, v := kvArr[0], kvArr[1]
		kNum, _ := strconv.Atoi(k)
		encodeMap[kNum] = v
	}
	leftStr, _, _ := br.ReadLine()
	left, _ := strconv.Atoi(string(leftStr))
	return left, br.Size() - br.Buffered()
}

// 打包成zip文件
func Zip(src_dir string, zip_file_name string) {

	// 预防：旧文件无法覆盖
	os.RemoveAll(zip_file_name)

	// 创建：zip文件
	zipfile, _ := os.Create(zip_file_name)
	defer zipfile.Close()

	// 打开：zip文件
	archive := zip.NewWriter(zipfile)
	defer archive.Close()

	// 遍历路径信息
	filepath.Walk(src_dir, func(path string, info os.FileInfo, _ error) error {

		// 如果是源路径，提前进行下一个遍历
		if path == src_dir {
			return nil
		}

		// 获取：文件头信息
		header, _ := zip.FileInfoHeader(info)
		header.Name = strings.TrimPrefix(path, src_dir+`\`)

		// 判断：文件是不是文件夹
		if info.IsDir() {
			header.Name += `/`
		} else {
			// 设置：zip的文件压缩算法
			header.Method = zip.Deflate
		}

		// 创建：压缩包头部信息
		writer, _ := archive.CreateHeader(header)
		if !info.IsDir() {
			file, _ := os.Open(path)
			defer file.Close()
			io.Copy(writer, file)
		}
		return nil
	})
}

/**
距离 补偿
*/
func (s *SimHash) HammingDistance(hash, other int64) int {
	x := (hash ^ other) & ((1 << uint64(s.HashBits)) - 1)
	tot := 0
	for x != 0 {
		tot += 1
		x &= x - 1
	}
	return tot
}

/**
错误处理
**/
func ErrManage(dstFileName string, srcFileName string) (written int64, err error) {
	srcFile, err := os.Open(srcFileName)
	if err != nil {
		fmt.Println("open file err:", err)
	}
	//关闭流
	defer srcFile.Close()
	reader := bufio.NewReader(srcFile)
	dstFile, err := os.OpenFile(dstFileName, os.O_WRONLY|os.O_CREATE, 0666) //0666 在windos下无效
	if err != nil {
		fmt.Println("open file err:", err)
		return
	}
	writer := bufio.NewWriter(dstFile)
	//关闭流
	defer dstFile.Close()
	return io.Copy(writer, reader)
}

/**
  相似度
*/
func (s *SimHash) Similarity(hash, other int64) float64 {
	a := float64(hash)
	b := float64(other)
	if a > b {
		return b / a
	}
	return a / b
}

/**
  海明距离hash
*/
func (s *SimHash) Simhash(str string) int64 {
	m := strings.Split(str, " ")

	token_int := make([]int, s.HashBits)
	for i := 0; i < len(m); i++ {
		temp := m[i]
		t := s.Hash(temp)
		for j := 0; j < s.HashBits; j++ {
			bitMask := int64(1 << uint(j))
			if t&bitMask != 0 {
				token_int[j] += 1
			} else {
				token_int[j] -= 1
			}
		}

	}
	var fingerprint int64 = 0
	for i := 0; i < s.HashBits; i++ {
		if token_int[i] >= 0 {
			fingerprint += 1 << uint64(i)
		}
	}
	return fingerprint
}

/**
  初始化
*/
func params() (s *SimHash) {
	s = &SimHash{}
	s.HashBits = 64
	return s
}

/**
hash 值
*/
func (s *SimHash) Hash(token string) int64 {
	if token == "" {
		return 0
	} else {
		x := int64(int(token[0]) << 7)
		m := int64(1000003)
		mask := math.Pow(2, float64(s.HashBits-1))
		s := strconv.FormatFloat(mask, 'f', -1, 64)
		tsk, _ := strconv.ParseInt(s, 10, 64)
		for i := 0; i < len(token); i++ {
			tokens := int64(int(token[0]))
			x = ((x * m) ^ tokens) & tsk
		}
		x ^= int64(len(token))
		if x == -1 {
			x = -2
		}
		return int64(x)
	}
}

func StringToBytes(s string) []byte {
	return *(*[]byte)(unsafe.Pointer(
		&struct {
			string
			Cap int
		}{s, len(s)},
	))
}

func BytesToString(b []byte) string {
	return *(*string)(unsafe.Pointer(&b))
}
