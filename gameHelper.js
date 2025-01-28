"use strict";
const CANVAS_ID = "gameCanvas";
let IS_DEBUGGING = false;
let DEBUG_CURRENT_ANIMATION = "run";
const GAME_FPS = 130;
const GAME_JUMP_RANGE = 160;
const GAME_JUMPING_SPEED = 3;
const GAME_GENERATING_ENTITIES = 30;
let GAME_INTERVAL;
class GameHelper {
    constructor(_canvas, _body, _background = new Image(), _backgroundX = 0, _entities = []) {
        this._canvas = _canvas;
        this._body = _body;
        this._background = _background;
        this._backgroundX = _backgroundX;
        this._entities = _entities;
        this._canvas =
            _canvas !== null && _canvas !== void 0 ? _canvas : (() => {
                let canvas = document.querySelector("canvas");
                if (!canvas) {
                    canvas = document.createElement("canvas");
                    canvas.width = window.outerWidth;
                    canvas.height = window.outerHeight - 250;
                    canvas.id = CANVAS_ID;
                }
                return canvas;
            })(),
            this._body = _body !== null && _body !== void 0 ? _body : (() => {
                const body = document.querySelector("body");
                return body;
            })();
    }
    loadMap() {
        return new Promise((resolve, reject) => {
            this._body.append(this._canvas);
            const ctx = this._canvas.getContext("2d");
            this._background.src = new URL("./img/background.png", window.location.href).toString();
            this._background.onload = () => {
                const scaleX = this._canvas.width / this._background.width;
                const scaleY = this._canvas.height / this._background.height;
                const scale = Math.max(scaleX, scaleY);
                ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(this._background, 0, 0, this._background.width * scale, this._background.height * scale);
                resolve(true);
            };
            this._background.onerror = () => {
                reject(false);
            };
        });
    }
    loadEntity(entity) {
        const ctx = this._canvas.getContext("2d");

        if (!IS_DEBUGGING) {
            const p_images = [];
            const running_images = [];
            const jumping_images = [];
            let generating_sprite_images;
            if (entity instanceof AnimatedEntity) {
                for (const [animations_key, [animations_path, animations_frames]] of Object.entries(entity.getAnimationsPath())) {
                    if (!animations_path || !animations_frames)
                        continue;
                    const animations_name = animations_path.split("/")[2];
                    const sprite_path = `${animations_path}${animations_name}`;
                    for (let i = 0; i < animations_frames; i++) {
                        p_images.push(new Promise((resolve, reject) => {
                            const image = new Image();
                            image.src = new URL(`${sprite_path}${i}.png`, window.location.href).toString();
                            image.onload = () => {
                                const scaleX = this._canvas.width / this._background.width;
                                const scaleY = this._canvas.height / this._background.height;
                                const scale = Math.max(scaleX, scaleY);
                                let x = entity.getX()
                                let y = entity.getY()

                                if(x === "adaptive") {
                                    const bgW = this._background.width * scale
                                    x = bgW - (entity.getWidth() + 20) 
                                    entity.setX(x)
                                }
                                
                                if(y === "adaptive") {
                                    const bgY = this._background.height * scale
                                    y = bgY - (entity.getHeight() + 20) 
                                    entity.setY(y)
                                }

                                if (animations_key.includes("run") && i === 0)
                                    ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(image, x, y, entity.getWidth(), entity.getHeight());
                                if (animations_key.includes("run"))
                                    running_images.push(image);
                                else if (animations_key.includes("jump"))
                                    jumping_images.push(image);
                                resolve(image);
                            };
                            image.onerror = () => reject(new Error(`Failed to load image: ${sprite_path}${i}.png`));
                        }));
                    }
                }
            }
            else if (entity.constructor.name === "Entity") {
                p_images.push(new Promise((resolve, reject) => {
                    const image = new Image();
                    image.src = new URL(entity.getPath(), window.location.href).toString();
                    image.onload = () => {
                        generating_sprite_images = {
                            image: image,
                            x: 0,
                            y: 0
                        };
                        resolve(image);
                    };
                    image.onerror = () => reject(new Error(`Failed to load image: ${entity.getPath()}`));
                }));
            }
            return Promise.all(p_images)
                .then(() => {
                this._entities.push({
                    entity: entity,
                    running_images: running_images,
                    jumping_images: jumping_images,
                    generating_sprite_images: generating_sprite_images,
                    generated: []
                });
            });
        }
        else {
            ctx.fillStyle = entity.getColor();
            ctx.fillRect(x, y, entity.getWidth(), entity.getHeight());
            this._entities.push({
                entity: entity,
            });
            return Promise.resolve();
        }
    }
    runningMap(ctx) {
        const scaleX = this._canvas.width / this._background.width;
        const scaleY = this._canvas.height / this._background.height;
        const scale = Math.max(scaleX, scaleY);
        ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(this._background, this._backgroundX, 0, this._background.width * scale, this._background.height * scale);
        ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(this._background, this._backgroundX + this._background.width * scale - 1, 0, this._background.width * scale, this._background.height * scale);
        if (Math.abs(this._backgroundX) >= this._background.width * scale)
            this._backgroundX = 0;
        else
            this._backgroundX -= 5;
        return true;
    }
    runningEntity(entities, ctx, sprite_delay) {
        if (entities.entity instanceof AnimatedEntity) {
            const entity = entities.entity;
            let [sprite, x, y, width, height] = entity.actionRun(this._canvas, entities.running_images, sprite_delay);
            ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(sprite, x, y, width, height);
            return true;
        }
        return false;
    }
    jumpingEntity(entities, ctx, sprite_delay) {
        const entity = entities.entity;
        if (entity instanceof Player) {
            let [sprite, x, y, width, height] = entity.actionJump(this._canvas, entities.jumping_images, sprite_delay);
            ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(sprite, x, y, width, height);
            return true;
        }
    }
    animateEntities(ctx, sprite_delay) {
        var _a, _b, _c, _d;
        if (!IS_DEBUGGING) {
            for (let i = 0; i < this._entities.length; i++) {
                const entity = this._entities[i].entity;
                const player = (_a = this._entities.find(e => e.entity instanceof Player)) === null || _a === void 0 ? void 0 : _a.entity;
                if (entity instanceof AnimatedEntity) {
                    if ((_b = entity.getCurrentAnimation()) === null || _b === void 0 ? void 0 : _b.includes("run"))
                        this.runningEntity(this._entities[i], ctx, sprite_delay);
                    else if ((_c = entity.getCurrentAnimation()) === null || _c === void 0 ? void 0 : _c.startsWith("jump_"))
                        this.jumpingEntity(this._entities[i], ctx, sprite_delay);
                }
                else {
                    if (player.isColliding(entity))
                        clearInterval(GAME_INTERVAL);
                }
            }
        }
        else {
            for (let i = 0; i < this._entities.length; i++) {
                const entity = this._entities[i].entity;
                let x = entity.getX() - 5;
                let y = entity.getY();
                const player = (_d = this._entities.find(e => e.entity instanceof Player)) === null || _d === void 0 ? void 0 : _d.entity;
                if (entity instanceof Player) {
                    if (DEBUG_CURRENT_ANIMATION.startsWith("jump_")) {
                        if (DEBUG_CURRENT_ANIMATION.includes("jump_up")) {
                            if (y >= entity.getOriginalCoord().y - GAME_JUMP_RANGE)
                                entity.setY(y -= 1);
                            else
                                DEBUG_CURRENT_ANIMATION = "jump_down";
                        }
                        else {
                            if (y < entity.getOriginalCoord().y)
                                entity.setY(y += 1);
                            else
                                DEBUG_CURRENT_ANIMATION = "run";
                        }
                    }
                    ctx.fillStyle = entity.getColor();
                    ctx.fillRect(x, y, entity.getWidth(), entity.getHeight());
                }
                else if (entity.constructor.name === "AnimatedEntity") {
                    ctx.fillStyle = entity.getColor();
                    ctx.fillRect(x, y, entity.getWidth(), entity.getHeight());
                }
                else {
                    if (player.isColliding(entity))
                        clearInterval(GAME_INTERVAL);
                }
            }
        }
    }
    generating(ctx) {
        for (let i = 0; i < this._entities.length; i++) {
            const entity = this._entities[i].entity;
            if (entity.constructor.name === "Entity") {
                let x = this._canvas.width - entity.getWidth() + this._backgroundX;
                let y = entity.getY();

                const scaleX = this._canvas.width / this._background.width;
                const scaleY = this._canvas.height / this._background.height;
                const scale = Math.max(scaleX, scaleY);

                if(x === "adaptive") {
                    const bgW = this._background.width * scale
                    x = bgW - (entity.getWidth() + 20) 
                    entity.setX(x)
                }
                
                if(y === "adaptive") {
                    const bgY = this._background.height * scale
                    y = bgY - (entity.getHeight() + 20) 
                    entity.setY(y)
                }
                
                if (!IS_DEBUGGING) {
                    const image = this._entities[i].generating_sprite_images.image;
                    ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(image, x, y, entity.getWidth(), entity.getHeight());
                }
                else {
                    ctx.fillStyle = entity.getColor();
                    ctx.fillRect(x, y, entity.getWidth(), entity.getHeight());
                }
                entity.setX(x);
            }
        }
    }
    event_jump() {
        for (let i = 0; i < this._entities.length; i++) {
            const entity = this._entities[i].entity;
            if (entity instanceof Player) {
                if (!IS_DEBUGGING) {
                    if (entity.getCurrentAnimation().startsWith("jump_"))
                        return;
                    entity.setCurrentAnimation("jump_up");
                }
                else {
                    if (DEBUG_CURRENT_ANIMATION.startsWith("jump_"))
                        return;
                    DEBUG_CURRENT_ANIMATION = "jump_up";
                }
            }
        }
    }
    gameStart() {
        const ctx = this._canvas.getContext("2d");
        document.addEventListener("keyup", (e) => {
            if (e.key.includes("w") || e.key.includes(" ")) {
                this.event_jump();
            }
        });
        document.addEventListener('touchstart', (e) => {
            this.event_jump();
        });
        let sprite_delay = 0;
        GAME_INTERVAL = setInterval(() => {
            ctx === null || ctx === void 0 ? void 0 : ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            this.runningMap(ctx);
            this.animateEntities(ctx, sprite_delay);
            this.generating(ctx);
            sprite_delay++;
        }, 1000 / GAME_FPS);
    }
}
class Entity {
    constructor(_id, _origin = { x: number | "adaptive", y: number | "adaptive"}, _path, _width = 140, _height = 140) {
        this._id = _id;
        this._origin = _origin;
        this._path = _path;
        this._width = _width;
        this._height = _height;
    }
    getId() { return this._id; }
    getX() { return this._origin.x; }
    setX(value) { this._origin.x = value; }
    getY() { return this._origin.y; }
    setY(value) { this._origin.y = value; }
    getWidth() { return this._width; }
    getHeight() { return this._height; }
    getPath() { return this._path; }
    getColor() {
        if (this instanceof Player)
            return "blue";
        else if (this instanceof AnimatedEntity)
            return "red";
        else
            return "yellow";
    }
}
class AnimatedEntity extends Entity {
    constructor(_id, _origin = { x: number | "adaptive", y: number | "adaptive"}, _animationsPath = { run: [null, null], jump: [null, null] }, _animationsCounters = { run: 0, jump: 0 }, _currentAnimation = "run", _width = 140, _height = 140, _changedCoord = Object.assign({}, _origin)) {
        super(_id, _origin, null, _width, _height);
        this._animationsPath = _animationsPath;
        this._animationsCounters = _animationsCounters;
        this._currentAnimation = _currentAnimation;
        this._changedCoord = _changedCoord;
    }
    getX() { return this._origin.x === "adaptive" ? this._origin.x : this._changedCoord.x }
    setX(value) { this._origin.x === "adaptive" ? this._origin.x = value : this._changedCoord.x = value  }
    getY() { return this._origin.y === "adaptive" ? this._origin.y : this._changedCoord.y }
    setY(value) { this._origin.y === "adaptive" ? this._origin.y = value : this._changedCoord.y = value; }
    getAnimationsPath() { return this._animationsPath; }
    getCurrentAnimation() { return this._currentAnimation; }
    setCurrentAnimation(name) { this._currentAnimation = name; }
    getRunningAnimationsCount() { var _a, _b; return (_b = (_a = this._animationsPath) === null || _a === void 0 ? void 0 : _a.run) === null || _b === void 0 ? void 0 : _b[1]; }
    getJumpingAnimationsCount() { var _a, _b; return (_b = (_a = this._animationsPath) === null || _a === void 0 ? void 0 : _a.jump) === null || _b === void 0 ? void 0 : _b[1]; }
    actionRun(canvas, frames, delay) {
        let x = this._changedCoord.x;
        let y = this._changedCoord.y;
        if (x + this._width > canvas.width)
            x = canvas.width - this._width;
        if (y + this._height > canvas.height)
            y = canvas.height - this._height;
        const sprite = frames[this._animationsCounters.run];
        if (delay % (GAME_FPS / 10) == 0) {
            if (this._animationsCounters.run >= this.getRunningAnimationsCount() - 1)
                this._animationsCounters.run = 0;
            else
                this._animationsCounters.run++;
        }
        return [sprite, x, y, this._width, this._height];
    }
}
class Player extends AnimatedEntity {
    constructor(_id, _origin = { x: number | "adaptive", y: number | "adaptive"}, _animationsPath, _animationsCounters = { run: 0, jump: 0 }, _currentAnimation = "run", _width = 140, _height = 140, _changedCoord = Object.assign({}, _origin)) {
        super(_id, _origin, _animationsPath, _animationsCounters, _currentAnimation, _width, _height, _changedCoord);
    }
    getOriginalCoord() { return this._origin; }
    actionJump(canvas, frames, delay) {
        let x = this._changedCoord.x;
        let y = this._changedCoord.y;
        if (x + this._width > canvas.width)
            x = canvas.width - this._width;
        if (y + this._height > canvas.height)
            y = canvas.height - this._height;
        const sprite = frames[this._animationsCounters.jump];
        if (delay % (GAME_FPS / 10) == 0) {
            if (this._animationsCounters.jump >= this.getJumpingAnimationsCount() - 1)
                this._animationsCounters.jump = 0;
            else
                this._animationsCounters.jump++;
        }
        
        if (this._currentAnimation.includes("jump_up")) {
            if (this._changedCoord.y >= this._origin.y - GAME_JUMP_RANGE)
                this._changedCoord.y -= GAME_JUMPING_SPEED;
            else
                this._currentAnimation = "jump_down";
        }
        else if (this._currentAnimation.includes("jump_down")) {
            if (this._changedCoord.y < this._origin.y)
                this._changedCoord.y += GAME_JUMPING_SPEED;
            else
                this._currentAnimation = "run";
        }
        return [sprite, x, y, this._width, this._height];
    }
    isColliding(entity) {
        const selfX = this._changedCoord.x;
        const selfY = this._changedCoord.y;
        const selfWidth = this._width;
        const selfHeight = this._height;
        const targetX = entity.getX();
        const targetY = entity.getY();
        const targetWidth = entity.getWidth();
        const targetHeight = entity.getHeight();
        return (selfX < targetX + targetWidth &&
            selfX + selfWidth > targetX &&
            selfY < targetY + targetHeight &&
            selfY + selfHeight > targetY);
    }
}
const gameHelper = new GameHelper();
const player = new Player("p_santa", { x: 150, y: "adaptive" }, { run: ["./img/santa/", 6], jump: ["./img/santa-jump/", 4] });
const enemy = new AnimatedEntity("e_grinch", { x: 5, y: "adaptive" }, { run: ["./img/grinch/", 6] });
const object = new Entity("o_object_1", { x: 5, y: "adaptive" }, "./img/obstacles/A.png", 50, 50);
gameHelper.loadMap()
    .then(() => gameHelper.loadEntity(player))
    .then(() => gameHelper.loadEntity(enemy))
    .then(() => gameHelper.loadEntity(object));
gameHelper.gameStart();
