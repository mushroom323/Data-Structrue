package main

import (
	"fmt"
	"io/ioutil"
	"os"
 )

 func uploadHomework(file []byte,filename string){
	 adress := "E:/Data Structrue/file/Homework"+filename
	 ioutil.WriteFile(adress,file,0777)
	 
	 Log(fmt.Sprintf("存入文件，文件名为： %s",filename))
 }

 func uploadResource(file []byte,filename string){
	adress := "E:/Data Structrue/file/Resource"+filename
	ioutil.WriteFile(adress,file,0777)
	
	Log(fmt.Sprintf("存入文件，文件名为： %s",filename))
}

 func download(filename string) []byte{
	 b,err := ioutil.ReadFile("E:/Data Structrue/file/"+filename)
	 if(err != nil){
		Log(fmt.Sprintf("下载文件错误，文件名： %s",filename))
		os.Exit(1)
	 }
	 return b
	 
 }