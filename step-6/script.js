// Canvas variables
let w = 1200, h = 800;
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

// Settings
let isRunning = true;   // indicates whether animation is running
let showSeeds = false;  // indicates whether to draw the seeds

// Time of previous animation frame
let previousTime;

// Velocity field
let field = [];

// Velocity field seeds, used to generate a random field
let seeds = [];
let seedRadius = 300; // radius of influence

// Particles
let particles = [];
let numParticles = 1500;
let maxParticleAge = 150;


// ----------------
// Helper functions
// ----------------
function distanceBetweenPts(x0, y0, x1, y1) {
    let dx = x0 - x1;
    let dy = y0 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function getRandomPoint(w, h) {
    return {
        x: Math.floor(Math.random() * w),
        y: Math.floor(Math.random() * h)
    }
}

function drawPoint(x, y, size) {
    ctx.fillRect(x - 0.5 * size, y - 0.5 * size, size, size);
}


// ---------------
// Field functions
// ---------------
function initSeeds() {
    let speed = 70;
    seeds = [];
    for(let i=0; i<20; i++) {
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
        field[x] = [];

        for(let y = 0; y < h; y++) {
            field[x][y] = {x: 0, y: 0};

            // Loop through seeds and sum the velocities
            for(let i = 0; i < seeds.length; i++) {
                let seed = seeds[i];

                // Compute distance from seed to [x,y]
                let dis = distanceBetweenPts(seed.x, seed.y, x, y);

                if(dis > seedRadius) continue; // Skip if [x, y] is outside seed's radius of influence

                field[x][y].x += seed.vx * (1 - dis/seedRadius);
                field[x][y].y += seed.vy * (1 - dis/seedRadius);
            }
        }
    }
}


// ------------------
// Particle functions
// ------------------
function initParticles() {
    for(let i=0; i<numParticles; i++) {
        let pt = getRandomPoint(w, h);
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

        p.x = p.x + timeDelta * v.x;
        p.y = p.y + timeDelta * v.y;

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
function fadeCanvas() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
    // ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'; // Dark theme
    ctx.fillRect(0, 0, w, h);
}

function drawParticles() {
    fadeCanvas();

    ctx.strokeStyle = '#333';
    // ctx.strokeStyle = '#fff'; // Dark theme
    ctx.lineWidth = 1;
    for(let i=0; i<numParticles; i++) {
        let p = particles[i];

        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    }
}


// ---------
// Animation
// ---------
function step(t) {
    if(!previousTime) previousTime = t;

    let timeDelta = t - previousTime;
    timeDelta = timeDelta / 1000; // convert from milliseconds to seconds
    
    updateParticles(timeDelta);
    drawParticles();
    window.requestAnimationFrame(step);
    previousTime = t;
}

function go() {
    initSeeds();
    updateField();
    initParticles();
    window.requestAnimationFrame(step);
}
  
go();
