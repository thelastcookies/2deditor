function getFileAsJSON(fileDOMID) {
  	var file = document.getElementById(fileDOMID).files[0];
	if (!file)
		return;
	var reader = new FileReader();
	var result = null;

	// Handle progress, success, and errors
    reader.fileName = file.name.replace(".cfd", "");
    reader.result = result;
	reader.onprogress = updateProgress;
	reader.onload = loaded;
	reader.onerror = errorHandler;

  	// Read file into memory as UTF-16
  	reader.readAsText(file, "UTF-8");

  	return file.name;
}

function updateProgress(evt) {
	if (evt.lengthComputable) {
  	// evt.loaded and evt.total are ProgressEvent properties
  		var loaded = (evt.loaded / evt.total);
  		if (loaded < 1) {
  		  	// Increase the prog bar length
  		  	// style.width = (loaded * 200) + "px";
  		}
    }
}

function loaded(evt) {
	// Obtain the read file data
	if (evt) {
        try {
            this.result = JSON.parse(evt.target.result);
            let file = {
                fileName: this.fileName,
                fileData: this.result
            }
            fileLoadedCallback (file);
        } catch (err) {
            alert ("所选文件无法解析：" + err);
        }
	}
	// Handle UTF-16 file dump
	// if(utils.regexp.isChinese(fileString)) {
	  //Chinese Characters + Name validation
	// }
	// else {
	    // run other charset test
	// }
	  // xhr.send(fileString)
	}

function errorHandler(evt) {
	if(evt.target.error.name == "NotReadableError") {
	    // The file could not be read
	}
}


// 下载文件方法
var saveFileAsJSON = function (content, filename) {
    var eleLink = document.createElement('a');
    eleLink.download = filename;
    eleLink.style.display = 'none';
    // 字符内容转变成blob地址
    var blob = new Blob([content], {type : 'application/json'});
    eleLink.href = URL.createObjectURL(blob);
    // 触发点击
    document.body.appendChild(eleLink);
    eleLink.click();
    // 然后移除
    document.body.removeChild(eleLink);
};
