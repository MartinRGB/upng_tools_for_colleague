

importScripts("pako-local.js","UPNG-local.js")
// console.log('WORKER TASK: ', 'running');

//接受数据
onmessage = function (e) {
  
  var dpr;
  var iw;
  var pw,ph;
  var p;
  var l;
  var imgd;
  var ioff;
  var returnImg,returnX,returnY;


  var myFirstPromise = new Promise(function(resolve, reject){


    dpr = e.data.dpr;
    pw = e.data.pw;
    ph = e.data.ph;
    p = e.data.p;
    l = e.data.l;
    imgd = e.data.imgd;
    ioff = e.data.ioff

    // 接受完数据后
    resolve()

  }).then(function(){
    
    // console.log('WORKER 1st Promise Worked');
    var mySecondPromise = new Promise(function(resolve, reject){


      for(var i=0; i<l; i++) imgd.data[i] = p.nrgba[i];
      var rx = (pw-p.width)/2, ry = (ph-p.height)/2;
      
      if(rx<0) ioff.x = Math.max(rx, Math.min(-rx, ioff.x*dpr))/dpr;
      if(ry<0) ioff.y = Math.max(ry, Math.min(-ry, ioff.y*dpr))/dpr;
      
      //center
      var cx = (rx>0) ? rx : Math.min(0, Math.max(2*rx, ioff.x*dpr+rx));
      var cy = (ry>0) ? ry : Math.min(0, Math.max(2*ry, ioff.y*dpr+ry));

      returnImg = imgd;
      returnX = Math.round(cx);
      returnY =  Math.round(cy);


      // 编码完数据后
      resolve()
    }).then(function(){
      // console.log('WORKER 2nd Promise Worked');
      // console.log(returndata);
      // 发送数据
      postMessage({
        img:returnImg,
        x:returnX,
        y:returnY
      });
    });
  });

}