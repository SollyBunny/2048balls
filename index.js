// Matter.use('matter-collision-events')

const aspect = 1.5;
const scaleFactor = Math.sqrt(2) / 1.1;
const deadPoint = -55;
const initialBallSize = 5;
let jiggleForce = 0.0005;
let scale = 1;
let actualScore = 1;
let score = 1;
let maxStage = 0;
let cursor;
let lastCursor;
let cursorx = 0;

const fruits = new Image();
fruits.src = "./fruits.png";

const can = document.getElementById("can");
const ctx = can.getContext("2d");

const engine = Matter.Engine.create();
engine.positionIterations *= 2;
engine.velocityIterations *= 2;

function die() {
    window.location = window.location;
}

function createWall(w, h, thick) {
    const walls = Matter.Composite.create({ name: "wall", wallThickness: thick, wallSize: Matter.Vector.create(w, h) });
    Matter.Composite.add(walls, [
        Matter.Bodies.rectangle( // bottom
            0, h / 2,
            w, thick,
            { isStatic: true }
        ),
        Matter.Bodies.rectangle( // left
            -w / 2, -h / 2,
            thick, h * 2,
            { isStatic: true }
        ),
        Matter.Bodies.rectangle( // right
            w / 2, -h / 2,
            thick, h * 2,
            { isStatic: true }
        ),
        
    ]);
    return walls;
}
function getBallScore(stage) {
    return 3 ** stage;
}
function createBall(stage, x, y) {
    const radius = initialBallSize * (scaleFactor ** stage);
    const ball = Matter.Bodies.circle(x, y, radius, {
        name: "ball", radius: radius, ballStage: stage,
        restitution: 0.9
    })
    return ball;
}
function place() {
    if (!cursor) return;
    Matter.Body.setStatic(cursor, false);
    score += getBallScore(cursor.ballStage);
    lastCursor = cursor;
    cursor = undefined;
    window.setTimeout(newcursor, 200);
}
function newcursor() {
    let stage = 0;
    for (let i = 0; i < maxStage; ++i) {
        if (Math.random() < 0.8) break;
        stage += 1;
    }
    cursor = createBall(stage, cursorx, -60 * aspect);
    Matter.Body.setStatic(cursor, true);
    Matter.Composite.add(engine.world, cursor);
}
newcursor();

let lastDead = Date.now();
function frame() {

    actualScore = (actualScore + score) / 2;
    
    ctx.resetTransform();
    ctx.clearRect(0, 0, can.width, can.height);

    ctx.fillStyle = "black";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle"
    
    ctx.fillText(Math.round(actualScore), can.width / 2, 50);

    const time = Date.now() - lastDead
    if (time > 1000) {
        ctx.fillText(`${((6000 - time) / 1000).toFixed(1)}s left to sort it out!`, can.width / 2, can.height - 50);
    }

    ctx.translate(can.width / 2, can.height / 2);
    ctx.scale(scale, scale);

    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-50, deadPoint);
    ctx.lineTo(50, deadPoint);
    ctx.stroke();

    engine.world.composites.forEach(composite => {
        switch (composite.name) {
            case "wall":
                ctx.lineWidth = composite.wallThickness;
                ctx.strokeStyle = "black";
                ctx.lineCap = "round";
                ctx.lineJoin = "round";    
                ctx.beginPath();
                ctx.moveTo(-composite.wallSize.x / 2, -composite.wallSize.y / 2);
                ctx.lineTo(-composite.wallSize.x / 2, composite.wallSize.y / 2);
                ctx.lineTo(composite.wallSize.x / 2, composite.wallSize.y / 2);
                ctx.lineTo(composite.wallSize.x / 2, -composite.wallSize.y / 2);
                ctx.stroke();
                break;
        }
    });

    let gotDeaded = false;
    engine.world.bodies.forEach(body => {
        switch (body.name) {
            case "ball":
                ctx.fillStyle = [
                    "#f00", "#f80", "#0f0", "#ff0", "#f0f", "#f00", "#ff0", "#f80", "#0f0", "#8f0"
                ][body.ballStage];
                ctx.beginPath();
                ctx.arc(body.position.x, body.position.y, body.radius, 0, 2 * Math.PI)
                ctx.fill();
                const align = 240;
                const cut = 5;
                const scale = 0.7;
                ctx.save();
                ctx.translate(body.position.x, body.position.y);
                ctx.rotate(body.angle);
                ctx.scale(scale, scale);
                ctx.drawImage(fruits, body.ballStage * align + cut, cut, align - cut * 2, align - cut * 2, -body.radius, -body.radius, body.radius * 2, body.radius * 2);
                ctx.restore();
                if (body !== cursor && body !== lastCursor)
                    if (body.position.y < deadPoint * scale)
                        gotDeaded = true;
                break;
        }
    });
    if (gotDeaded) {
        if (!lastDead)
            lastDead = Date.now();
    } else {
        lastDead = undefined;
    }
    if (Date.now() - lastDead > 6000) {
        die();
    }
    // Matter.Composite.allComposites(engine.world).forEach(composite => {
    window.requestAnimationFrame(frame);
}
function resize() {
    can.width = window.innerWidth;
    can.height = window.innerHeight;
    scale = Math.min(can.width, can.height) / 250;
}

Matter.Events.on(engine, "collisionActive", pairs => {
    const combined = new Set();
    combined.add(cursor);
    for (let i = 0; i < engine.pairs.list.length; ++i) {
        const col = engine.pairs.list[i];
        const a = col.bodyA;
        const b = col.bodyB;
        if (a.name !== "ball") continue;
        if (b.name !== "ball") continue;
        if (combined.has(a)) continue;
        if (combined.has(b)) continue;
        if (a.ballStage !== b.ballStage) continue;
        combined.add(a);
        combined.add(b);
        score -= getBallScore(a.ballStage);
        score -= getBallScore(b.ballStage);
        Matter.Composite.remove(engine.world, b);
        a.ballStage += 1;
        score += getBallScore(a.ballStage);
        a.radius *= scaleFactor;
        Matter.Body.setPosition(a, Matter.Vector.create(
            (a.position.x + b.position.x) / 2,
            (a.position.y + b.position.y) / 2
        ));
        maxStage = Math.max(maxStage, a.ballStage);
        Matter.Body.scale(a, scaleFactor, scaleFactor);
    }
});

function jiggle() {
    engine.world.bodies.forEach(body => {
        switch (body.name) {
            case "ball":
                const angle = Math.random() * Math.PI * 2;
                Matter.Body.applyForce(
                    body,
                    body.position,
                    Matter.Vector.create(
                        Math.sin(angle) * jiggleForce,
                        Math.cos(angle) * jiggleForce
                    )
                )
                break;
        }
    });
}

window.addEventListener("resize", resize);
resize();
Matter.Composite.add(engine.world, createWall(100, 100 * aspect, 10));
for (let i = 0; i < 1; ++i) {
    const ball = createBall(0, Math.random() * 100 - 50, Math.random() * 100 - 50);
    Matter.Composite.add(engine.world, ball);
}

can.onclick = event => {
    event.preventDefault();
    place();
};
can.oncontextmenu = event => {
    event.preventDefault();
}
window.onmousemove = event => {
    if (!cursor) return;
    cursorx = (event.clientX - can.width / 2) / scale;
    const radius = cursor.radius;
    if (cursorx > 45 - radius) cursorx = 45 - radius;
    else if (cursorx < -45 + radius) cursorx = -45 + radius;
    Matter.Body.setPosition(cursor, Matter.Vector.create(
        cursorx,
        cursor.position.y
    ));
}
window.onkeydown = event => {
    if (event.key === " ") {
        jiggle();
    } else if (event.key === "b") {
        Matter.Composite.add(engine.world, createBall(1, 0, 0))
    } else if (event.key === "k") {
        Matter.Composite.add(engine.world, createBall(5, 0, 0))
    }
}

window.requestAnimationFrame(frame);
Matter.Runner.run(engine);