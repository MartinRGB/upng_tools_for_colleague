console.log('WORKER TASK: ', 'running');



//接受数据
onmessage = function (e) {
  
  var eImg;
  var eNum;
  var returndata;

  var myFirstPromise = new Promise(function(resolve, reject){


    eImg = e.data.img;
    eNum = e.data.num;
    resolve()

  }).then(function(){
    
    console.log('WORKER 1st Promise Worked');
    var mySecondPromise = new Promise(function(resolve, reject){

      // returndata = UPNG.encode([eImg.orgba.buffer], eImg.width, eImg.height, eNum);
      resolve()
    }).then(function(){
      console.log('WORKER 2nd Promise Worked');
      // console.log(returndata);
      //postMessage('Hello main, I am worker.js');
    });
  });

  
  // var returndata = UPNG.encode([eImg.orgba.buffer], eImg.width, eImg.height, eNum);

  // return new Promise((resolve, reject) => {
  //   // 发送数据事件
  //   postMessage('Hello main, I am worker.js');
  //   console.log('WORKER Promise Worked');
  // });
}