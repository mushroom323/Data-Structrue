package main

import (
    "net/http"
    "strconv"
    "io/ioutil"
    "fmt"
    "os"
)

func ServerTest(){
    for {
        res, err := http.Get("http://localhost:" + strconv.FormatInt(int64(port), 10) + "/api/isServing")
        if err == nil {
            defer res.Body.Close()
            body, _ := ioutil.ReadAll(res.Body)
            if string(body) == "true" {
                Log(fmt.Sprintf("Web 服务启动成功，请访问 http://localhost:%d 进入系统", port))
                break
            }
        }
    }
}

func APIHandler(w http.ResponseWriter, req *http.Request){
    w.Header().Set("Access-Control-Allow-Origin", "*")
    w.Header().Set("content-type", "application/json")

    switch req.URL.Path {
        case "/api/upLoad":
            file,header,_ :=req.FormFile("upfile")
            b,_ := ioutil.ReadAll(file)
            upload(b,header.Filename)
        case "/api/downLoad":
            fn := req.FormValue("filename")
            header := w.Header()
            header.Add("Content-Type","application/octet-stream")
            header.Add("Content-Disposition","attachment;filename="+fn)
            b := download(fn)
            w.Write(b)
    }
}

func StartServer(){
    http.HandleFunc("/api/", APIHandler)
    http.Handle("/", http.FileServer(http.Dir("static")))//FileServer返回一个使用FileSystem接口root提供文件访问服务的HTTP处理器。
    go ServerTest()
    err := http.ListenAndServe(":" + strconv.FormatInt(int64(port), 10), nil)
    if err != nil {
        Log(fmt.Sprintf("Web 服务启动失败，请检查您的防火墙设置并确保 %d 端口没有被占用", port))
        os.Exit(1)
    }
    wg.Done()
}