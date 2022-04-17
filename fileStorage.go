package main

import (
	"crypto/md5"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
)

func uploadHomework(filedata []byte, filename string) FileError {
	var fileError FileError
	fileError.IsDuplicated = false
	//定义一个查重信号
	flag := false
	//定义作业文件夹，并判断是否存在,若不存在则创建
	hwdir := "./file/Homework"
	_, err = os.Stat(hwdir)
	if err != nil {
		os.Mkdir(hwdir, 0777)
	}
	//简简单单查个重
	//步骤：1、构建map
	md5map, err := Md5SumFolder(hwdir)
	if err != nil {
		Log(fmt.Sprintf("Md5map Error: %s", err))
	}
	//步骤：2、计算文件的MD5值，但是先把文件丢到file/目录下，然后再计算
	cachedir := "./file"
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
			Log(fmt.Sprintf("文件已存在，文件名为： %s", k))
			flag = true
			err = os.Remove(cachedir + "/" + filename)
			if err != nil {
				Log(fmt.Sprintf("Error: %s", err))
			}
			fileError.IsDuplicated = true
			break
		}
	}
	//无事发生，存入文件
	if flag == false {
		address := hwdir + "/" + filename
		err = os.Rename(cachedir+"/"+filename, address)
		if err != nil {
			Log(fmt.Sprintf("Rename Error: %s", err))
		}
		//输出日志信息
		Log(fmt.Sprintf("存入文件，文件名为： %s", filename))
	}
	return fileError
}

func uploadResource(filedata []byte, filename string) FileError {
	var fileError FileError
	fileError.IsDuplicated = false
	//定义一个查重信号
	flag := false
	//定义资源文件夹，并判断是否存在,若不存在则创建
	resdir := "./file/Resource"
	_, err = os.Stat(resdir)
	if err != nil {
		os.Mkdir(resdir, 0777)
	}
	//简简单单查个重
	//步骤：1、构建map
	md5map, err := Md5SumFolder(resdir)
	if err != nil {
		Log(fmt.Sprintf("Md5map Error: %s", err))
	}
	//步骤：2、计算文件的MD5值，但是先把文件丢到file/目录下，然后再计算
	cachedir := "./file"
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
			Log(fmt.Sprintf("文件已存在，文件名为： %s", k))
			flag = true
			err = os.Remove(cachedir + "/" + filename)
			if err != nil {
				Log(fmt.Sprintf("Error: %s", err))
			}
			fileError.IsDuplicated = true
			break
		}
	}
	//无事发生，存入文件
	if flag == false {
		//资源文件存储路径，错误信息用于判断
		address := resdir + "/" + filename
		err = os.Rename(cachedir+"/"+filename, address)
		if err != nil {
			Log(fmt.Sprintf("Rename Error: %s", err))
		}
		//输出日志信息
		Log(fmt.Sprintf("存入文件，文件名为： %s", filename))
	}
	return fileError
}

func download(filename string) []byte {
	b, err := ioutil.ReadFile("./file/" + filename)
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
func Md5SumFolder(folderpath string) (md5map map[string][md5.Size]byte, err error) {
	results := make(map[string][md5.Size]byte)
	filepath.Walk(folderpath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		//判断文件属性
		if info.Mode().IsRegular() {
			result, err := Md5SumFile(path)
			if err != nil {
				return err
			}
			results[path] = result
		}
		return nil
	})
	return results, nil
}
