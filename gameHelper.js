"use strict";
const CANVAS_ID = "gameCanvas";
const IS_DEBUGGING = false;
let DEBUG_CURRENT_ANIMATION = "run";
const GAME_FPS = 130;
const GAME_JUMP_RANGE = 50;
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
        let x = entity.getX();
        let y = entity.getY();
        if (x + entity.getWidth() > this._canvas.width)
            x = this._canvas.width - entity.getWidth();
        if (y + entity.getHeight() > this._canvas.height)
            y = this._canvas.height - entity.getHeight();
        if (!IS_DEBUGGING) {
            const p_images = [];
            const running_images = [];
            const jumping_images = [];
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
            Promise.all(p_images)
                .then(() => {
                this._entities.push({
                    entity: entity,
                    running_images: running_images,
                    jumping_images: jumping_images,
                });
            });
        }
        else {
            ctx.fillStyle = entity.getColor();
            ctx.fillRect(x, y, entity.getWidth(), entity.getHeight());
            this._entities.push({
                entity: entity,
                running_images: null,
                jumping_images: null,
            });
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
        const entity = entities.entity;
        let [sprite, x, y, width, height] = entity.actionRun(this._canvas, entities.running_images, sprite_delay);
        ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(sprite, x, y, width, height);
        return true;
    }
    jumpingEntity(entities, ctx, sprite_delay) {
        const entity = entities.entity;
        if (entity instanceof Player) {
            let [sprite, x, y, width, height] = entity.actionJump(this._canvas, entities.jumping_images, sprite_delay);
            ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(sprite, x, y, width, height);
            return true;
        }
    }
    gameStart() {
        document.addEventListener("keyup", (e) => {
            if (e.key.includes("w") || e.key.includes(" ")) {
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
                return;
            }
        });
        let sprite_delay = 0;
        GAME_INTERVAL = setInterval(() => {
            var _a, _b;
            const ctx = this._canvas.getContext("2d");
            ctx === null || ctx === void 0 ? void 0 : ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            this.runningMap(ctx);
            if (!IS_DEBUGGING) {
                for (let i = 0; i < this._entities.length; i++) {
                    if ((_a = this._entities[i].entity.getCurrentAnimation()) === null || _a === void 0 ? void 0 : _a.includes("run"))
                        this.runningEntity(this._entities[i], ctx, sprite_delay);
                    else if ((_b = this._entities[i].entity.getCurrentAnimation()) === null || _b === void 0 ? void 0 : _b.startsWith("jump_"))
                        this.jumpingEntity(this._entities[i], ctx, sprite_delay);
                }
                sprite_delay++;
            }
            else {
                for (let i = 0; i < this._entities.length; i++) {
                    const entity = this._entities[i].entity;
                    let x = entity.getX() - 5;
                    let y = entity.getY();
                    if (entity instanceof Player) {
                        if (DEBUG_CURRENT_ANIMATION.startsWith("jump_")) {
                            if (DEBUG_CURRENT_ANIMATION.includes("jump_up")) {
                                if (y >= entity.getOriginalCoord().y - GAME_JUMP_RANGE) {
                                    y--;
                                    entity.setY(y);
                                }
                                else
                                    DEBUG_CURRENT_ANIMATION = "jump_down";
                            }
                            else {
                                if (y < entity.getOriginalCoord().y) {
                                    y++;
                                    entity.setY(y);
                                }
                                else
                                    DEBUG_CURRENT_ANIMATION = "run";
                            }
                        }
                        ctx.fillStyle = entity.getColor();
                        ctx.fillRect(x, y, entity.getWidth(), entity.getHeight());
                    }
                    else {
                        ctx.fillStyle = entity.getColor();
                        ctx.fillRect(x, y, entity.getWidth(), entity.getHeight());
                    }
                }
            }
        }, 1000 / GAME_FPS);
    }
}
class Entity {
    constructor(_originCoord, _animationsPath = { run: [null, null], jump: [null, null] }, _id, _x = _originCoord.x, _y = _originCoord.y, _animationsCounters = { run: 0, jump: 0 }, _currentAnimation = "run", _width = 140, _height = 140) {
        this._originCoord = _originCoord;
        this._animationsPath = _animationsPath;
        this._id = _id;
        this._x = _x;
        this._y = _y;
        this._animationsCounters = _animationsCounters;
        this._currentAnimation = _currentAnimation;
        this._width = _width;
        this._height = _height;
    }
    getAnimationsPath() { return this._animationsPath; }
    getId() { return this._id; }
    getX() { return this._x; }
    setX(value) { this._x = value; }
    getY() { return this._y; }
    setY(value) { this._y = value; }
    getWidth() { return this._width; }
    getHeight() { return this._height; }
    getColor() {
        if (this._id.startsWith("p_"))
            return "blue";
        else
            return "red";
    }
    getCurrentAnimation() { return this._currentAnimation; }
    setCurrentAnimation(name) { this._currentAnimation = name; }
    getRunningAnimationsCount() { return this._animationsPath.run[1]; }
    getJumpingAnimationsCount() { return this._animationsPath.jump[1]; }
    actionRun(canvas, frames, delay) {
        let x = this._x;
        let y = this._y;
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
class Player extends Entity {
    constructor(_originCoord, _animationsPath, _id, _x = _originCoord.x, _y = _originCoord.y, _animationsCounters = { run: 0, jump: 0 }, _currentAnimation = "run", _width = 140, _height = 140) {
        super(_originCoord, _animationsPath, _id, _x, _y, _animationsCounters, _currentAnimation, _width, _height);
    }
    getOriginalCoord() { return this._originCoord; }
    actionJump(canvas, frames, delay) {
        let x = this._x;
        let y = this._y;
        if (x + this._width > canvas.width)
            x = canvas.width - this._width;
        if (y + this._height > canvas.height)
            y = canvas.height - this._height;
        const sprite = frames[this._animationsCounters.jump];
        console.log(this._currentAnimation);
        if (delay % (GAME_FPS / 10) == 0) {
            if (this._animationsCounters.jump >= this.getJumpingAnimationsCount() - 1)
                this._animationsCounters.jump = 0;
            else
                this._animationsCounters.jump++;
        }
        if (this._currentAnimation.includes("jump_up")) {
            if (this._y >= this._originCoord.y - GAME_JUMP_RANGE)
                this._y--;
            else
                this._currentAnimation = "jump_down";
        }
        else if (this._currentAnimation.includes("jump_down")) {
            if (this._y < this._originCoord.y)
                this._y++;
            else {
                this._currentAnimation = "run";
            }
        }
        return [sprite, x, y, this._width, this._height];
    }
}
const gameHelper = new GameHelper();
const player = new Player({ x: 150, y: 470 }, { run: ["./img/santa/", 6], jump: ["./img/santa-jump/", 4] }, "p_santa");
const enemy = new Entity({ x: 5, y: 470 }, { run: ["./img/grinch/", 6], jump: [null, null] }, "e_grinch");
gameHelper.loadMap()
    .then(() => gameHelper.loadEntity(player))
    .then(() => gameHelper.loadEntity(enemy));
gameHelper.gameStart();
