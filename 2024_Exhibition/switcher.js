

let parent = 'Student_Posters/'
let indexFile = '/index.html'
let posters = ['Team1', 'Team2', 'Team3', 'Team4', 'Team5', 'Team6', 'Team7']
let defaultPoster = 'PosterDefault';
// not used: 
let currentPoster = 0;
let intervalTime = 240000; //4 minutes 
let trackingActive = false;
let streaming = false;
let demoMode = false
let incrementCounterInterval;

// event when page is finished loading
window.onload = function () {
  updateIframes();
 // incrementCounterInterval = setInterval(incrementCounterDown, 2000); // Call incrementCounter every 1000 milliseconds (1 second)
}


function updateIframes() {
  // inform the iframes that they are in exhibition mode
  var message = {
    type: 'exhibitionMode',
    data: {
      value: true,
    }
  };
  let iframe1 = document.getElementById('screen1');
//  let iframe2 = document.getElementById('screen2');
  // Send the object to the iframe
  iframe1.contentWindow.postMessage(message, '*');
 // iframe2.contentWindow.postMessage(message, '*');
}

function trackingCallback(keyCode) {

  let posterNumber = 0;
  console.log(keyCode)
  if (keyCode == "next") {
    if (currentPoster < posters.length - 1) {
      currentPoster++;
    } else {
      currentPoster = 0;
    }
    posterNumber = currentPoster;
    pickPoster(posterNumber)
  } else {

    switch (keyCode) {
      case 'Digit1':
        posterNumber = 0;
        pickPoster(posterNumber)
        break;
      case 'Digit2':
        posterNumber = 1;
        pickPoster(posterNumber)
        break;
      case 'Digit3':
        posterNumber = 2;
        pickPoster(posterNumber)
        break;
      case 'Digit4':
        posterNumber = 3;
        pickPoster(posterNumber)
        break;
      case 'Digit5':
        posterNumber = 4;
        pickPoster(posterNumber)
        break;
      case 'Digit6':
        posterNumber = 5;
        pickPoster(posterNumber)
        break;
      case 'Digit7':
        posterNumber = 6;
        pickPoster(posterNumber)
        break;
      case 'Digit8':
        posterNumber = 7;
        pickPoster(posterNumber)
        break;
      default:
        posterNumber = null;
    }
  }

}

function changePoster(posterNo) {
  if (posterNo >= 0 && posterNo < posters.length && posterNo != null) {
    console.log("changing posters:" + posterNo)
    currentPoster = posterNo;
    let newPosterURL = parent + '' + posters[posterNo] + '' + indexFile
    console.log(newPosterURL);
    let iframe1 = document.getElementById('screen1');
    iframe1.src = newPosterURL;
   // let iframe2 = document.getElementById('screen2');
   // iframe2.src = newPosterURL;
    // add an event when the iframe is loaded
    iframe1.onload = function () {
      updateIframes();
    }
   // iframe2.onload = function () {
   //   updateIframes();
   // }
  // handling counting 
   // clearInterval(incrementCounterInterval);
  //  incrementCounterInterval = setInterval(incrementCounterDown, 2000); // Call incrementCounter every 1000 milliseconds (1 second)

  } else {
    console.log("changing posters:" + defaultPoster)
    currentPoster = posterNo;
    let newPosterURL = parent + '' + defaultPoster + '' + indexFile
    console.log(newPosterURL);
    let iframe1 = document.getElementById('screen1');
    iframe1.src = newPosterURL;

    iframe1.onload = function () {
      updateIframes();
    }
  }

}

function incrementCounterDown() {
  let iframe1 = document.getElementById('screen1');
 // let iframe2 = document.getElementById('screen2');

  let message = {
    type: 'countDown',
    data: {
      value: true,
    }
  };

  iframe1.contentWindow.postMessage(message, '*');
 // iframe2.contentWindow.postMessage(message, '*');
  console.log("incrementing counter")
}
function incrementCounterUp() {
  let iframe1 = document.getElementById('screen1');
 // let iframe2 = document.getElementById('screen2');

  let message = {
    type: 'countUp',
    data: {
      value: true,
    }
  };

  iframe1.contentWindow.postMessage(message, '*');
  //iframe2.contentWindow.postMessage(message, '*');
  console.log("incrementing counter")
}


// keyPress event
//document.addEventListener('keydown', function (event) {
/*
  // if uparrow used, increment counter
  if (event.code == "ArrowUp") {
    clearInterval(incrementCounterInterval);
    incrementCounterUp();
    }
  // if downarrow used, decrement counter
  if (event.code == "ArrowDown") {
    clearInterval(incrementCounterInterval);
    incrementCounterDown();
    }
  }
    */
//);


function pickPoster(number) {
  // for keyboard selection during testing
  if (number < posters.length && number >= 0) {
    console.log("poster no: " + number)
    transition(number)
    // clearInterval(myInterval);
    // myInterval = setInterval(intervalHandler, 500000); 
  }
}

function transition(posterNo) {
  console.log("try transition animation")
  try {

    let iframe1 = document.getElementById('screen1');

    //let iframe2 = document.getElementById('screen2');

    fadeOut(iframe1, posterNo);
    //fadeOut(iframe2, posterNo);
  } catch (e) {
    console.log("transition failed " + e)
  }
}



function intervalHandler() {
  console.log("intervalStart")
  // console.log("streaming" + streaming + ", trackingActive" + trackingActive);
  //if (!trackingActive && streaming) {
  clearInterval(myInterval);
  myInterval = setInterval(intervalHandler, intervalTime)

  if (currentPoster < posters.length - 1) {
    currentPoster++;
  } else {
    currentPoster = 0;
  }
  pickPoster(currentPoster)
  // transition()
  /*  } else if (!streaming) {
    // not streaming! always show poster 1
    clearInterval(myInterval);
    myInterval = setInterval(intervalHandler, intervalTime)
    //posterCount = 1;
    transition()
  } else {
    // skip change if someone is in front of poster, try again after delay 
    clearInterval(myInterval);
    myInterval = setInterval(intervalHandler, 1000);
    //console.log("tracking: "+ trackingActive);
  }*/
}

let myInterval = setInterval(intervalHandler, intervalTime);

function fadeOut(el, nextPosterNo) {
  let duration = 1000; // Animation duration in milliseconds.
  var step = 10 / duration,
    opacity = 1;
  el.style.opacity = opacity;
  function next() {
    if (opacity <= 0) {
      changePoster(nextPosterNo);
      fadeIn(el)
      return;
    }
    el.style.opacity = (opacity -= step);
    setTimeout(next, 10);
  }
  next();
}

function fadeIn(el) {
  let duration = 1000; // Animation duration in milliseconds.
  var step = 10 / duration,
    opacity = 0;
  el.style.opacity = opacity;
  function next() {
    if (opacity >= 1) {
      return;
    }
    el.style.opacity = (opacity += step);
    setTimeout(next, 10);
  }
  next();
}

// Listen for click events in the parent window
window.addEventListener('click', function(event) {
  console.log('Click detected in parent window');
  // make fullscreen
  document.documentElement.requestFullscreen();


});
