import P5 from 'p5';
import { Camera } from './webcam.js'
import { setupMoveNet, stopMoveNet, POSE_CONFIG, poses, AdjacentPairs } from './MoveNetTensorFlow.js'
import { webCamSketch } from './debugDisplay.js'
import { setUpGui, dragElement } from './GUI.js'
import { setUpOSC, realsensePos, lastOSC, OSCdepthData, OSCdepthW, OSCdepthH, OSCtracking } from './OSC_Control.js'
import { recordCanvas, recordSetup, stopRecordCanvas, recording } from './recordCanvas.js'

// debug gui
let Settings = {
  poseDetection: false,
}

let webCamWrapper;
let currentNumber = 9;

const pageWidth = 1080; // resolution 
const pageHeight = 1920; // resolution 
let incrementCounterInterval;
let skeletons = poses;
export let camera, poseDetection;
export let position;// blob center 
export let posNormal// blob center normalised
export let mainP5Sketch;

export let depthData;
export let depthW; // width of data array
export let depthH; // width of height array
export let tracking; // width of height array
export let oscSignal = false;// osc signal
export let debug = true;

// helper variables for scalable positioning
export const screens = [{ x: 0, y: 0, w: 100, h: 100, cntX: 50, cntY: 50 }]
export let vw = 1; // 1 percent of viewport width;
export let vh = 1; // 1 percent of viewport height;

let gui;

let fullscreenMode = false;
let fpsAverage = 0;
let enableDepth = false;
let animationLoopEnabled = true;
let exhibitionMode = false;
let manualCounter = false;
export function setDebug(value) {
  debug = value;
}

export function setup(p5Instance, modelURL, _enableDepth, _animationLoopEnabled) {
  console.log("P5 vesrion" + P5.VERSION);
  recordSetup();

  if (_enableDepth != undefined) {
    enableDepth = _enableDepth
    setUpOSC(enableDepth) // depthEnabled, rgbEnabled
  } else {
    setUpOSC(false)
  }
  if (_animationLoopEnabled != undefined) {
    animationLoopEnabled = _animationLoopEnabled;
  }
  POSE_CONFIG.modelUrl = modelURL;
  console.log(POSE_CONFIG.modelUrl);
  position = createVector(0, 0, 0);
  posNormal = createVector(0, 0, 0); // normalised
  correctAspectRatio();
  mainP5Sketch = p5Instance;
  mainP5Sketch.mousePressed = function () {
    if (mouseButton === LEFT) {
      if (mainP5Sketch.mouseX > 0 && mainP5Sketch.mouseY > 0 && mainP5Sketch.mouseX < width && mainP5Sketch.mouseY < height) {
        openFullscreen();
      }
    }
  }

  document.addEventListener('fullscreenchange', (event) => {
    // document.fullscreenElement will point to the element that
    // is in fullscreen mode if there is one. If there isn't one,
    // the value of the property is null.
    if (document.fullscreenElement) {
      console.log(`Element: ${document.fullscreenElement.id} entered full-screen mode.`);
      fullscreenMode = true;
      resized();
    } else {
      console.log('Leaving full-screen mode.');
      fullscreenMode = false;
      resized();
    }
  });



  window.onresize = resized;

  const pressed = new Set();

  mainP5Sketch.keyPressed = function (evt) {
    const { code } = evt;
    if (!pressed.has(code)) {
      pressed.add(code);
      console.log(pressed);
      if (pressed.has("Shift") || pressed.has("ShiftLeft") && pressed.has("KeyR") && !recording) {
        recordCanvas();
      }
      if (pressed.has("Shift") || pressed.has("ShiftLeft") && pressed.has("KeyS") && recording) {
        stopRecordCanvas();
      }
      // handle counter 
      if (pressed.has("ArrowUp")) {
        // cancel incrementCounter interval and increase counter by 1
        clearInterval(incrementCounterInterval);
        incrementCounter();
        manualCounter = true;
      } else if (pressed.has("ArrowDown")) {
        clearInterval(incrementCounterInterval);
        deincrementCounter();
        manualCounter = true;
      }

      if ( pressed.has("ShiftLeft") && pressed.has("KeyP")) {
        debug = !debug;
      }

    }
  }

  mainP5Sketch.keyReleased = function (evt) {
    pressed.delete(evt.code);
  }


  document.addEventListener('keypress', (event) => {
    // this is for passing keyboard events to parent when in presentation mode
    try {
      window.parent.trackingCallback(event.code);
    } catch (e) {
    }
  });

  // counter 

  incrementCounterInterval = setInterval(incrementCounter, 2000); // Call incrementCounter every 1000 milliseconds (1 second)
}

// mouse click


document.addEventListener("DOMContentLoaded", DOMContentLoadedEvent, false)
async function DOMContentLoadedEvent() {
  // let webCamStream = setupWebCamPreview();
  gui = setUpGui(Settings, datGuiCallback);
}

async function setupWebCamPreview() {
  try {
    webCamWrapper = document.createElement('div');
    document.body.appendChild(webCamWrapper);
    webCamWrapper.id = "canvas-wrapper";
    let webCamStream = document.createElement('video');
    webCamStream.id = "webCam";
    webCamStream.width = "1";
    webCamStream.height = "1";
    let p5Container = document.createElement('div');
    p5Container.id = "output";
    webCamWrapper.appendChild(p5Container);
    webCamWrapper.appendChild(webCamStream);
    camera = await Camera.setup(webCamStream);
    poseDetection = await setupMoveNet(webCamStream);
    p5Container.width = camera.video.width;
    p5Container.height = camera.video.height;
    new P5(webCamSketch, p5Container);
    dragElement(document.getElementById(webCamWrapper.id));
  } catch (e) {
    console.log(e);
  }
}
function showWebCamPreview(enabled) {
  if (webCamWrapper !== undefined) {
    let element = document.getElementById(webCamWrapper.id)
    if (element !== null) {
      if (enabled && Settings.poseDetection == true) {
        element.style.visibility = "visible";
      } else {
        element.style.visibility = "hidden";
      }
      // Do something with the element
    }
    //
  }
}

async function disableWebCamPreview() {
  stopMoveNet()
  try {
    const element = document.getElementById(webCamWrapper.id);
    element.remove(); // Removes the div with the 'div-02' id
  } catch (e) {
    console.log(e)
  }
}

function datGuiCallback() {

  console.log(Settings.poseDetection);
  if (!Settings.poseDetection) {
    disableWebCamPreview();
  } else {
    setupWebCamPreview();
  }
}



function resized() {
  cameraSave(); // work around for play.js
  mainP5Sketch.resizeCanvas(getWindowWidth(), getWindowHeight());
  cameraRestore(); // work around for play.js
  correctAspectRatio();
  try {
    mainP5Sketch.windowScaled();
  } catch (e) {
  }
}

function cameraSave() {
  try {
    percentX = mainP5Sketch.camera.position.x / width;
    percentY = mainP5Sketch.camera.position.y / height;
  } catch (e) {
  }
}

function cameraRestore() {
  try {
    mainP5Sketch.camera.position.x = percentX * width;
    mainP5Sketch.camera.position.y = percentY * height;
  } catch (e) {
  }
}

function incrementCounter() {
    if (currentNumber > 0) {
      currentNumber--;
    } else {
      currentNumber = 9;
    }
}
function deincrementCounter() {
    if (currentNumber < 9) {
      currentNumber++;
    } else {
      currentNumber = 0;
    }
}

export function getCounter() {
  return currentNumber;
}


export function posterTasks() {
  if (poses != undefined && Settings.poseDetection == true) {
    handlePosenet();
  } else if (window.performance.now() - lastOSC < 2000 && realsensePos != undefined) {
    oscSignal = true;
    // realsense data available over osc
    updatePosition(realsensePos.x, realsensePos.y, realsensePos.z)
    tracking = OSCtracking;
    if (enableDepth) {
      depthData = OSCdepthData;
      depthW = OSCdepthW; // width of data array
      depthH = OSCdepthH; // width of height array
    }

  } else {
    oscSignal = false;
    // or just use mouse
    let mouseX = mainP5Sketch.mouseX / mainP5Sketch.width;
    mouseX = mainP5Sketch.constrain(mouseX, 0, 1)
    let mouseY = mainP5Sketch.mouseY / mainP5Sketch.height;
    mouseY = mainP5Sketch.constrain(mouseY, 0, 1)
    updatePosition(mouseX, mouseY, 1.0)
  }
  // light animation when tracking is false
  if (animationLoopEnabled && tracking != true && oscSignal == true) {
    let oscolation = 0.08 * sin(mainP5Sketch.frameCount / (mainP5Sketch.PI * 50));
    updatePosition(.5 + oscolation, .5, 1.0)
  }
  // show helplines when outside of fullscreen mode

  if (!fullscreenMode && debug) {
    cursor()
    gui.show();
    showWebCamPreview(true);
    mainP5Sketch.push();
    if (mainP5Sketch._renderer.drawingContext instanceof WebGL2RenderingContext) {
      mainP5Sketch.translate(-mainP5Sketch.width / 2, -mainP5Sketch.height / 2, 0);
    }
    mainP5Sketch.fill(0, 180, 180);
    mainP5Sketch.noStroke();
    fpsAverage = fpsAverage * 0.9;
    fpsAverage += mainP5Sketch.frameRate() * 0.1;
    mainP5Sketch.textSize(2.2 * vw);
    mainP5Sketch.textAlign(mainP5Sketch.LEFT, mainP5Sketch.TOP);
    mainP5Sketch.text("fps: " + Math.floor(fpsAverage), screens[0].x + vw, screens[0].y + vh * 1);
    mainP5Sketch.text("Streaming: " + oscSignal, screens[0].x + vw, screens[0].y + vh * 3);
    mainP5Sketch.text("Tracking: " + tracking, screens[0].x + vw, screens[0].y + vh * 5);
    mainP5Sketch.text("Shift - r start record", screens[0].x + vw, screens[0].y + vh * 7);
    mainP5Sketch.text("Shift - s stop record ", screens[0].x + vw, screens[0].y + vh * 8);
    mainP5Sketch.text("Shift - p stop preview", screens[0].x + vw, screens[0].y + vh * 9);
    mainP5Sketch.noFill();
    mainP5Sketch.stroke(0, 180, 180);
    mainP5Sketch.rectMode(CORNER);
    mainP5Sketch.rect(screens[0].x, screens[0].y, mainP5Sketch.width, mainP5Sketch.height);
    // line between screens
    for (let i = 1; i < screens.length; i++) {
      screens[i].w = mainP5Sketch.floor(width / screens.length);
      mainP5Sketch.line(screens[i].x, screens[i].y, screens[i].x, screens[i].y + screens[i].h); // line between multiple screens
    }
    // Format lines for 2024, show squate in the center. 

    let line1y = (mainP5Sketch.height - mainP5Sketch.width) / 2;
    let line2y = line1y + mainP5Sketch.width;
    mainP5Sketch.line(screens[0].x, line1y, screens[0].x + screens[0].w, line1y); // top    
    mainP5Sketch.line(screens[0].x, line2y, screens[0].x + screens[0].w, line2y); // top    
    //
    mainP5Sketch.fill(0, 180, 180);
    mainP5Sketch.noStroke();
    mainP5Sketch.circle(position.x, position.y, position.z * 10);
    mainP5Sketch.pop();
  } else {
    noCursor();
    gui.hide();
    showWebCamPreview(false);
  }
  if (exhibitionMode) {
    gui.hide();
    showWebCamPreview(false);
  }
  // show light animation when no one is infront of the camera


}

function handlePosenet() {
  // Get center point from all posses 
  let averageCenterPoint = { x: 0, y: 0 };
  for (const pose of poses) {
    // let nosePosition = pose.keypoints[0]; // based off nose position 
    let boxCenterX = pose.box.xMin + (pose.box.width / 2);
    let boxCenterY = pose.box.yMin + (pose.box.height / 2);
    averageCenterPoint.x += boxCenterX;
    averageCenterPoint.y += boxCenterY;
  }
  averageCenterPoint.x = averageCenterPoint.x / poses.length;
  averageCenterPoint.y = averageCenterPoint.y / poses.length;
  if (!isNaN(averageCenterPoint.x) && !isNaN(averageCenterPoint.y)) {
    updatePosition(1 - averageCenterPoint.x, averageCenterPoint.y, 1.0)
  } else {
    updatePosition(0.5, 0.5, 1.0)
  }
}


function correctAspectRatio() {
  let offsetX = 0;
  let offsetY = 0;
  if (_renderer.drawingContext instanceof WebGLRenderingContext) {
    offsetX = - Math.floor(width / 2)
    offsetY = - Math.floor(height / 2)
  }
  for (let i = 0; i < screens.length; i++) {
    screens[i].w = floor(width / screens.length);
    screens[i].h = height;
    screens[i].x = screens[i].w * i;
    screens[i].y = 0;
    screens[i].cntX = screens[i].x + screens[i].w / 2;
    screens[i].cntY = screens[i].h / 2;
  }
  vw = width * 0.01; // 1 percent of viewport width;
  vh = height * 0.01;// 1 percent of viewport height;  
}

function updatePosition(x, y, z) {
  // position data and smoothing
  let factor = 0.95;
  posNormal.mult(factor)
  posNormal.x += x * (1 - factor);
  posNormal.y += y * (1 - factor);
  posNormal.z += z * (1 - factor);
  position.set(posNormal);
  position.x = position.x * width;
  position.y = position.y * height;
}

export function getWindowWidth() {
  let posterWidth;
  let displayWidth = window.innerWidth;
  let displayHeight = window.innerHeight;
  //const body = document.getElementsByTagName('body'); // 
  let body = select('body');

  if (body.style('transform') == 'matrix(0, 1, -1, 0, 0, 0)' || body.style('transform') == 'matrix(0, -1, 1, 0, 0, 0)') {
    // workaround for rotated display
    displayWidth = window.innerHeight;
    displayHeight = window.innerWidth;
  }

  let aspectRatioWH = pageWidth / pageHeight; // width to height
  let aspectRatioHW = pageHeight / pageWidth; // height to width

  let currentRatio = displayWidth / displayHeight;

  if (displayWidth < displayHeight * aspectRatioWH) {
    // for portrait mode
    posterWidth = displayWidth;
  } else {
    // for landscape mode
    posterWidth = Math.floor(displayHeight * aspectRatioWH);
  }
  return posterWidth;
}

export function getWindowHeight() {
  let posterHeight;
  let displayWidth = window.innerWidth;
  let displayHeight = window.innerHeight;
  let body = select('body');
  if (body.style('transform') == 'matrix(0, 1, -1, 0, 0, 0)' || body.style('transform') == 'matrix(0, -1, 1, 0, 0, 0)') {
    // workaround for rotated display
    displayWidth = window.innerHeight;
    displayHeight = window.innerWidth;
  }
  let aspectRatioWH = pageWidth / pageHeight; // width to height
  let aspectRatioHW = pageHeight / pageWidth; // height to width
  if (displayWidth < displayHeight * aspectRatioWH) {
    // for portrait mode
    posterHeight = Math.floor(displayWidth * aspectRatioHW);
  } else {
    // for landscape mode
    posterHeight = displayHeight;
  }
  console.log(displayHeight);
  console.log(displayWidth);

  if (displayHeight == screen.height || displayWidth == screen.height || displayWidth == screen.width || displayHeight == screen.width) {
    fullscreenMode = true;
  } else {
    fullscreenMode = false;
  }

  return posterHeight;
}

function openFullscreen() {
  let elem = document.documentElement
  if (elem.requestFullscreen) {
    elem.requestFullscreen()
  } else if (elem.mozRequestFullScreen) { /* Firefox */
    elem.mozRequestFullScreen()
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
    elem.webkitRequestFullscreen()
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
    elem.msRequestFullscreen()
  }
  /*
  if (window.innerHeight == screen.height) {
    fullscreenMode = true;
  } else {
    fullscreenMode = false;
  }
  */
}

// video


// Listen for messages from the parent window, used for exhibition setup
window.addEventListener('message', function (event) {
  // Ensure the message is coming from a trusted source
  /*
  if (event.origin !== 'http://your-parent-origin.com') {
    return;
  }
  */
  // Handle the received message
  console.log('Received data:', event.data);
  var message = event.data;
  if (message.type === 'exhibitionMode') {
    console.log('Received properties:', message.data);
    exhibitionMode = message.data.value;
    console.log('Exhibition mode:', exhibitionMode);
    // Access properties like message.data.property1, message.data.property2, etc.
  }
  if (message.type === 'countUp') {
    // pass incoming value as integer
    if(!manualCounter)  {
      clearInterval(incrementCounterInterval);
      incrementCounter();
    }
  }
  if (message.type === 'countDown') {
    // pass incoming value as integer
    if(!manualCounter)  {
      clearInterval(incrementCounterInterval);
      deincrementCounter();
    }
  }
});