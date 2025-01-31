import { Entity } from '../Entity/Entity.js';
import { config } from "../../config.js";
export class AnimatedEntity extends Entity {
    constructor(_id, _origin, _animationsPath = { run: [null, null], jump: [null, null] }, _animationsCounters = { run: 0, jump: 0 }, _currentAnimation = "run", _width = 140, _height = 140, _changedCoord = Object.assign({}, _origin)) {
        super(_id, _origin, null, _width, _height);
        this._animationsPath = _animationsPath;
        this._animationsCounters = _animationsCounters;
        this._currentAnimation = _currentAnimation;
        this._changedCoord = _changedCoord;
    }
    getX() { return this._origin.x === "adaptive" ? this._origin.x : this._changedCoord.x; }
    setX(value) { this._origin.x === "adaptive" ? this._origin.x = value : this._changedCoord.x = value; }
    getY() { return this._origin.y === "adaptive" ? this._origin.y : this._changedCoord.y; }
    setY(value) { this._origin.y === "adaptive" ? this._origin.y = value : this._changedCoord.y = value; }
    getAnimationsPath() { return this._animationsPath; }
    getCurrentAnimation() { return this._currentAnimation; }
    setCurrentAnimation(name) { this._currentAnimation = name; }
    getRunningAnimationsCount() { var _a, _b; return (_b = (_a = this._animationsPath) === null || _a === void 0 ? void 0 : _a.run) === null || _b === void 0 ? void 0 : _b[1]; }
    getJumpingAnimationsCount() { var _a, _b; return (_b = (_a = this._animationsPath) === null || _a === void 0 ? void 0 : _a.jump) === null || _b === void 0 ? void 0 : _b[1]; }
    actionRun(canvas, frames, delay) {
        let x = this._changedCoord.x;
        let y = this._changedCoord.y;
        const sprite = frames[this._animationsCounters.run];
        if (delay % (config.GAME_FPS / 10) == 0) {
            if (this._animationsCounters.run >= this.getRunningAnimationsCount() - 1)
                this._animationsCounters.run = 0;
            else
                this._animationsCounters.run++;
        }
        return [sprite, x, y, this._width, this._height];
    }
}
