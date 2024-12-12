//createCanvas(poster.getWindowWidth(), poster.getWindowHeight()); // Don't remove this line. 
// poster.setup(this, "/Poster_Templates/libraries/assets/models/movenet/model.json");  // Don't remove this line. 

//poster.posterTasks(); // do not remove this last line!  

let blobs = [];
let backgroundBlobs = [];
let blobCount = 600;
let radius = 12;
let stiffness = 0.03;
let damping = 0.9;
let mouseForce = 0.01;
let numbers = [];
let currentNumber = 9;
let nextNumber = 9;
let morphProgress = 0;
let lastNumber = 3;
let countdownTimer;
let font;


function preload() {
  font = loadFont('barlow_condensed.otf'); // Load any font
}
let bounds;

function setup() {
  createCanvas(poster.getWindowWidth(), poster.getWindowHeight()); // Don't remove this line. 
  poster.setup(this, "/Poster_Templates/libraries/assets/models/movenet/model.json", false, true);  // Don't remove this line. 
  textSize(height * 0.9);
  textAlign(CENTER, CENTER);


  setupAllBLobs()
  
  countdownTimer = millis();
}

function setupAllBLobs() {
   blobs = [];
   backgroundBlobs = [];
   numbers = [];
  // Generate blob patterns for numbers 9 to 0
  for (let i = 9; i >= 0; i--) {
    numbers[i] = createBlobPattern(i.toString(), width / 2, height / 2);
  }

  // Initialize blobs for the first number
  initializeBlobs(numbers[currentNumber]);

    // Generate random background blobs
  for (let i = 0; i < blobCount; i++) {
    let randomX = random(width);
    let randomY = random(height);
    let randomRadius = random(10, 30);

    /*

    for (let i = 0; i < blobs.length; i++) {
      let distance = dist(randomX, randomY, blobs[i].current.x, blobs[i].current.y);
      if (distance < randomRadius + blobs[i].radius) {
        randomX = random(width);
        randomY = random(height);
      }
    }
      */
    backgroundBlobs.push(new Blob(randomX, randomY, random(10,30), color(random(220,250)) ));


  }
  

}

function draw() {
  background(255);
  //stroke(0);
  // Draw background blobs
  
  for (let blob of backgroundBlobs) {
    blob.update();
    blob.display();
  }

/*
 if (lastNumber != poster.getCounter() ) {
    morphProgress = 0;
 }

if (morphProgress>=1){
  lastNumber = poster.getCounter()
}
 
console.log("lastNumber"+lastNumber)
console.log("poster.getCounter()"+poster.getCounter())
console.log(morphProgress)
morphBlobs(numbers[lastNumber], numbers[poster.getCounter()]);
*/
  //currentNumber = poster.getCounter();


  // Countdown logic
  
  if (millis() - countdownTimer > 2000) {
    countdownTimer = millis();
    currentNumber = nextNumber;
    nextNumber = (nextNumber - 1 + 10) % 10;
    morphProgress = 0;
  }

  morphBlobs(numbers[currentNumber], numbers[nextNumber]);
  

  // Display and update blobs
  
  for (let blob of blobs) {
    blob.update();
    blob.display();
  }
    

// get the largest of two array lengths (backgroundBlobs.length or blobs.length;)

/*
const largestLength = Math.max(backgroundBlobs.length, blobs.length);

  for(let i = largestLength; i >0; i--) {

    if(backgroundBlobs[i]) {
      backgroundBlobs[i].update();
      backgroundBlobs[i].display();
    }
    if(blobs[i]) {
      blobs[i].update();
      blobs[i].display();
    }
  }
*/
  //bounds.y = height / 2 - bounds.h / 2;
  //rect(bounds.x, bounds.y, bounds.w, bounds.h);
  poster.posterTasks(); // do not remove this last line!  
}

function createBlobPattern(txt, x, y) {
  textSize(height*0.9); //change font size
  bounds = font.textBounds(txt, x, y);
  
  // Start with a base sampleFactor
  let baseSampleFactor = 0.1;
  
  // Custom sample factors for specific numbers
  let sampleFactors = {
    '0': 0.1,
    '1': 0.19,
    '2': 0.13,
    '3': 0.1,
    '4': 0.12,
    '5': 0.1,
    '6': 0.09,
    '7': 0.16,
    '8': 0.1,
    '9': 0.13
  };

  // Use custom sample factor if defined, otherwise use base
  let sampleFactor = sampleFactors[txt] || baseSampleFactor;

  let pts = font.textToPoints(txt, (width/1.5)-(bounds.w/4), (height/5)+(bounds.h/4), height*0.9, {
    sampleFactor: sampleFactor,
    simplifyThreshold: 0.0,
  });

  // Optional: Limit total number of points if needed
  const MAX_POINTS = 900;
  if (pts.length > MAX_POINTS) {
    // Randomly sample points if we have too many
    pts = pts.sort(() => 0.5 - Math.random()).slice(0, MAX_POINTS);
  }
 
if (txt == "9") {
  for (let i=0;i<50;i++) {
   pts.push({x:random(width),y:random(height)})
  }
}

  return pts.map((pt) => createVector(pt.x, pt.y));
}

function initializeBlobs(points) {
  blobs = [];
  for (let pt of points) {
    blobs.push(new Blob(pt.x, pt.y,random(10, 20), color(random(20,70))));
  }

}

function morphBlobs(current, next) {
  morphProgress = constrain(morphProgress + 0.2, 0, 1);

  if (current.length !== next.length) {
    let maxLength = max(current.length, next.length);
    for (let i = current.length; i < maxLength; i++) current.push(createVector(random(width), random(height)));
    for (let i = next.length; i < maxLength; i++) next.push(createVector(random(width), random(height)));
  }

  for (let i = 0; i < blobs.length; i++) {
    let target = next[i] || createVector(random(width), random(height));
    blobs[i].morphTo(
      lerp(current[i].x, target.x, morphProgress),
      lerp(current[i].y, target.y, morphProgress)
    );
  }
}

class Blob {
  constructor(x, y, radius, myColor) {
    this.current = createVector(x, y);
    this.original = createVector(x, y);
    this.radius = radius; //random(10, 18);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.color = myColor; //color(random(200), 200);
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  morphTo(x, y) {
    this.original.set(x, y);
  }

  update() {
    
    let springForce = this.original.copy().sub(this.current).mult(stiffness);

    //let springForce = p5.Vector.sub(this.original, this.current).mult(stiffness);
    this.applyForce(springForce);
    
    let mouseVec = createVector( poster.position.x,  poster.position.y);
    let distance = dist( poster.position.x,  poster.position.y, this.current.x, this.current.y);
    if (distance < height/2 && poster.position.x >= 10*poster.vw && poster.position.x <= 90*poster.vw &&  poster.position.y >= 10*poster.vh && poster.position.y <= 90*poster.vh ) {
      let force = mouseForce * (height/2 - distance)
      let repulsion = this.current.copy().sub(mouseVec).setMag(force);
      //let repulsion = p5.Vector.sub(this.current, mouseVec).setMag(force);
      this.applyForce(repulsion);
    }

    this.velocity.add(this.acceleration);
    this.velocity.mult(damping);
    this.current.add(this.velocity);

    this.acceleration.mult(0);
  }
  

  display() {
    fill(this.color);
    noStroke();
    ellipse(this.current.x, this.current.y, this.radius * 2, this.radius * 2);
  }
}


function windowScaled() { // this is a custom event called whenever the poster is scaled
  // textSize(10 * poster.vw);
 setupAllBLobs()
 }
 
/*
class BackgroundBlob {
  constructor(x, y, radius) {
    this.current = createVector(x, y);
    this.original = createVector(x, y);
    this.radius = 30;
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.color = color(random(200,250)); // Semi-transparent blue
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update() {
    // Add spring force to return to original position
    let springForce = p5.Vector.sub(this.original, this.current).mult(stiffness);
    this.applyForce(springForce);

    // Add repulsion force if mouse is close
    let mouseVec = createVector(mouseX, mouseY);
    let distance = dist(mouseX, mouseY, this.current.x, this.current.y);
    if (distance < 100) {
      let repulsion = p5.Vector.sub(this.current, mouseVec).setMag(mouseForce * (100 - distance));
      this.applyForce(repulsion);
    }

    // Update velocity and position
    this.velocity.add(this.acceleration);
    this.velocity.mult(damping);
    this.current.add(this.velocity);

    // Reset acceleration
    this.acceleration.mult(0);
  }

  display() {
    fill(this.color);
    //stroke(0); // Black stroke
    strokeWeight(2); // Thickness of the stroke
    ellipse(this.current.x, this.current.y, this.radius * 2, this.radius * 2);
  }
}
*/