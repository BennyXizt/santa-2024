import { AnimatedEntity } from "../AnimatedEntity/AnimatedEntity.js";
import { config } from "../../config.js";
export class Player extends AnimatedEntity {
    constructor(_id, _origin, _animationsPath, _animationsCounters = { run: 0, jump: 0 }, _currentAnimation = "run", _width = 140, _height = 140, _changedCoord = Object.assign({}, _origin)) {
        super(_id, _origin, _animationsPath, _animationsCounters, _currentAnimation, _width, _height, _changedCoord);
    }
    getOriginalCoord() { return this._origin; }
    actionJump(canvas, frames, delay) {
        let y = this._changedCoord.y;
        const sprite = frames[this._animationsCounters.jump];
        if (delay % (config.GAME_FPS / 10) == 0) {
            if (this._animationsCounters.jump >= this.getJumpingAnimationsCount() - 1)
                this._animationsCounters.jump = 0;
            else
                this._animationsCounters.jump++;
        }
        if (this._currentAnimation.includes("jump_up")) {
            if (y >= this._origin.y - config.GAME_JUMP_RANGE)
                y -= config.GAME_JUMPING_SPEED;
            else
                this._currentAnimation = "jump_down";
        }
        else if (this._currentAnimation.includes("jump_down")) {
            if (y < this._origin.y)
                y += config.GAME_JUMPING_SPEED;
            else
                this._currentAnimation = "run";
        }
        this.setY(y);
        return [sprite, this._changedCoord.x, y, this._width, this._height];
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
