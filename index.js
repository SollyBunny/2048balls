// Matter.use('matter-collision-events')

const e_center = document.getElementById("center");

const aspect = 1.2;
const scaleFactor = Math.sqrt(2) / 1.1;
const initialBallSize = 5;
let jiggleForce = 0.001;
let scale = 1;
let score = 1;
let maxStage = 0;
let cursor;
let lastCursor;
let cursorx = 0;

let fruitsOn = false;
let fruits = undefined;

const can = document.getElementById("can");
const ctx = can.getContext("2d");

const engine = Matter.Engine.create();
engine.positionIterations *= 2;
engine.velocityIterations *= 2;

const e_score = document.getElementById("score");
const e_hiscore = document.getElementById("hiscore");
let hiscore = parseInt(localStorage["2048balls.hiscore"]) || 0;
e_hiscore.textContent = hiscore;
function setHiscore() {
    hiscore = score;
    localStorage["2048balls.hiscore"] = hiscore;
    e_hiscore.textContent = hiscore;
}
function setScore() {
    if (score > hiscore) {
        setHiscore();
    }
    e_score.textContent = score;
}

function renderBall(stage, radius) {
    if (fruitsOn) {
        ctx.fillStyle = [
            "#f00", "#f80", "#0f0", "#ff0", "#f0f", "#f00", "#ff0", "#f80", "#0f0", "#8f0"
        ][stage];
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.fill();
        const align = 240;
        const cut = 5;
        const scale = 0.7;
        ctx.save();
        ctx.scale(scale, scale);
        ctx.drawImage(fruits, stage * align + cut, cut, align - cut * 2, align - cut * 2, -radius, -radius, radius * 2, radius * 2);
        ctx.restore();
    } else {
        ctx.fillStyle = ["#eee4da", "#ede0c8", "#f2b179", "#f59563", "#f59563", "#f67c5f", "#f65e3b", "#edcf72", "#edcc61", "#edc850", "#edc53f", "#edc22e", "#3c3a32"][stage];
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = stage < 3 ? "#776e65" : "#f9f6f2";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const text = (2 ** (1 + stage)).toString();
        ctx.font = `${radius / scale / text.length * 8}px "Clear Sans"`;
        ctx.fillText(text, 0, 1);
    }
}

function createWall(w, h) {
    const thick = 100;
    const walls = Matter.Body.create({ name: "wall", thick, wallSize: Matter.Vector.create(w, h), isStatic: true });
    Matter.Body.setParts(walls, [
        Matter.Bodies.rectangle( // bottom
            -w, h / 2 + thick / 2,
            w * 4, thick,
            { isStatic: true }
        ),
        Matter.Bodies.rectangle( // left
            -w / 2 - thick / 2, -h / 2,
            thick, h * 3,
            { isStatic: true }
        ),
        Matter.Bodies.rectangle( // right
            w / 2 + thick / 2, -h / 2,
            thick, h * 3,
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
    setScore();
    cursor = undefined;
    window.setTimeout(newcursor, 200);
}
function newcursor() {
    let stage = 0;
    for (let i = 0; i < maxStage; ++i) {
        if (Math.random() < 0.8) break;
        stage += 1;
    }
    cursor = createBall(stage, cursorx, -50 * aspect - initialBallSize * (scaleFactor ** stage));
    Matter.Body.setStatic(cursor, true);
    Matter.Composite.add(engine.world, cursor);
}

let lastDead = Date.now();
function frame() {

    ctx.resetTransform();
    ctx.fillStyle = "#FBF8F0";
    ctx.fillRect(0, 0, can.width, can.height);

    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const time = Date.now() - lastDead

    ctx.translate(can.width / 2, can.height / 2);
    ctx.scale(scale, scale);

    let gotDeaded = false;
    let balls = [];
    engine.world.bodies.forEach(body => {
        switch (body.name) {
            case "wall":
                ctx.fillStyle = "#BBADA0";
                ctx.beginPath();
                ctx.roundRect(-body.wallSize.x / 2, -body.wallSize.y / 2, body.wallSize.x, body.wallSize.y, [0, 0, 2, 2]);
                ctx.fill();
                break;
            case "ballcombining":
            case "ball":
                balls.push(body);
                break;
        }
    });
    balls.forEach(ball => {
        ctx.save();
        ctx.translate(ball.position.x, ball.position.y);
        ctx.rotate(ball.angle);
        renderBall(ball.ballStage, ball.radius);
        ctx.restore();
        if (ball !== cursor && ball.position.y - ball.radius < -50 * aspect)
            gotDeaded = true;
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
    ctx.resetTransform();
    if (Date.now() - lastDead > 1000) {
        ctx.fillStyle = "#8f7a66";
        ctx.fillText(`${((6000 - time) / 1000).toFixed(1)}s left to sort it out!`, can.width / 2, 50);
    }
    // Matter.Composite.allComposites(engine.world).forEach(composite => {
    window.requestAnimationFrame(frame);
}
function resize() {
    can.width = window.innerWidth;
    can.height = window.innerHeight;
    scale = Math.min(can.width / 130, can.height / (150 * aspect));
    e_center.style.width = `${scale * 100}px`;
    e_center.style.height = `${scale * 100 * aspect}px`;
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
        a.name = b.name = "ballcombining";
        a.isStatic = b.isStatic = true;
        const velocity = Matter.Vector.div(Matter.Vector.add(a.velocity, b.velocity), 2); 
        const center = Matter.Vector.div(Matter.Vector.add(a.position, b.position), 2);
        window.setTimeout(() => {
            Matter.Composite.remove(engine.world, b);
            a.name = "ball";
            a.isStatic = false;
            score -= getBallScore(a.ballStage);
            score -= getBallScore(b.ballStage);
            a.ballStage += 1;
            score += getBallScore(a.ballStage);
            setScore();
            a.radius *= scaleFactor;
            Matter.Body.setAngle(a, 0);
            Matter.Body.setPosition(a, center);
            Matter.Body.setVelocity(a, velocity);
            a.angularVelocity = 0;
            maxStage = Math.max(maxStage, a.ballStage);
            Matter.Body.scale(a, scaleFactor, scaleFactor);
        }, 50);
    }
});

function fruit() {
    if (fruits === undefined) {
        fruits = new Image();
        fruits.src = "./fruits.png";
        window.setTimeout(() => { fruitsOn = true; }, 100);
        return;
    }
    fruitsOn = !fruitsOn;
}

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
const wall = createWall(100, 100 * aspect, 10);
Matter.Composite.add(engine.world, wall);
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
    if (cursorx > 50 - radius) cursorx = 50 - radius;
    else if (cursorx < -50 + radius) cursorx = -50 + radius;
    Matter.Body.setPosition(cursor, Matter.Vector.create(
        cursorx,
        cursor.position.y
    ));
}
window.onkeyup = event => {
    if (event.key === " ") {
        jiggle();
    } else if (event.key === "f") {
        fruit();
    } else if (event.key === "K") {
        Matter.Composite.add(engine.world, createBall(5, 0, 0))
    } else if (event.key === "B") {
        for (let i = 0; i < 32; ++i) {
            Matter.Composite.add(engine.world, createBall(0, 
                Math.random() * 80 - 40,    
                Math.random() * 80 - 40
            ));
        }
    }
    /*else if (event.key === "b") {
        Matter.Composite.add(engine.world, createBall(1, 0, 0))
    } else if (event.key === "k") {
        Matter.Composite.add(engine.world, createBall(5, 0, 0))
    }*/
}

let dying = false;
function reset() {
    lastDead = Date.now();
    wall.parts[1].isSensor = false;
    score = 0;
    setScore();
    dying = false;
    wall.friction = 1;
    engine.world.bodies.forEach(body => {
        switch (body.name) {
            case "ballcombining":
            case "ball":
                Matter.Composite.removeBody(engine.world, body);
                break;
        }
    });
    newcursor();
}
reset();

function die() {
    if (dying) return;
    dying = true;
    wall.parts[1].isSensor = true;
    wall.friction = 0;
    jiggle();
    window.setTimeout(reset, 2000);
}

window.requestAnimationFrame(frame);
Matter.Runner.run(engine);