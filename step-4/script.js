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
let seedRadius = 300; // seed radius of influence

// Particle
let particle = getRandomPoint(w, h);
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

function drawField() {
    ctx.fillStyle = '#000';
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';

    let step = 14;
    for(let x=0.5 * step; x<w; x+=step) {
        for(let y=0.5 * step; y<h; y+=step) {
            let v = field[x][y];

            // Compute and draw a line that represents the velocity
            let scale = 0.5;
            let p0 = {x: x, y: y};
            let p1 = {x: x + scale * v.x, y: y + scale * v.y};

            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
        }
    }
}

function drawParticle() {
    ctx.fillStyle = '#57e';
    drawPoint(particle.x, particle.y, 4);
} 


// ---------
// Animation
// ---------
function step(t) {
    if(!previousTime) previousTime = t;

    let timeDelta = t - previousTime;
    timeDelta = timeDelta / 1000; // convert from milliseconds to seconds
    
    let x = Math.floor(particle.x);
    let y = Math.floor(particle.y);
    let velocity = field[x][y];
    
    particle.x = particle.x + timeDelta * velocity.x;
    particle.y = particle.y + timeDelta * velocity.y;
    
    var isOutOfBounds = particle.x < 0 || particle.x >= w || particle.y < 0 || particle.y >= h;
    
    if(isOutOfBounds) particle = getRandomPoint(w, h);
    
    drawParticle();

    window.requestAnimationFrame(step);

    previousTime = t;
}

initSeeds();
updateField();
drawField();
drawSeeds();
window.requestAnimationFrame(step);
