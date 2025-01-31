import { Entity } from '../Entity/Entity.js';
import { IAnimationsPath } from "../../interface.js"
import { config } from "../../config.js"

export class AnimatedEntity extends Entity {
    constructor (
        _id:string,
        _origin: { x: number | string, y: number | string},
        protected _animationsPath:IAnimationsPath = { run: [null, null], jump: [null, null]},
        protected _animationsCounters = { run: 0, jump: 0},
        protected _currentAnimation:string = "run",
        _width:number = 140, 
        _height:number = 140,
        protected _changedCoord: { x: number | string, y: number | string} = { ..._origin },
    ) {
        super(_id, _origin, null, _width, _height)
    }

    getX() { return this._origin.x === "adaptive" ? this._origin.x : this._changedCoord.x }
    setX(value: number) { this._origin.x === "adaptive" ? this._origin.x = value : this._changedCoord.x = value  }
    getY() { return this._origin.y === "adaptive" ? this._origin.y : this._changedCoord.y }
    setY(value: number) { this._origin.y === "adaptive" ? this._origin.y = value : this._changedCoord.y = value; }
    getAnimationsPath() { return this._animationsPath}
    getCurrentAnimation() { return this._currentAnimation}
    setCurrentAnimation(name:string) { this._currentAnimation = name }
    getRunningAnimationsCount() {return this._animationsPath?.run?.[1]}
    getJumpingAnimationsCount() {return this._animationsPath?.jump?.[1]}
    actionRun(canvas: HTMLCanvasElement, frames: HTMLImageElement[], delay: number): [sprite: HTMLImageElement, x:number, y:number, width:number, height: number] {
        let x = this._changedCoord.x as number
        let y = this._changedCoord.y as number

        const sprite: HTMLImageElement = frames[this._animationsCounters.run]

        if(delay % (config.GAME_FPS / 10) == 0) {
            if(this._animationsCounters.run >= this.getRunningAnimationsCount()! - 1) 
                this._animationsCounters.run = 0
            else
                this._animationsCounters.run++
        }

        return [sprite, x, y, this._width, this._height]
    }
}