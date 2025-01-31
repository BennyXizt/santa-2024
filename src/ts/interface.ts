import { Entity } from "./class/Entity/Entity.js"
import { AnimatedEntity } from "./class/AnimatedEntity/AnimatedEntity.js"
import { Player } from "./class/Player/Player.js"

export interface IAnimationsPath {
    run?: [string | null, number | null],
    jump?: [string | null, number | null]
}

export interface IGeneratingSpriteImages {
    image: HTMLImageElement,
    x: number,
    y: number
}

export interface IEntities {
    entity: Entity | AnimatedEntity | Player,
    running_images?: HTMLImageElement[] | null,
    jumping_images?: HTMLImageElement[] | null,
    generating_sprite_images?: IGeneratingSpriteImages
    generated?: { image: HTMLImageElement, x: number, y: number}[]
}
