// Canvas variables
let w = 800, h = 600;
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

// Time of previous animation frame
let previousTime;

// Velocity field
let field = [];

// Velocity field seeds, used to generate a random field
let seeds = [];
let seedRadius = 300; // radius of influence

// Particle
let particle;
let maxParticleAge = 100;

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
    let speed = 500;
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
function initParticle() {
    var pt = getRandomPoint(w, h);
    particle = {
        prevX: pt.x,
        prevY: pt.y,
        x: pt.x,
        y: pt.y,
        age: 0
    };
}

function updateParticle(timeDelta) {
    let x = Math.floor(particle.x);
    let y = Math.floor(particle.y);
    let velocity = field[x][y];
    
    particle.age += 1;

    particle.prevX = particle.x;
    particle.prevY = particle.y;

    particle.x = particle.x + timeDelta * velocity.x;
    particle.y = particle.y + timeDelta * velocity.y;

    var isOutOfBounds = particle.x < 0 || particle.x >= w || particle.y < 0 || particle.y >= h;
    
    if(isOutOfBounds) initParticle();
}

// ---------
// Rendering
// ---------
function fadeCanvas() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, 0, w, h);
}

function drawParticle() {
    fadeCanvas();

    ctx.fillStyle = '#57e';
    drawPoint(particle.x, particle.y, 3)

    // ctx.strokeStyle = '#57e';
    // ctx.lineWidth = 4;
    // ctx.beginPath();
    // ctx.moveTo(particle.prevX, particle.prevY);
    // ctx.lineTo(particle.x, particle.y);
    // ctx.stroke();
} 


// ---------
// Animation
// ---------
function step(t) {
    if(!previousTime) previousTime = t;

    let timeDelta = t - previousTime;
    timeDelta = timeDelta / 1000; // convert from milliseconds to seconds
    
    updateParticle(timeDelta);    
    drawParticle();

    window.requestAnimationFrame(step);

    previousTime = t;
}

function go() {
    initSeeds();
    updateField();
    initParticle();
    window.requestAnimationFrame(step);
}
  
go();
