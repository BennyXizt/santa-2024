import { Entity } from "../Entity/Entity.js"
import { AnimatedEntity } from "../AnimatedEntity/AnimatedEntity.js"
import { IAnimationsPath } from "../../interface.js"
import { config } from "../../config.js"

export class Player extends AnimatedEntity {
    constructor(
        _id:string,
        _origin: { x: number | string, y: number | string},
        _animationsPath:IAnimationsPath, 
        _animationsCounters = { run: 0, jump: 0},
        _currentAnimation:string = "run",
        _width:number = 140, 
        _height:number = 140,
        _changedCoord: { x: number | string, y: number | string} = { ..._origin },
    ) {
        super(_id, _origin, _animationsPath, _animationsCounters, _currentAnimation, _width, _height, _changedCoord)
    }

    getOriginalCoord() { return this._origin}

    actionJump(canvas: HTMLCanvasElement, frames: HTMLImageElement[], delay: number): [sprite: HTMLImageElement, x:number, y:number, width:number, height: number] {
        let y = this._changedCoord.y as number

        const sprite: HTMLImageElement = frames[this._animationsCounters.jump]
        
        if(delay % (config.GAME_FPS / 10) == 0) {
            if(this._animationsCounters.jump >= this.getJumpingAnimationsCount()! - 1) 
                this._animationsCounters.jump = 0
            else
                this._animationsCounters.jump++
        }

        if(this._currentAnimation!.includes("jump_up")) {
            
            if(y >= (this._origin.y as number) - config.GAME_JUMP_RANGE)
                y -= config.GAME_JUMPING_SPEED
            else
                this._currentAnimation = "jump_down"
        }
        else if(this._currentAnimation!.includes("jump_down")) {
            if(y < (this._origin.y as number))
                y += config.GAME_JUMPING_SPEED
            else
                this._currentAnimation = "run"
        }
        this.setY(y)
        return [sprite, this._changedCoord.x as number, y as number, this._width, this._height]
    }
    isColliding(entity: Entity) {
        const selfX = this._changedCoord.x as number
        const selfY = this._changedCoord.y as number
        const selfWidth = this._width
        const selfHeight = this._height
        const targetX = entity.getX() as number
        const targetY = entity.getY() as number
        const targetWidth = entity.getWidth()
        const targetHeight = entity.getHeight()
        
        return (
            selfX < targetX + targetWidth &&
            selfX + selfWidth > targetX &&
            selfY < targetY + targetHeight &&
            selfY + selfHeight > targetY
        )
    }

}