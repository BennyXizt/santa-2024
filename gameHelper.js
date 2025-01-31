import { Entity } from './src/ts/class/Entity/Entity.js';
import { AnimatedEntity } from './src/ts/class/AnimatedEntity/AnimatedEntity.js';
import { Player } from './src/ts/class/Player/Player.js';
import { config } from "./src/ts/config.js";
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
                    canvas.id = config.CANVAS_ID;
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
            this._background.src = new URL("./src/img/background.png", window.location.href).toString();
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
        const p_images = [];
        const running_images = [];
        const jumping_images = [];
        let generating_sprite_images;
        if (entity instanceof AnimatedEntity) {
            for (const [animations_key, [animations_path, animations_frames]] of Object.entries(entity.getAnimationsPath())) {
                if (!animations_path || !animations_frames)
                    continue;
                const animations_name = animations_path.split("/")[3];
                const sprite_path = `${animations_path}${animations_name}`;
                for (let i = 0; i < animations_frames; i++) {
                    p_images.push(new Promise((resolve, reject) => {
                        const image = new Image();
                        image.src = new URL(`${sprite_path}${i}.png`, window.location.href).toString();
                        image.onload = () => {
                            const scaleX = this._canvas.width / this._background.width;
                            const scaleY = this._canvas.height / this._background.height;
                            const scale = Math.max(scaleX, scaleY);
                            let x = entity.getX();
                            let y = entity.getY();
                            if (x === "adaptive") {
                                const bgW = this._background.width * scale;
                                x = bgW - (entity.getWidth() + 20);
                                entity.setX(x);
                            }
                            if (y === "adaptive") {
                                const bgY = this._background.height * scale;
                                y = bgY - (entity.getHeight() + 20);
                                entity.setY(y);
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
        var _a, _b, _c;
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
    generating(ctx) {
        for (let i = 0; i < this._entities.length; i++) {
            const entity = this._entities[i].entity;
            if (entity.constructor.name === "Entity") {
                let x = this._canvas.width - entity.getWidth() + this._backgroundX;
                let y = entity.getY();
                const scaleX = this._canvas.width / this._background.width;
                const scaleY = this._canvas.height / this._background.height;
                const scale = Math.max(scaleX, scaleY);
                if (y === "adaptive") {
                    const bgY = this._background.height * scale;
                    y = bgY - (entity.getHeight() + 20);
                    entity.setY(y);
                }
                const image = this._entities[i].generating_sprite_images.image;
                ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(image, x, y, entity.getWidth(), entity.getHeight());
                entity.setX(x);
            }
        }
    }
    event_jump() {
        for (let i = 0; i < this._entities.length; i++) {
            const entity = this._entities[i].entity;
            if (entity instanceof Player) {
                if (entity.getCurrentAnimation().startsWith("jump_"))
                    return;
                entity.setCurrentAnimation("jump_up");
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
        }, 1000 / config.GAME_FPS);
    }
}
const gameHelper = new GameHelper();
const player = new Player("p_santa", { x: 150, y: "adaptive" }, { run: ["./src/img/santa/", 6], jump: ["./src/img/santa-jump/", 4] });
const enemy = new AnimatedEntity("e_grinch", { x: 5, y: "adaptive" }, { run: ["./src/img/grinch/", 6] });
const object = new Entity("o_object_1", { x: 5, y: "adaptive" }, "./src/img/obstacles/A.png", 50, 50);
gameHelper.loadMap()
    .then(() => gameHelper.loadEntity(player))
    .then(() => gameHelper.loadEntity(enemy))
    .then(() => gameHelper.loadEntity(object));
gameHelper.gameStart();
window.addEventListener("resize", () => location.reload());
