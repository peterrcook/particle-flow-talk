/*
Particle Flow simulates the flow of particles through a velocity field. A velocity field is defined by an array of seeds where each seed has a position (x,y) and velocity (vx, vy). In this example there's just 4 seeds.

We create an array of particles (typically a few hundred) each of which has x and y co-ordinates. On each animation frame we compute a particle's velocity based on the seeds. Each particle's position is then updated according to its velocity.

Particle Flow uses similar (or possibly the same) technique as Fernanda Viegas & Martin Wattenberg's wind map (http://hint.fm/wind/) and other similar works such as https://earth.nullschool.net/. My aim was to create a simple as possible example of the underlying modelling and animation technique. Rather than using wind data to drive the particles, this example uses generic points and velocities, so could potentially visualise any flow-type data.

HOW IT WORKS

Suppose we have a seed array containing a single seed:

[
  {
    x: 100,
    y: 100,
    vx: 20,
    vy: 30
  }
]

If we have a particle at {x: 100, y: 100} it'll adopt a velocity of {vx: 20, vy: 30}.

The velocities are measured in pixels/sec so if 0.1 seconds have passed since the last animation frame, the particle will move by {x: 0.1 * 20, y: 0.1 * 30} and end up at {x: 102, y: 103}.

If there are multiple seeds, we sum the velocities.

The further a particle is from a seed, the less influence that seed has. We express this using a function that accepts distance from the seed centre as an argument e.g.

var seedRadius = 500;

function strengthFunction(distance) {
  var s = 1 - distance / seedRadius;
  return s;
}

strengthFunction(0) returns 1
strengthFunction(500) returns 0

seedRadius is the radius within which the seed has influence. Outside of this radius, the seed has no influence on a particle.

If a particle stops moving or moves off canvas, we reset it to a random position on the canvas.

The animation loop looks like:

- compute time delatT since the last animation frame
- compute a new position for each particle
- draw the particles

Each time the particles are drawn, the canvas is cleared with a semi-transparent rectangle. This is how the trails are drawn!

For performance we precompute a pixel-level grid of velocities based on the seeds. This is represented by the field variable (a 2 dimensional array) and is populated by updateField().

The first index of field maps to x and the second to y. For example field[50][100] refers to {x: 50, y: 100}.

The value of field is a 2 element array [vx, vy]. For the seed array example above, field[100][100] will return a velocity of [20,30]
*/

/* Interested in data visualisation? Check out my course Visualising Data with JavaScript
https://www.createwithdata.com/visualising-data-with-javascript/
*/

// Canvas variables
var w = 800, h = 600;
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

// Settings
var isRunning = true;   // indicates whether animation is running
var showSeeds = false;  // indicates whether to draw the seeds
var speedFactor = 1;    // used to multiply the time delta (in effect this can be used to make the particles go slower/faster)

// Animation variables
var prevT;              // used in the animation loop to compute change in time

// Field variables
var field = [];         // this is a 2d array (with w columns and h rows) that represents the velocity field pixel by pixel e.g. field[100][20] is the velocity at x=100, y=20. The velocity is a 2 element array e.g. field[100][20] might return [10,5] which means the velocity is 10 in the x direction and 5 in the y direction. field is computed (see updateField) before the animation starts and the intention is that it reduces expensive computation during animation.

// Particles
var particles = [];   // Each particle is an object consisting of {prevX, prevY, x, y} where x,y is the particle's position and prevX, prevY is the particle's previous position. On each animation step, for each particle we draw a line from [prevX, prevY] to [x, y].
var numParticles = 5000;

// Seed variables
// The seeds are an array of positions and velocities that define the velocity field through which
// the particles travel. Typically there'd be just a handful of seeds: between 3 and 10 is a good number to have.
// Velocities are specified in pixels per second.

var seedRadius = 500;     // This defines the radius within which the seed has effect on particles. Particles outside of a seed's radius are not influenced by that seed.

// The strength function defines how strongly the seed influences a particle. The closer the seed is to the seed centre, the stronger the influence. As a particle's distance from the seed centre approaches seedRadius, the influence will tend to zero.
var strengthFunction = function(dis) {
    var s = 1 - dis / seedRadius;

    // Return the square of the strength - this gives means the strength fades away more quickly but still reaches zero at the same distance
    return s * s;
}

// Seed array
var seeds = [
    {
        x: 0.15 * w,
        y: 0.25 * h,
        vx: 70, // velocities in pixels / sec
        vy: 20,
        r: seedRadius,
        strength: strengthFunction
    },
    {
        x: 0.75 * w,
        y: 0.5 * h,
        vx: 50,
        vy: -100,
        r: seedRadius,
        strength: strengthFunction
    },
    {
        x: 0.5 * w,
        y: 0.75 * h,
        vx: -100,
        vy: 50,
        r: seedRadius,
        strength: strengthFunction
    },
    {
        x: 0.25 * w,
        y: 0.5 * h,
        vx: 0,
        vy: -30,
        r: seedRadius,
        strength: strengthFunction
    },
];


// ----------------
// Helper functions
// ----------------
function distanceBetweenPts(x0, y0, x1, y1) {
    var dx = x0 - x1;
    var dy = y0 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function getRandomPoint(w, h) {
    return {
        x: Math.floor(Math.random() * w),
        y: Math.floor(Math.random() * h)
    }
}


// --------------
// Event handlers
// --------------
function toggleIsRunning() {
  isRunning = !isRunning;
}

function toggleShowSeeds() {
  showSeeds = !showSeeds;
}


// ---------------
// Field functions
// ---------------
function updateField() {
    // Computes the velocity (vx, vy) for each and every pixel across the canvas

    // Clear field
    field = [];

    var numSeeds = seeds.length;

    for(var x = 0; x < w; x++) {
        field.push([]);

        for(var y = 0; y < h; y++) {
            field[x].push([0, 0]);  // pushed array is [vx, vy]

            // Loop through seeds and sum the velocities
            for(var i = 0; i < numSeeds; i++) {
                var seed = seeds[i];

                // Compute distance from seed to [x,y]
                var dis = distanceBetweenPts(seed.x, seed.y, x, y);

                // Skip this seed if point is outside seed's radius of influence
                if(dis > seed.r) {
                    continue;
                }

                // seed.vx and seed.vy are pixels per second. Divide by 1000 so that field unit is pixels per millisecond.
                field[x][y][0] += seed.strength(dis) * seed.vx / 1000;
                field[x][y][1] += seed.strength(dis) * seed.vy / 1000;
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
            y: pt.y
        });  
    }
}

function updateParticles(dt) {
    // For each particle, get its velocity from the field array and compute the new position
    // Reset the particle to a random position if it stops moving or goes off canvas
    for(var i=0; i<numParticles; i++) {
        var p = particles[i];

        p.prevX = p.x;
        p.prevY = p.y;

        var f = field[Math.floor(p.x)][Math.floor(p.y)];
        p.x = p.x + dt * f[0];
        p.y = p.y + dt * f[1];

        var isZeroVelocity = f[0] === 0 && f[1] === 0;
        var isOutOfBounds = p.x < 0 || p.x >= w || p.y < 0 || p.y >= h;
        if(isZeroVelocity || isOutOfBounds) {
            var pt = getRandomPoint(w, h);
            p.x = p.prevX = pt.x;
            p.y = p.prevY = pt.y;
        }
    }
}


// ---------
// Rendering
// ---------
function drawSeeds() {
    for(var i=0; i<seeds.length; i++) {
        ctx.fillStyle = "red";
        var s = seeds[i];
        ctx.fillRect(s.x - 3, s.y - 3, 6, 6);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.vx, s.y + s.vy);
        ctx.stroke();
    }
}

function drawParticles() {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.fillStyle = '#57e';
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
function doAnimFrame(t) {
    if(!prevT) {
        prevT = t;
    }

    var deltaT = t - prevT;
    deltaT *= speedFactor;

    if(isRunning) {
      if(showSeeds) {
        drawSeeds();
      }
      updateParticles(deltaT);
      drawParticles();
    }

    window.requestAnimationFrame(doAnimFrame);

    prevT = t;
}

function go() {
  updateField();
  initParticles();
  window.requestAnimationFrame(doAnimFrame);
}

go();