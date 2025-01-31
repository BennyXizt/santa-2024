export class Entity {
    constructor(_id, _origin, _path, _width = 140, _height = 140) {
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
}
