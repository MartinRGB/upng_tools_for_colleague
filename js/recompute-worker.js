

importScripts("pako-local.js","UPNG-local.js")
// console.log('WORKER TASK: ', 'running');

//接受数据
onmessage = function (e) {
  
  var cnum;
  var p;
  var pnd,pnr;

  var myFirstPromise = new Promise(function(resolve, reject){


    p = e.data.img;
    cnum = e.data.num;
    console.log("worker received,num is ",e.data.index)
    // 接受完数据后
    resolve()

  }).then(function(){
    
    // console.log('WORKER 1st Promise Worked');
    var mySecondPromise = new Promise(function(resolve, reject){

      p.ndata = UPNG.encode([p.orgba.buffer], p.width, p.height, cnum);
      // console.log(p.ndata);
      if(p.ndata.byteLength > p.odata.byteLength) p.ndata = p.odata;
      //console.log('pndatalength',p.ndata.byteLength)
      var img  = UPNG.decode(p.ndata);
      p.nrgba  = new Uint8Array(UPNG.toRGBA8(img)[0]);

      pnd = p.ndata;
      pnr = p.nrgba;
      // 编码完数据后
      resolve()
    }).then(function(){
      // console.log('WORKER 2nd Promise Worked');
      // 发送数据
      postMessage({
        pndata:pnd,
        pnrgba:pnr
      });
    });
  });

}