//Main Here

// ############ TODO ############
// DeleteAnimation 优化
// Download -> Compress
// ADDPNG 读取优化
// ADDPNG 选中顺序
// ADDPNG 加载顺序
// ##############################

const UPNG = require('./js/UPNG.js')
const UZIP = require('./js/UZIP.js')
var Promise = require('promise');

var pngs = [];
var curr = -1;
var cnum = 256;	// quality
var cnv, ctx;
var main, list, totl, fopn,lbottom,lmiddle,dragarea;
var viw = 0, vih = 720;
var limitedvih = 720,limitedviw = 720 ;
var ioff = {x:0, y:0}, mouse=null;
var hasAdded = false;
var qualValue = 500;
var shouldListAnim = false;
var prevliLength = 0;
var nowliLength = 0;
var windowEl;
var transitionEvent;
var dragCounter = 0;
var compressCounter = 0;


function save(buff, path)
{
    if(pngs.length==0) return;
    var data = new Uint8Array(buff);
    var a = document.createElement( "a" );
    var blob = new Blob([data]);
    var url = window.URL.createObjectURL( blob );
    a.href = url;  a.download = path;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

    
function loadURL(path, resp)
{
    var request = new XMLHttpRequest();
    request._fname = path;
    request.open("GET", path, true);
    request.responseType = "arraybuffer";
    request.onload = urlLoaded;
    request.send();
}
function urlLoaded(e) {  addPNG(e.target.response, e.target._fname);  }


function setCurr(nc) {  
    curr=nc;  
    ioff={x:0,y:0};  

    update()

    // Add List Anim
    return new Promise((resolve, reject) => {

        if(shouldListAnim && hasAdded){
            
            return new Promise((resolve, reject) => {
                console.log('list animation');

                var addArray = document.querySelectorAll("#list #image-li");

                //开启底部动画
                if(lbottom.offsetHeight != 203+1){
                    lbottom.setAttribute("style", "height:"+(203)+"px;");
                    lmiddle.setAttribute("style", "height:calc(100% - (106px + 203px));");
                }


                // 从上一次动画完成处开始动画，到最大长度
                var addPNGStartIndex = 0 + prevliLength;
                
                function myLoop () {           //  create a loop function
                    setTimeout(function () {    //  call a 3s setTimeout when the loop is called

                        if(addArray[addPNGStartIndex] != null){
                            addArray[addPNGStartIndex].setAttribute("style", "opacity: 1;transform: scale(1) translateY(0px)");
                        }
                        addPNGStartIndex++;                     //  increment the counter
                        if (addPNGStartIndex < addArray.length) {            //  if the counter < 10, call the loop function
                            myLoop();             //  ..  again which will trigger another 
                        }                        //  ..  setTimeout()
                    }, 50)

                }

                myLoop();    

                // 等所有动画执行后，开启切换
                setTimeout(function () { 
                    prevliLength = nowliLength;
                }, 50*(nowliLength - prevliLength));

            });
        }
    });  
}


function multiThreadRecompute(i,func,callback){
    var p = pngs[i]
    var worker = new Worker('./js/recompute-worker.js');

    
    //发送数据
    worker.postMessage({
        img:p,
        num:cnum,
        index:i
    });
    
    // 接受数据
    worker.addEventListener('message', function (e) {
        

        console.log("worker finished,num is ",i)
        // 一定要确保销毁
        worker.terminate();
    
        return new Promise((resolve, reject) => {

            p.ndata = e.data.pndata;
            p.nrgba = e.data.pnrgba;
            shouldListAnim = true;
            resolve()
            // 因为多线程，不一定哪个最先，这里要处理,setCurr 选择错误之所在
            func(i);
            // console.log('WORKER TERMINATED');
        }).then(function(){
            compressCounter++;

            if(compressCounter == nowliLength){
                callback()
            }

            console.log("compressCounter is ", compressCounter )
            console.log("nowliLength is ", compressCounter )
        });
        
    });

}

function update()
{

    if(curr!=-1) {  list.innerHTML = "";  totl.innerHTML = "";  }
    if(curr == -1){
        // list.innerHTML = "<div id=\"drag-container\"style=\"font-size:1.3em; padding:1em; text-align:center;height:100%;display:table;\"><div id=\"drag-area\" onclick=\"PageServices.showOpenDialog()\"><div id=\"drag-placeholder\" class=\"drag-placeholder\"></div><!-- <span>Drag PNG files here!</span> --></div></div>"

        list.innerHTML = "<div id=\"drag-container\"style=\"font-size:1.3em; padding:1em; text-align:center;height:100%;display:table;\"><div id=\"drag-area\" onclick=\"PageServices.showOpenDialog()\"><img src=\"./asset/art.svg\" class=\"empty-img\"><span class=\"empty-text\">Please add PNG</span></div><!-- <span>Drag PNG files here!</span> --></div></div>"
    }
    var tos = 0, tns = 0;

    // Left Value Update
    for(var i=0; i<=pngs.length; i++)
    {

        var p = pngs[i];
        var li = document.createElement("p");  
        li.setAttribute("class", "item"+(i==curr?" active":"")); 

        li._indx=i;
        li.id='image-li'

        //var btn = document.createElement("button");   btn.innerHTML = "X";  if(i<pngs.length) li.appendChild(btn);
        
        var iname, os, ns, cont, pw=0, ph=0;
        if(i<pngs.length) {  iname=p.name;  os = p.odata.byteLength;  ns = p.ndata.byteLength;  tos+=os;  tns+=ns;  cont=list;  pw=p.width;  ph=p.height;li.addEventListener("click", itemClick, false);

            //做列表动画
            if(shouldListAnim){
                //如果不是新添加的
                if(i<prevliLength){
                    li.setAttribute( "style", "opacity: 1;transform: scale(1) translateY(0px)");
                }
                //如果是新添加的
                else{
                    li.setAttribute("style","opacity: 0;transform: scale(0.6) translateY(60px);");
                }
            }
            //不做列表动画
            else{
                li.setAttribute( "style", "opacity: 1;transform: scale(1) translateY(0px)");
            }
        }
        else{  
            iname="Total:";  os = tos;  ns = tns;  cont = totl;  
        }
        
        var cnt = "<div id=\"info-container\"><div id=\"title-container\"><b class=\"fname\" title=\""+pw+" x "+ph+"\">"+iname+"</b></div><div id=\"meta-container\"> ";
        
        //toBlock("➜",2)
        cnt += toBlock(toKB(os)) + "<span id=\"compressed-arrow\">➜</span>"
        + toBlock("<b id=\"compressed-size\">"+toKB(ns)+"</b>") + toBlock("<span id=\"compressed-percentage\">" + (100*(ns-os)/os).toFixed(1)+" %", 5 + "</span></div></div>");
        if(i<pngs.length) cnt += toBlock("<big>✖</big>",2);
        li.innerHTML = cnt;
        var btncontainer = document.createElement("div");
        btncontainer.id="btn-container";
        var btn = document.createElement("button");   btn.innerHTML = "<span class=\"icon-download---FontAwesome\"></span><span style=\"margin-left: 5px;font-size: 16px;font-weight: bold;\"> SAVE</span>";  
        if(i<pngs.length) li.appendChild(btncontainer);
        btncontainer.appendChild(btn);
        
        if(pngs.length!=0)  cont.appendChild(li);

    }

    // Canvas Size
    var dpr = getDPR();
    var iw = window.innerWidth-2;

    //Changed to fixed value
    // var pw = 720;  //Math.floor(Math.min(iw-500, iw/2)*dpr)
    // var ph = 720;  //Math.floor(limitedvih*dpr)
    var pw = Math.floor(limitedviw*dpr);
    var ph = Math.floor(limitedvih*dpr);
        
    cnv.width = pw;  cnv.height = ph;
    // var aval = "cursor:grab; cursor:-moz-grab; cursor:-webkit-grab; background-size:"+(16/getDPR())+"px;"
    var aval = "cursor:grab; cursor:-moz-grab; cursor:-webkit-grab; background-size:"+(30)+"px;"
    cnv.setAttribute("style", aval+"width:"+(pw/dpr)+"px; height:"+(ph/dpr)+"px;");
    // cnv.setAttribute("style", aval+"width:"+(720)+"px; height:"+(720)+"px;");
    
    
    // Update Current Image When Compressing
    if(curr!=-1) {
        var p = pngs[curr], l = p.width*p.height*4;					
        var imgd = ctx.createImageData(p.width, p.height);
        for(var i=0; i<l; i++) imgd.data[i] = p.nrgba[i];
        ctx.clearRect(0,0,cnv.width,cnv.height);
        var rx = (pw-p.width)/2, ry = (ph-p.height)/2;
        
        if(rx<0) ioff.x = Math.max(rx, Math.min(-rx, ioff.x*getDPR()))/getDPR();
        if(ry<0) ioff.y = Math.max(ry, Math.min(-ry, ioff.y*getDPR()))/getDPR();
        
        var cx = (rx>0) ? rx : Math.min(0, Math.max(2*rx, ioff.x*getDPR()+rx));
        var cy = (ry>0) ? ry : Math.min(0, Math.max(2*ry, ioff.y*getDPR()+ry));
        ctx.putImageData(imgd,Math.round(cx), Math.round(cy));
    }

    if(curr!=-1){
        hasAdded = true;
    }
    else{
        hasAdded = false;
    }

}

function itemClick(e) {  


    //不做列表添加动画
    shouldListAnim = false;
    var index = e.currentTarget._indx; 
    if(e.target.innerHTML != '✖'){
        selectPNG(index,e)
    }
    else{
        removePNG(index);
    }
}


function multiThreadRead(buff,name){

    var worker = new Worker('./js/read-worker.js');

    //发送数据
    worker.postMessage({
        buff:buff,
        name:name
    });
    
    // 接受数据
    worker.addEventListener('message', function (e) {
        
        // 一定要确保销毁
        worker.terminate();
    
        return new Promise((resolve, reject) => {

            // Add Code Here
            var nc = pngs.length; 
            // 排序错误问题所在 
            pngs.push(e.data.png);  
            
            compressCounter = 0;
            multiThreadRecompute(nc,setCurr,null)
            
            resolve()
        })
        
    });

}

var canInitLoading = true;

function addPNG(buff, name)
{

    //排序错误了
    //multiThreadRead(buff,name);


    if(canInitLoading){
        document.getElementById('window-scale-container').setAttribute("style","transform:scale(0);opacity:0");
        document.getElementById('window-loader').setAttribute("style","transform:translate(-50%,-50%) scale(0.25);opacity:1;");
        canInitLoading = false;
    }
    
    


    return new Promise((resolve, reject) => {
        var mgc=[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
        var ubuff=new Uint8Array(buff);
        for(var i=0; i<8; i++) if(mgc[i]!=ubuff[i]) return;
        var img  = UPNG.decode(buff)
        var rgba = UPNG.toRGBA8(img)[0];
        var npng = {name:name, width:img.width, height:img.height, odata:buff, orgba:new Uint8Array(rgba), ndata:null, nrgba:null };
        var nc = pngs.length;  
        pngs.push(npng);  
    
        // // ### MultiThread ### 还可以进一步优化 选择错误了
        compressCounter = prevliLength;
        multiThreadRecompute(nc,setCurr,afterAdd)
    });

}

function beforeAdd(i){

}

function afterAdd(){
    document.getElementById("window-area").setAttribute("style","opacity:0;visibility:hidden;");
    document.getElementById("window-border").style.border = "3px dashed #c3c3c3";
    document.getElementById("window-scale-container").style.transform = "scale(1)";
    document.getElementById("window-scale-container").style.opacity = "0";
    document.getElementById("window-text").style.color = "#b5b5b5";
    document.getElementById("canvas1-bezier").setAttribute("style","fill:#c5c5c5;");
    canInitLoading = true;
    return new Promise((resolve, reject) => {
        document.getElementById('window-scale-container').setAttribute("style","transform:scale(1);opacity:0");
        document.getElementById('window-loader').setAttribute("style","transform:translate(-50%,-50%) scale(0);opacity:0;");

    });
}


function selectPNG(index,e){

    // Select Item;
    setCurr(index);  
    var p=pngs[index];  
    if(e.target.tagName=="BUTTON") save(p.ndata, p.name); 
}

function removePNG(index){
    // Delete Animation
    var addArray = document.querySelectorAll("#list #image-li");
    
    
            for(var i=0; i<pngs.length; i++){
                // Delete 选中项
                // 移除 clickListener
                addArray[i].removeEventListener("click", itemClick, false);
                if(i == index){
                    // 最后一项目
                    if(index == pngs.length -1){
                        addArray[i].setAttribute("style", "transform: scale(0.6) translateY(0px);opacity:0 !important;");
                    }
                    // 其余项目
                    else{
                        addArray[i].setAttribute("style", "transform: scale(0.6) translateY(60px);opacity:0 !important;");
                    }
                }
                // Delete 选中项底部项
                else if(i > index){
    
                    if(i - index < Math.ceil(list.offsetHeight/80)){
                        addArray[i].setAttribute("style", "transform:scale(1) translateY(-90px);");
                    }
                }
            }
    
            setTimeout(function () {    //  call a 3s setTimeout when the loop is called
                    pngs.splice(index, 1);
    
                    // 删除后，更新 liLength 4 list Anim
                    nowliLength -=1;
                    prevliLength -=1;
                
                    //删除除最后一个
                    if(index <= pngs.length-1 && index >= 0){
                        setCurr(index);
                    }
                    else{
                        //完全清空
                        if(pngs.length == 0){
                            setCurr(-1)
                            if(lbottom.offsetHeight == 203+1){
                                lbottom.setAttribute("style", "height:"+(161)+"px;");
                                lmiddle.setAttribute("style", "height:calc(100% - (106px + 162px));");
                            }
                            totl.innerHTML = "";
            
                        }
                        //删除最后一个
                        else{
                            setCurr(index-1)
                        }
                    }
                    
                    // 添加 clickListener
                    for(var i=0; i<pngs.length; i++){
                        addArray[i].addEventListener("click", itemClick, false);
                    }
             }, 500)
}

function toKB(n) {  return (n/1024).toFixed(1)+" KB";  }
function toBlock(txt, w) {  var st = w ? " style=\"width:"+w+"em;\"":"";  return "<span"+st+">"+txt+"</span>";  }

const PageServices = {


    Go:function()
    {

        hasAdded = false;
        shouldListAnim = false;
        nowliLength = 0;
        prevliLength = 0;

        lmiddle = document.getElementById("l-middle");
        lbottom = document.getElementById("l-bottom");
        main = document.getElementById("main");  
        list = document.getElementById("list");
        totl = document.getElementById("totl");
        cnv = document.getElementById("cnv");  ctx = cnv.getContext("2d");
        cnv.addEventListener("mousedown", onMD, false);
        
        
        fopn = document.createElement("input");  
        fopn.setAttribute("type", "file");
        fopn.addEventListener("change", onFileDrop, false);
        document.body.appendChild(fopn);
        fopn.setAttribute("style", "display:none");
        fopn.setAttribute("multiple","");
        
        var dc = document.body;
        
        windowEl = document.getElementById("window-area");
        transitionEvent = whichTransitionEvent();

        dc.addEventListener("dragover", cancel); //cancel
        dc.addEventListener("dragenter", highlight);//cancel);
        dc.addEventListener("dragleave", unhighlight);//cancel);
        // dc.addEventListener("dragend", unhighlight);//cancel);
        // dc.addEventListener("mouseout", unhighlight);//cancel);
        dc.addEventListener("drop", onFileDrop);
        
        window.addEventListener("resize", resize);
        resize();
        return new Promise((resolve, reject) => {
            console.log('go');
            // ### not MultiThread
            update();
        });



    },

    showOpenDialog:function()	// show open dialog
    {
        var evt = document.createEvent('MouseEvents');
        evt["initMouseEvent"]("click", true, true, document.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        fopn.dispatchEvent(evt);
    },


    moveQual:function(val) {  
        if(hasAdded){
    
            qualValue = val;
        }
    },

    resetAll:function (){

        if(document.getElementById('eRNG').value != 500){
            compressAll(resetedAllBefore,resetedAllAfter)
        }
    },

    saveAll:function ()
    {

        // Original
        // var obj = {};
        // for(var i=0; i<pngs.length; i++) obj[pngs[i].name] = new Uint8Array(pngs[i].ndata);
        // save(UZIP.encode(obj).buffer, "compressed_images.zip");

        compressAll(compressedAllBefore,compressedAllAfter);
    }

}
// ###### Compress ######

function compressAll(beforeCompress,afterCompress){
    

    var myFirstPromise = new Promise(function(resolve, reject){
        if(hasAdded){
            beforeCompress()

            setTimeout(function(){
                resolve()
            }, 50);
        }

    });
    
    myFirstPromise.then(function(){
        
        for(var i=0; i<pngs.length; i++){
            multiThreadRecompute(i,null,afterCompress)
        }
    });
}

function resetedAllBefore(){

    cnum = 256;
    compressCounter = 0;
    document.getElementById('reset-icon').setAttribute("style","transform: scale(0.75);opacity:0;")
    document.getElementById('reset-loading').setAttribute("style","transform:translate(23px,5px) scale(0.75);opacity: 1;")
    document.getElementById('reset-btn').setAttribute("style","cursor:progress;")

}


function resetedAllAfter(){
    update()
    return new Promise((resolve, reject) => {
        setTimeout(function(){
            document.getElementById('reset-icon').setAttribute("style","transform: scale(1);opacity:1;")
            document.getElementById('reset-loading').setAttribute("style","transform:translate(23px,5px) scale(0);opacity: 0;")
            document.getElementById('reset-btn').setAttribute("style","")
            document.getElementById('eRNG').value = 500;
        }, 250);
    });

}

function compressedAllBefore(){

    if(qualValue>1000) cnum=0;
    else cnum = Math.max(2, Math.round(500*qualValue/1000));
    compressCounter = 0;

    document.getElementById('compress-icon').setAttribute("style","transform: scale(0.75);opacity:0;")
    document.getElementById('compress-loading').setAttribute("style","transform:translate(48px,5px) scale(0.75);opacity: 1;")
    document.getElementById('compress-btn').setAttribute("style","cursor:progress;")	
}

function compressedAllAfter(){
    update()
    return new Promise((resolve, reject) => {
        setTimeout(function(){
            document.getElementById('compress-icon').setAttribute("style","transform: scale(1);opacity:1;")
            document.getElementById('compress-loading').setAttribute("style","transform:translate(48px,5px) scale(0);opacity: 0;")
            document.getElementById('compress-btn').setAttribute("style","")
        }, 250);
    });
}

// ###### Move Canvas Listener ######
function onMD(e) {  mouse={x:e.clientX-ioff.x, y:e.clientY-ioff.y};  document.addEventListener("mousemove",onMM,false);  document.addEventListener("mouseup",onMU,false);  }
function onMM(e) {ioff.x=e.clientX-mouse.x;  ioff.y=e.clientY-mouse.y;
    moveCurr(curr);  
}
function onMU(e) {  document.removeEventListener("mousemove",onMM,false);  document.removeEventListener("mouseup",onMU,false);  }

// ###### File Drop Data ######
function onFileDrop(e) {  cancel(e);
    var fls = e.dataTransfer? e.dataTransfer.files : e.target.files;
    for(var i=0; i<fls.length; i++) {

        console.log(fls[i].name)
        var f = fls[i];
        var r = new FileReader();
        r._file = f;
        r.onload = dropLoaded;
        r.readAsArrayBuffer(f);
    }
    // 一旦上传文件，立即更新列表数据
    // unhighlight(e);  

    nowliLength += fls.length;
}			
function dropLoaded(e) {  addPNG(e.target.result, e.target._file.name); 
    return new Promise((resolve, reject) => {
        console.log('loaded');
    });
}

// ###### CSS Transition Finished CallBack ######
function whichTransitionEvent(){
    var t,
        el = document.createElement("fakeelement");
  
    var transitions = {
      "transition"      : "transitionend",
      "OTransition"     : "oTransitionEnd",
      "MozTransition"   : "transitionend",
      "WebkitTransition": "webkitTransitionEnd"
    }
  
    for (t in transitions){
      if (el.style[t] !== undefined){
        return transitions[t];
      }
    }
}

// ###### File Drop Animation ######
function highlight  (e) {cancel(e); 

        dragCounter++;
        console.log(dragCounter)
        //console.log(e.type)
        document.getElementById("window-area").setAttribute("style","opacity:1;visibility:visible");
        document.getElementById("window-border").style.border = "3px dashed #848484";
        document.getElementById("window-scale-container").style.transform = "scale(1.13)";
        document.getElementById("window-scale-container").style.opacity = "1";
        document.getElementById("window-text").style.color = "#909090";
        document.getElementById("canvas1-bezier").setAttribute("style","fill:#8c8c8c;");
        windowEl.addEventListener(transitionEvent, highlightAnimCallback);
    
}
function highlightAnimCallback(event) {
    windowEl.removeEventListener(transitionEvent, highlightAnimCallback);

}


function unhighlight(e) {cancel(e); 
        dragCounter--;
        console.log(dragCounter)
        if (dragCounter == 0) { 
            
            document.getElementById("window-area").setAttribute("style","opacity:0;visibility:hidden;");
            document.getElementById("window-border").style.border = "3px dashed #c3c3c3";
            document.getElementById("window-scale-container").style.transform = "scale(1)";
            document.getElementById("window-scale-container").style.opacity = "0";
            document.getElementById("window-text").style.color = "#b5b5b5";
            document.getElementById("canvas1-bezier").setAttribute("style","fill:#c5c5c5;");
            windowEl.addEventListener(transitionEvent, unhighlightAnimCallback);
        }
}

function unhighlightAnimCallback(event) {
    windowEl.removeEventListener(transitionEvent, unhighlightAnimCallback);
}

// ###### Resize Event ######
function resize(e) {  

    vih = window.innerHeight;
    viw = window.innerWidth - 480;
    limitedvih = Math.max(720,vih)
    limitedviw = Math.max(720,viw)

    updateResize()
}

function getDPR() {  return window["devicePixelRatio"] || 1;  }
function cancel(e) { e.stopPropagation(); e.preventDefault(); }

// Some Optimize Functions
function updateResize(){
    // Canvas Size
    var dpr = getDPR();
    var iw = window.innerWidth-2;
    var pw = Math.floor(limitedviw*dpr);
    var ph = Math.floor(limitedvih*dpr);
        
    cnv.width = pw;  cnv.height = ph;
    var aval = "cursor:grab; cursor:-moz-grab; cursor:-webkit-grab; background-size:"+(30)+"px;"
    cnv.setAttribute("style", aval+"width:"+(pw/dpr)+"px; height:"+(ph/dpr)+"px;");
    
    // Update Current Image When Compressing
    if(hasAdded){
        var p = pngs[curr], l = p.width*p.height*4;					
        var imgd = ctx.createImageData(p.width, p.height);
        for(var i=0; i<l; i++) imgd.data[i] = p.nrgba[i];
        ctx.clearRect(0,0,cnv.width,cnv.height);
        var rx = (pw-p.width)/2, ry = (ph-p.height)/2;
        
        if(rx<0) ioff.x = Math.max(rx, Math.min(-rx, ioff.x*getDPR()))/getDPR();
        if(ry<0) ioff.y = Math.max(ry, Math.min(-ry, ioff.y*getDPR()))/getDPR();
        
        var cx = (rx>0) ? rx : Math.min(0, Math.max(2*rx, ioff.x*getDPR()+rx));
        var cy = (ry>0) ? ry : Math.min(0, Math.max(2*ry, ioff.y*getDPR()+ry));
        ctx.putImageData(imgd,Math.round(cx), Math.round(cy));
    }
    else{
        ctx.clearRect(0,0,cnv.width,cnv.height);
    }
    
}

// ###### Update Curr ListData & Canvas Data ######
function updateCurr(i){
    var tos = 0, tns = 0;

    var p = pngs[i];
    
    var iname, os, ns, cont, pw=0, ph=0;
    if(i<pngs.length) {  
        iname=p.name;  
        os = p.odata.byteLength;  
        ns = p.ndata.byteLength;  
        tos+=os;  
        tns+=ns;  
        cont=list;  
        pw=p.width;  
        ph=p.height;  
    }
    else             
    {  
        iname="Total:";  
        os = tos;  
        ns = tns;  
        cont = totl;  
    }
    
    var cnt = "<b class=\"fname\" title=\""+pw+" x "+ph+"\">"+iname+"</b>";

    document.querySelectorAll("#compressed-size")[i].innerHTML = toKB(ns)

    document.querySelectorAll("#compressed-percentage")[i].innerHTML = (100*(ns-os)/os).toFixed(1)+" %", 5

    //### 差一个统计计算，需要在最后一个 worker 结束后，计算

    // Canvas Size
    var dpr = getDPR();
    var pw = Math.floor(limitedviw*dpr);
    var ph = Math.floor(limitedvih*dpr);
        
    // Update Current Image
    if(i == curr){
        
        l = p.width*p.height*4;					
        var imgd = ctx.createImageData(p.width, p.height);
        for(var i=0; i<l; i++) imgd.data[i] = p.nrgba[i];
        ctx.clearRect(0,0,cnv.width,cnv.height);
        var rx = (pw-p.width)/2, ry = (ph-p.height)/2;
        
        if(rx<0) ioff.x = Math.max(rx, Math.min(-rx, ioff.x*getDPR()))/getDPR();
        if(ry<0) ioff.y = Math.max(ry, Math.min(-ry, ioff.y*getDPR()))/getDPR();
        
        var cx = (rx>0) ? rx : Math.min(0, Math.max(2*rx, ioff.x*getDPR()+rx));
        var cy = (ry>0) ? ry : Math.min(0, Math.max(2*ry, ioff.y*getDPR()+ry));
        ctx.putImageData(imgd,Math.round(cx), Math.round(cy));

    }
}

// ###### Move Curr Canvas Data ######
function moveCurr(curr)
{

    // Canvas Size
    var dpr = getDPR();
    var iw = window.innerWidth-2;
    var pw = Math.floor(limitedviw*dpr);
    var ph = Math.floor(limitedvih*dpr);


    if(curr!=-1) {
        var p = pngs[curr], l = p.width*p.height*4;		
        var imgd = ctx.createImageData(p.width, p.height);
        for(var i=0; i<l; i++) imgd.data[i] = p.nrgba[i];
        ctx.clearRect(0,0,cnv.width,cnv.height);
        var rx = (pw-p.width)/2, ry = (ph-p.height)/2;
        
        if(rx<0) ioff.x = Math.max(rx, Math.min(-rx, ioff.x*getDPR()))/getDPR();
        if(ry<0) ioff.y = Math.max(ry, Math.min(-ry, ioff.y*getDPR()))/getDPR();
        
        //center
        var cx = (rx>0) ? rx : Math.min(0, Math.max(2*rx, ioff.x*getDPR()+rx));
        var cy = (ry>0) ? ry : Math.min(0, Math.max(2*ry, ioff.y*getDPR()+ry));
        ctx.putImageData(imgd,Math.round(cx), Math.round(cy));
    }

}

module.exports = PageServices;



// function recompute(i) {
//     var p = pngs[i];
//     p.ndata = UPNG.encode([p.orgba.buffer], p.width, p.height, cnum);
//     if(p.ndata.byteLength > p.odata.byteLength) p.ndata = p.odata;
//     var img  = UPNG.decode(p.ndata);
//     p.nrgba = new Uint8Array(UPNG.toRGBA8(img)[0]);
//     console.log('recomputed')
// }


// function updateValue(){
//     var tos = 0, tns = 0;

//     // Left Value Update
//     for(var i=0; i<=pngs.length; i++)
//     {
//         var p = pngs[i];
        
//         //var btn = document.createElement("button");   btn.innerHTML = "X";  if(i<pngs.length) li.appendChild(btn);
        
//         var iname, os, ns, cont, pw=0, ph=0;
//         if(i<pngs.length) {  
//             iname=p.name;  
//             os = p.odata.byteLength;  
//             ns = p.ndata.byteLength;  
//             tos+=os;  
//             tns+=ns;  
//             cont=list;  
//             pw=p.width;  
//             ph=p.height;  
//         }
//         else             
//         {  
//             iname="Total:";  
//             os = tos;  
//             ns = tns;  
//             cont = totl;  
//         }
        
//         var cnt = "<b class=\"fname\" title=\""+pw+" x "+ph+"\">"+iname+"</b>";

//         document.querySelectorAll("#compressed-size")[i].innerHTML = toKB(ns)
//         document.querySelectorAll("#compressed-percentage")[i].innerHTML = (100*(ns-os)/os).toFixed(1)+" %", 5

//     }

//     // Canvas Size
//     var dpr = getDPR();
//     var iw = window.innerWidth-2;

//     //Changed to fixed Value;
//     // var pw = 720; //Math.floor(Math.min(iw-500, iw/2)*dpr)
//     // var ph = 720; //Math.floor(limitedvih*dpr)
//     var pw = Math.floor(limitedviw*dpr);
//     var ph = Math.floor(limitedvih*dpr);
        

//     // Update Current Image
//     if(curr!=-1) {
//         var p = pngs[curr], l = p.width*p.height*4;					
//         var imgd = ctx.createImageData(p.width, p.height);
//         for(var i=0; i<l; i++) imgd.data[i] = p.nrgba[i];
//         ctx.clearRect(0,0,cnv.width,cnv.height);
//         var rx = (pw-p.width)/2, ry = (ph-p.height)/2;
        
//         if(rx<0) ioff.x = Math.max(rx, Math.min(-rx, ioff.x*getDPR()))/getDPR();
//         if(ry<0) ioff.y = Math.max(ry, Math.min(-ry, ioff.y*getDPR()))/getDPR();
        
//         var cx = (rx>0) ? rx : Math.min(0, Math.max(2*rx, ioff.x*getDPR()+rx));
//         var cy = (ry>0) ? ry : Math.min(0, Math.max(2*ry, ioff.y*getDPR()+ry));
//         ctx.putImageData(imgd,Math.round(cx), Math.round(cy));
//     }

// }


// ############# WORKER EXAMPLE #############

// ### Classic ### 
// var worker = new Worker('./js/worker.js');

// console.log('MAIN TASK: ', 'running');


// //发送数据
// worker.postMessage('Hello Worker, I am main.js');

// // 接受数据
// worker.addEventListener('message', function (e) {
    
//     console.log('MAIN RECEIVE: ',e.data);


//     return new Promise((resolve, reject) => {
//         worker.terminate();
//         console.log('WORKER TERMINATED');
//     });
    
// });


// worker.postMessage(addSummary(2,3));

// function addSummary(a,b){
//     return (a+b).toString();
// }


// ### Tiny Worker ###
//console.log('MAIN PROCESS: ', 'running');

// var Worker = require("tiny-worker");
// var worker = new Worker("./js/worker.js");

// var worker = new Worker(function () {
//     console.log('WORKER TASK: ', 'running');
//     self.onmessage = function (e) {
//         console.log('WORKER RECEIVE: ', e.data);

//         return new Promise((resolve, reject) => {
//             // 发送数据事件
//             postMessage('Hello main, I am worker.js');
//             console.log('WORKER Promise Worked');
//         });
//     };
// });

 
// worker.onmessage = function (e) {
//     console.log('MAIN RECEIVE: ',e.data);

//     return new Promise((resolve, reject) => {
//         worker.terminate();
//         console.log('WORKER TERMINATED');
//     });
// };
 
// worker.postMessage("Hello Worker, I am main.js!");


// ### Parallel ###
//var para = new Parallel(UPNG.encode([p.orgba.buffer], p.width, p.height, cnum));
//console.log(para.data); // prints [1, 2, 3, 4, 5]

// ############################################