// Canvas variables
let w = 800, h = 600;
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

// Settings
var isRunning = true;   // indicates whether animation is running
var showSeeds = false;  // indicates whether to draw the seeds

// Time of previous animation frame
let previousTime;

// Velocity field
let field = [];

// Velocity field seeds, used to generate a random field
let seeds = [];
let seedRadius = 300; // radius of influence

// Particles
var particles = [];
var numParticles = 1000;
let maxParticleAge = 100;


// ----------------
// Helper functions
// ----------------
function distanceBetweenPts(x0, y0, x1, y1) {
    let dx = x0 - x1;
    let dy = y0 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// function getSpeed(v0, v1) {
//     return Math.sqrt(v0 * v0 - v1 * v1);
// }

function getRandomPoint(w, h) {
    return {
        x: Math.floor(Math.random() * w),
        y: Math.floor(Math.random() * h)
    }
}

function drawPoint(x, y, size) {
    ctx.fillRect(x - 0.5 * size, y - 0.5 * size, size, size);
}


// --------------
// Event handlers
// --------------
function toggleIsRunning() {
    if(isRunning) {
        isRunning = false;
    }
    else {
        isRunning = true;
        previousTime = document.timeline.currentTime;
        window.requestAnimationFrame(step);
    }
}

function toggleShowSeeds() {
  showSeeds = !showSeeds;
}


// ---------------
// Field functions
// ---------------
function initSeeds() {
    let speed = 70;
    seeds = [];
    for(let i=0; i<10; i++) {
        seeds.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (10 + Math.random() * speed) * (Math.random() < 0.5 ? -1 : 1),
            vy: (10 + Math.random() * speed) * (Math.random() < 0.5 ? -1 : 1)
        })
    }
}

function updateField() {
    // Computes the velocity (vx, vy) for each and every pixel across the canvas
    field = [];

    for(let x = 0; x < w; x++) {
        field.push([]);

        for(let y = 0; y < h; y++) {
            field[x].push([0, 0]);

            // Loop through seeds and sum the velocities
            for(let i = 0; i < seeds.length; i++) {
                let seed = seeds[i];

                // Compute distance from seed to [x,y]
                let dis = distanceBetweenPts(seed.x, seed.y, x, y);

                // Skip this seed if point is outside seed's radius of influence
                if(dis > seedRadius) continue;

                // seed.vx and seed.vy are pixels per second
                field[x][y][0] += seed.vx * (1 - dis/seedRadius);
                field[x][y][1] += seed.vy * (1 - dis/seedRadius);
            }
        }
    }
}


// ------------------
// Particle functions
// ------------------
function initParticles() {
    for(var i=0; i<numParticles; i++) {
        var pt = getRandomPoint(w, h);
        particles.push({
            prevX: pt.x,
            prevY: pt.y,
            x: pt.x,
            y: pt.y,
            age: Math.floor(Math.random() * maxParticleAge)
        });  
    }
}

function updateParticles(timeDelta) {
    // For each particle, get its velocity from the field array and compute the new position
    // Reset the particle to a random position if it stops moving or goes off canvas
    for(let i=0; i<numParticles; i++) {
        let p = particles[i];

        p.age += 1;
        p.prevX = p.x;
        p.prevY = p.y;

        let x = Math.floor(p.x);
        let y = Math.floor(p.y);
        let v = field[x][y];

        p.x = p.x + timeDelta * v[0];
        p.y = p.y + timeDelta * v[1];

        // let isOld = false;
        let isOld = p.age > maxParticleAge;
        let isOutOfBounds = p.x < 0 || p.x >= w || p.y < 0 || p.y >= h;
        if(isOld || isOutOfBounds) {
            let pt = getRandomPoint(w, h);
            p.x = p.prevX = pt.x;
            p.y = p.prevY = pt.y;
            p.age = 0;
        }
    }
}


// ---------
// Rendering
// ---------
function drawSeeds() {
    for(let i=0; i<seeds.length; i++) {
        ctx.fillStyle = "red";
        let s = seeds[i];
        drawPoint(s.x, s.y, 6);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.vx, s.y + s.vy);
        ctx.stroke();
    }
}

function fadeCanvas() {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
}

function drawParticles() {
    fadeCanvas();

    ctx.strokeStyle = '#333';
    for(var i=0; i<numParticles; i++) {
        var p = particles[i];

        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    }
}


// ---------
// Animation
// ---------
function step(currentTime) {
    if(!previousTime) {
        previousTime = currentTime;
    }

    var timeDelta = currentTime - previousTime;
    timeDelta = timeDelta / 1000; // convert from milliseconds to seconds
    
    if(isRunning) {
        if(showSeeds) {
          drawSeeds();
        }
        updateParticles(timeDelta);
        drawParticles();
        window.requestAnimationFrame(step);
        previousTime = currentTime;
    }

}

function go() {
    initSeeds();
    updateField();
    initParticles();
    window.requestAnimationFrame(step);
}
  
go();
