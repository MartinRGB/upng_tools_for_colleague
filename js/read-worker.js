

importScripts("pako-local.js","UPNG-local.js")
// console.log('WORKER TASK: ', 'running');

//接受数据
onmessage = function (e) {
  
  var buff;
  var name;
  var thisIndex;
  var returnpng;


  var myFirstPromise = new Promise(function(resolve, reject){


    buff = e.data.buff;
    name = e.data.name;
    thisIndex = e.data.num;

    // 接受完数据后
    resolve()

  }).then(function(){
    
    var mySecondPromise = new Promise(function(resolve, reject){

      var mgc=[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      var ubuff=new Uint8Array(buff);
      for(var i=0; i<8; i++) if(mgc[i]!=ubuff[i]) return;
      var img  = UPNG.decode(buff)
      var rgba = UPNG.toRGBA8(img)[0];
      var npng = {name:name, width:img.width, height:img.height, odata:buff, orgba:new Uint8Array(rgba), ndata:null, nrgba:null };
      returnpng = npng;
      // 编码完数据后
      resolve()
    }).then(function(){
      // 发送数据
      postMessage({
        png:returnpng,
        index:thisIndex
      });
    });
  });

}