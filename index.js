// Matter.use('matter-collision-events')

const aspect = 1.5;
let scale = 1;

const fruits = new Image();
fruits.src = "./fruits.png";

const can = document.getElementById("can");
const ctx = can.getContext("2d");

const engine = Matter.Engine.create();

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
function createBall(stage) {
    const radius = 3;
    const ball = Matter.Bodies.circle(0, 0, radius, { name: "ball", radius: radius, ballStage: stage })
    return ball;
}

function frame() {
    
    ctx.resetTransform();
    ctx.clearRect(0, 0, can.width, can.height);
    ctx.translate(can.width / 2, can.height / 2);
    ctx.scale(scale, scale);

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
    engine.world.bodies.forEach(body => {
        switch (body.name) {
            case "ball":
                ctx.fillStyle = [
                    "#f00", "#f80", "#ff0", "#8f0", "#0f0", "#0f8", "#0ff", "#08f", "#00f", "#80f", "#f0f", "#f08"
                ][body.ballStage];
                // ctx.beginPath();
                // ctx.arc(body.position.x, body.position.y, body.radius, 0, 2 * Math.PI)
                // ctx.fill();
                const align = 240;
                const cut = 5;
                ctx.save();
                ctx.translate(body.position.x, body.position.y);
                ctx.rotate(body.angle);
                ctx.drawImage(fruits, body.ballStage * align + cut, cut, align - cut * 2, align - cut * 2, -body.radius, -body.radius, body.radius * 2, body.radius * 2);
                ctx.restore();
                break;
        }
    });
    // Matter.Composite.allComposites(engine.world).forEach(composite => {
    window.requestAnimationFrame(frame);
}
function resize() {
    can.width = window.innerWidth;
    can.height = window.innerHeight;
    scale = Math.min(can.width, can.height) / 300;
}

Matter.Events.on(engine, "collisionActive", pairs => {
    for (let i = 0; i < engine.pairs.list.length; ++i) {
        const col = engine.pairs.list[i];
        const a = col.bodyA;
        const b = col.bodyB;
        if (a.name !== "ball") continue;
        if (b.name !== "ball") continue;
        if (a.ballStage !== b.ballStage) continue;
        Matter.Composite.remove(engine.world, b);
        a.ballStage += 1;
        a.radius *= Math.sqrt(2);
        Matter.Body.setPosition(a, Matter.Vector.create(
            (a.position.x + b.position.x) / 2,
            (a.position.y + b.position.y) / 2
        ));
        
        Matter.Body.scale(a, Math.sqrt(2), Math.sqrt(2));
    }
});

function jiggle() {
    engine.world.bodies.forEach(body => {
        switch (body.name) {
            case "ball":
                const angle = Math.random() * Math.PI * 2;
                const force = 0.0001;
                Matter.Body.applyForce(
                    body,
                    body.position,
                    Matter.Vector.create(
                        Math.sin(angle) * force,
                        Math.cos(angle) * force
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
    const ball = createBall(0);
    Matter.Body.setPosition(ball, Matter.Vector.create(
        Math.random() * 100 - 50,
        Math.random() * 100 - 50
    ), false)
    Matter.Composite.add(engine.world, ball);
}

window.onclick = event => {
    const ball = createBall(0);
    Matter.Body.setPosition(ball, Matter.Vector.create(
        event.clientX - can.width / 2,
        -100
    ), false)
    Matter.Composite.add(engine.world, ball);
};

window.requestAnimationFrame(frame);
Matter.Runner.run(engine);