//Main Here

const UPNG = require('./js/UPNG.js')
const UZIP = require('./js/UZIP.js')


var pngs = [];
var curr = -1;
var cnum = 256;	// quality
var cnv, ctx;
var main, list, totl, fopn
var viw = 0, vih = 600;
var limitedvih = 0 ;
var ioff = {x:0, y:0}, mouse=null;
var hasAdded = false;


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

function addPNG(buff, name)
{
    var mgc=[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], ubuff=new Uint8Array(buff);
    for(var i=0; i<8; i++) if(mgc[i]!=ubuff[i]) return;
    var img  = UPNG.decode(buff), rgba = UPNG.toRGBA8(img)[0];
    var npng = {name:name, width:img.width, height:img.height, odata:buff, orgba:new Uint8Array(rgba), ndata:null, nrgba:null };
    var nc = pngs.length;  pngs.push(npng);  recompute(nc);  setCurr(nc);
}
function setCurr(nc) {  curr=nc;  ioff={x:0,y:0};  update();  }

function recompute(i) {
    var p = pngs[i];
    p.ndata = UPNG.encode([p.orgba.buffer], p.width, p.height, cnum);
    if(p.ndata.byteLength > p.odata.byteLength) p.ndata = p.odata;
    var img  = UPNG.decode(p.ndata);
    p.nrgba = new Uint8Array(UPNG.toRGBA8(img)[0]);
}

function updateValue(){
    var tos = 0, tns = 0;

    // Left Value Update
    for(var i=0; i<=pngs.length; i++)
    {
        var p = pngs[i];
        
        //var btn = document.createElement("button");   btn.innerHTML = "X";  if(i<pngs.length) li.appendChild(btn);
        
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
            // li.addEventListener("click", itemClick, false);    
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

    }

    // Canvas Size
    var dpr = getDPR();
    var iw = window.innerWidth-2;
    var pw = Math.floor(Math.min(iw-500, iw/2)*dpr);
    var ph = Math.floor(limitedvih*dpr);
        

    // Update Current Image
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
    

}

function update()
{
    if(curr!=-1) {  list.innerHTML = "";  totl.innerHTML = "";  }
    var tos = 0, tns = 0;

    // Left Value Update
    for(var i=0; i<=pngs.length; i++)
    {
        var p = pngs[i];
        var li = document.createElement("p");  li.setAttribute("class", "item"+(i==curr?" active":"")); li._indx=i;
        
        
        //var btn = document.createElement("button");   btn.innerHTML = "X";  if(i<pngs.length) li.appendChild(btn);
        
        var iname, os, ns, cont, pw=0, ph=0;
        if(i<pngs.length) {  iname=p.name;  os = p.odata.byteLength;  ns = p.ndata.byteLength;  tos+=os;  tns+=ns;  cont=list;  pw=p.width;  ph=p.height;
                             li.addEventListener("click", itemClick, false);    }
        else              {  iname="Total:";  os = tos;  ns = tns;  cont = totl;  }
        
        var cnt = "<b class=\"fname\" title=\""+pw+" x "+ph+"\">"+iname+"</b>";
        
        cnt += toBlock(toKB(os)) + toBlock("➜",2) + toBlock("<b id=\"compressed-size\">"+toKB(ns)+"</b>") + toBlock("<span id=\"compressed-percentage\">" + (100*(ns-os)/os).toFixed(1)+" %", 5 + "</span>");
        //if(i<pngs.length) cnt += toBlock("<big>✖</big>",2);
        li.innerHTML = cnt;
        var btn = document.createElement("button");   btn.innerHTML = "Save";  if(i<pngs.length) li.appendChild(btn);
        
        if(pngs.length!=0)  cont.appendChild(li);
    }



    
    // Canvas Size
    var dpr = getDPR();
    var iw = window.innerWidth-2;
    var pw = Math.floor(Math.min(iw-500, iw/2)*dpr);
    
    var ph = Math.floor(limitedvih*dpr);
        
    cnv.width = pw;  cnv.height = ph;
    var aval = "cursor:grab; cursor:-moz-grab; cursor:-webkit-grab; background-size:"+(16/getDPR())+"px;"
    cnv.setAttribute("style", aval+"width:"+(pw/dpr)+"px; height:"+(ph/dpr)+"px;");
    


    
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
    // 
}
function itemClick(e) {  var ind=e.currentTarget._indx;  setCurr(ind);  var p=pngs[ind];  if(e.target.tagName=="BUTTON") save(p.ndata, p.name);   }

function toKB(n) {  return (n/1024).toFixed(1)+" KB";  }
function toBlock(txt, w) {  var st = w ? " style=\"width:"+w+"em;\"":"";  return "<span"+st+">"+txt+"</span>";  }

const PageServices = {


    Go:function()
    {
        //loadURL("grid.png");  loadURL("bunny.png");

        hasAdded = false;
        
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
        
        dc.addEventListener("dragover", cancel);
        dc.addEventListener("dragenter", cancel);//highlight);
        dc.addEventListener("dragleave", cancel);//unhighlight);
        dc.addEventListener("drop", onFileDrop);
        
        window.addEventListener("resize", resize);
        resize();
        //setTimeout(function() { document.getElementById("bunny").setAttribute("style", "transform: translate(0, 220px)"); }, 1000);
    },

    showOpenDialog:function()	// show open dialog
    {
        var evt = document.createEvent('MouseEvents');
        evt["initMouseEvent"]("click", true, true, document.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        fopn.dispatchEvent(evt);
    },

    moveQual:function(val) {  
            if(hasAdded){
        
                if(val>990) cnum=0;
                else cnum = Math.max(2, Math.round(510*val/1000));
                for(var i=0; i<pngs.length; i++) recompute(i);
                // recompute(curr)
                // update();
                updateValue()
            }
    },

    resetCurrent:function (){
        document.getElementById('eRNG').value = 500;
        if(hasAdded){
            
            cnum = Math.max(2, Math.round(510*500/1000));
            for(var i=0; i<pngs.length; i++) recompute(i);
            updateValue()
            

        }
    },
    saveAll:function ()
    {
        var obj = {};
        for(var i=0; i<pngs.length; i++) obj[pngs[i].name] = new Uint8Array(pngs[i].ndata);
        save(UZIP.encode(obj).buffer, "compressed_images.zip");
    }



}

function onMD(e) {  mouse={x:e.clientX-ioff.x, y:e.clientY-ioff.y};  document.addEventListener("mousemove",onMM,false);  document.addEventListener("mouseup",onMU,false);  }
function onMM(e) {  ioff.x=e.clientX-mouse.x;  ioff.y=e.clientY-mouse.y;  update();  }
function onMU(e) {  document.removeEventListener("mousemove",onMM,false);  document.removeEventListener("mouseup",onMU,false);  }



function onFileDrop(e) {  cancel(e);
    var fls = e.dataTransfer? e.dataTransfer.files : e.target.files;
    for(var i=0; i<fls.length; i++) {
        var f = fls[i];
        var r = new FileReader();
        r._file = f;
        r.onload = dropLoaded;
        r.readAsArrayBuffer(f);
    }
}			
function dropLoaded(e) {  addPNG(e.target.result, e.target._file.name);  unhighlight(e); }
function highlight  (e) {cancel(e); list.style.boxShadow="inset 0px 0px 15px blue"; }
function unhighlight(e) {cancel(e); list.style.boxShadow="none";}
function resize(e) {  
    vih = window.innerHeight-(250)-4;
    limitedvih = Math.min(700,vih)
    viw = Math.min(1000, window.innerWidth-2);//1000;//Math.max(800, Math.floor(window.innerWidth*0.75));
    main.setAttribute("style", "width:"+viw+"px; height:"+limitedvih+"px;");
    list.setAttribute("style", "height:"+(limitedvih-40)+"px;");
    update();
}

function getDPR() {  return window["devicePixelRatio"] || 1;  }
function cancel(e) { e.stopPropagation(); e.preventDefault(); }





module.exports = PageServices;


