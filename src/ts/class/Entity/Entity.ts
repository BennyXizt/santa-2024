export class Entity {
    constructor(
        protected _id:string,
        protected _origin: { x: number | string, y: number | string},
        private _path:string | null,
        protected _width:number = 140, 
        protected _height:number = 140,
    ) {}

    getId() {return this._id}
    getX() { return this._origin.x}
    setX(value: number) { this._origin.x = value} 
    getY() { return this._origin.y}
    setY(value: number) { this._origin.y = value} 
    getWidth() { return this._width}
    getHeight() { return this._height}
    getPath() { return this._path}
}