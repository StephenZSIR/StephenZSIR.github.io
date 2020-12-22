{
    const Disk = class {
        constructor() {
            this.x = 0;
            this.y = -10000;
            this.vx = 2 * Math.random() - 1;
            this.vy = 2 * Math.random() - 1;
            this.r = 0;
            this.sat = 0;
        }
        anim() {
            this.x += this.vx;
            this.y += this.vy;
            ctx.beginPath();
            ctx.strokeStyle = "#fff";
            ctx.fillStyle = this.color;
            ctx.fillStyle = "hsl(30, " + this.sat + "%, 50%)";
            ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            if (this.y < -canvas.y - canvas.height) {
                this.r = doll.s * 4 + Math.random() * doll.s * 3;
                this.y =
                    this.r + canvas.height * 0.5 - canvas.y + Math.random() * canvas.height;
                this.x = -canvas.x + Math.random() * canvas.width - canvas.width * 0.5;
                this.sat = 0;
            }
        }
    };
    const Doll = class {
        constructor(size, structure) {
            this.s = size;
            this.points = [];
            this.links = [];
            this.angles = [];
            const len = (p0, p1) => {
                for (const link of structure.links) {
                    if (
                        (link.p0 === p0 && link.p1 === p1) ||
                        (link.p0 === p1 && link.p1 === p0)
                    ) {
                        return link.length;
                        break;
                    }
                }
                return 1;
            };
            for (const link of structure.links) {
                this.links.push(new Doll.Link(this, link));
            }
            for (const constraint of structure.constraints) {
                this.angles.push(
                    new Doll.Angle(
                        this.points[constraint.p1],
                        this.points[constraint.p2],
                        this.points[constraint.p3],
                        len(constraint.p1, constraint.p2) * size,
                        len(constraint.p2, constraint.p3) * size,
                        constraint.angle,
                        constraint.range,
                        0.05
                    )
                );
            }
        }
        anim() {
            for (const angle of this.angles) angle.solve();
            for (const point of this.points) point.anim();
            for (const link of this.links) link.draw();
        }
        collide(disks) {
            for (const point of this.points) {
                for (const disk of disks) {
                    const dx = point.x - disk.x;
                    const dy = point.y - disk.y;
                    const sd = dx * dx + dy * dy;
                    const w = 0.5 * point.w + disk.r;
                    if (sd < w * w) {
                        const d = Math.sqrt(sd);
                        point.x += 0.5 * dx / d * (w - d);
                        point.y += 0.5 * dy / d * (w - d);
                        if (disk.sat < 70) disk.sat++;
                    }
                }
            }
        }
    };
    Doll.Point = class {
        constructor() {
            this.x = 0;
            this.y = 0;
            this.xb = 0;
            this.yb = 0;
            this.w = 0;
            this.mass = 1;
        }
        anim() {
            if (pointer.pointDrag && this === pointer.pointDrag) {
                this.x = this.xb = pointer.x - canvas.x - canvas.width * 0.5;
                this.y = this.yb = pointer.y - canvas.y - canvas.height * 0.5;
            } else {
                const vx = (this.x - this.xb) * 0.995;
                const vy = (this.y - this.yb) * 0.995;
                this.xb = this.x;
                this.yb = this.y;
                this.x += vx;
                this.y += vy + 0.15 * this.mass;
            }
        }
    };
    Doll.Angle = class {
        constructor(p1, p2, p3, len1, len2, angle, range, force) {
            this.p1 = p1;
            this.p2 = p2;
            this.p3 = p3;
            this.len1 = len1;
            this.len2 = len2;
            this.angle = angle;
            this.range = range;
            this.force = force;
        }
        solve() {
            let a, b, c, e, m;
            let m1, m2, m3, x1, y1;
            let cos, sin;
            a = Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
            b = Math.atan2(this.p3.y - this.p2.y, this.p3.x - this.p2.x);
            c = this.angle - (b - a);
            c = c > Math.PI ? c - 2 * Math.PI : c < -Math.PI ? c + 2 * Math.PI : c;
            e = Math.abs(c) > this.range ? (-Math.sign(c) * this.range + c) * this.force : 0;
            m = this.p1.mass + this.p2.mass;
            m1 = this.p1.mass / m;
            m2 = this.p2.mass / m;
            cos = Math.cos(a - e);
            sin = Math.sin(a - e);
            x1 = this.p1.x + (this.p2.x - this.p1.x) * m2;
            y1 = this.p1.y + (this.p2.y - this.p1.y) * m2;
            this.p1.x = x1 - cos * this.len1 * m2;
            this.p1.y = y1 - sin * this.len1 * m2;
            this.p2.x = x1 + cos * this.len1 * m1;
            this.p2.y = y1 + sin * this.len1 * m1;
            a = Math.atan2(this.p2.y - this.p3.y, this.p2.x - this.p3.x) + e;
            m = this.p2.mass + this.p3.mass;
            m2 = this.p2.mass / m;
            m3 = this.p3.mass / m;
            cos = Math.cos(a);
            sin = Math.sin(a);
            x1 = this.p3.x + (this.p2.x - this.p3.x) * m2;
            y1 = this.p3.y + (this.p2.y - this.p3.y) * m2;
            this.p3.x = x1 - cos * this.len2 * m2;
            this.p3.y = y1 - sin * this.len2 * m2;
            this.p2.x = x1 + cos * this.len2 * m3;
            this.p2.y = y1 + sin * this.len2 * m3;
        }
    };
    Doll.Link = class {
        constructor(doll, link) {
            this.length = link.length * doll.s;
            this.width = link.width * doll.s;
            this.offset = link.offset || 0.0;
            this.image = link.img ? document.getElementById(link.img) : null;
            doll.points[link.p0] = this.p0 = doll.points[link.p0] ? doll.points[link.p0] : new Doll.Point();
            doll.points[link.p1] = this.p1 = doll.points[link.p1] ? doll.points[link.p1] : new Doll.Point();
            if (this.width > this.p0.w) this.p0.w = this.width;
            this.p0.mass++;
            this.p1.mass++;
        }
        draw() {
            if (!this.image) return;
            const dx = this.p1.x - this.p0.x;
            const dy = this.p1.y - this.p0.y;
            const a = Math.atan2(dy, dx);
            const d = Math.sqrt(dx * dx + dy * dy);
            ctx.save();
            ctx.translate(this.p0.x, this.p0.y);
            ctx.rotate(a);
            ctx.drawImage(
                this.image, -this.width * 0.15 - this.width * this.offset, -this.width * 0.5,
                d + this.width * 0.3,
                this.width
            );
            ctx.restore();
        }
    };
    // ---- set canvas ----
    const canvas = {
        init() {
                this.elem = document.querySelector("canvas");
                this.resize();
                this.x = 0;
                this.y = 0;
                this.s = 0.01;
                window.addEventListener("resize", () => canvas.resize(), false);
                return this.elem.getContext("2d");
            },
            resize() {
                this.width = this.elem.width = this.elem.offsetWidth;
                this.height = this.elem.height = this.elem.offsetHeight;
            },
            scroll(p) {
                if (!pointer.pointDrag) {
                    this.x += (-p.x - this.x) * this.s;
                    this.y += (-p.y - this.y) * this.s;
                    if (this.s < 0.25) this.s += 0.001;
                } else this.s = 0.01;
                ctx.translate(this.x + this.width * 0.5, this.y + this.height * 0.45);
            }
    };
    // ---- set pointer ----
    const pointer = {
        init(canvas) {
                this.x = 0;
                this.y = 0;
                window.addEventListener("mousemove", e => this.move(e), false);
                canvas.elem.addEventListener("touchmove", e => this.move(e), false);
                window.addEventListener("mousedown", e => this.down(e), false);
                window.addEventListener("touchstart", e => this.down(e), false);
                window.addEventListener("mouseup", e => this.up(e), false);
                window.addEventListener("touchend", e => this.up(e), false);
            },
            down(e) {
                this.move(e);
                let msd = 1000000;
                for (const point of doll.points) {
                    const dx = point.x + canvas.x - this.x + canvas.width * 0.5;
                    const dy = point.y + canvas.y - this.y + canvas.height * 0.5;
                    const sd = dx * dx + dy * dy;
                    if (sd < canvas.width * 0.05 * canvas.width * 0.05) {
                        if (sd < msd) {
                            msd = sd;
                            this.pointDrag = point;
                        }
                    }
                }
            },
            up(e) {
                this.pointDrag = null;
            },
            move(e) {
                let touchMode = e.targetTouches,
                    pointer;
                if (touchMode) {
                    e.preventDefault();
                    pointer = touchMode[0];
                } else pointer = e;
                this.x = pointer.clientX;
                this.y = pointer.clientY;
            }
    };
    // ---- init ----
    const ctx = canvas.init();
    pointer.init(canvas);
    // ---- main loop ----
    const run = () => {
        requestAnimationFrame(run);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        canvas.scroll(doll.points[3]);
        for (const disk of disks) disk.anim();
        doll.collide(disks);
        doll.anim();
        ctx.restore();
    };
    const disks = [];
    for (let i = 0; i < 10; i++) {
        disks.push(new Disk());
    }

    const doll = new Doll(Math.sqrt(canvas.width) / 2, {
        links: [{
            p0: 0,
            p1: 1,
            length: 7,
            width: 2.5,
            img: "arm-right"
        }, {
            p0: 1,
            p1: 2,
            length: 7,
            width: 2.5,
            img: "hand-right"
        }, {
            p0: 3,
            p1: 7,
            length: 6,
            width: 3.5,
            img: "left-leg"
        }, {
            p0: 7,
            p1: 8,
            length: 7,
            width: 3,
            img: "left-foot"
        }, {
            p0: 3,
            p1: 9,
            length: 6,
            width: 2.5,
            offset: 0.3,
            img: "right-leg"
        }, {
            p0: 9,
            p1: 10,
            length: 7,
            width: 4,
            offset: 0.05,
            img: "right-foot"
        }, {
            p0: 0,
            p1: 4,
            length: 4.5,
            width: 4.5,
            offset: -0.2,
            img: "head"
        }, {
            p0: 0,
            p1: 11,
            length: 4,
            width: 5,
            offset: 0.1,
            img: "tors"
        }, {
            p0: 11,
            p1: 3,
            length: 4,
            width: 3,
            offset: 0.2,
            img: "stomach"
        }, {
            p0: 0,
            p1: 5,
            length: 6,
            width: 2,
            img: "left-arm"
        }, {
            p0: 5,
            p1: 6,
            length: 7,
            width: 4,
            img: "left-hand"
        }],
        constraints: [{
            p1: 4,
            p2: 0,
            p3: 11,
            angle: 0,
            range: 1
        }, {
            p1: 0,
            p2: 1,
            p3: 2,
            angle: -Math.PI / 2,
            range: Math.PI / 2
        }, {
            p1: 0,
            p2: 5,
            p3: 6,
            angle: -Math.PI / 2,
            range: Math.PI / 2
        }, {
            p1: 11,
            p2: 3,
            p3: 7,
            angle: -Math.PI / 4,
            range: Math.PI / 3
        }, {
            p1: 11,
            p2: 3,
            p3: 9,
            angle: Math.PI / 4,
            range: Math.PI / 3
        }, {
            p1: 3,
            p2: 7,
            p3: 8,
            angle: Math.PI / 2,
            range: Math.PI / 3
        }, {
            p1: 3,
            p2: 9,
            p3: 10,
            angle: Math.PI / 2,
            range: Math.PI / 3
        }, {
            p1: 0,
            p2: 11,
            p3: 3,
            angle: 0,
            range: 0.1
        }, {
            p1: 11,
            p2: 0,
            p3: 1,
            angle: Math.PI / 2,
            range: Math.PI / 3
        }, {
            p1: 11,
            p2: 0,
            p3: 5,
            angle: -Math.PI / 2,
            range: Math.PI / 3
        }]
    });
    run();
}
