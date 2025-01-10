const CANVAS_ID:string = "gameCanvas";
let IS_DEBUGGING:boolean = false
let DEBUG_CURRENT_ANIMATION:string = "run"
const GAME_FPS:number =  130
const GAME_JUMP_RANGE:number = 160
const GAME_JUMPING_SPEED: number = 3
const GAME_GENERATING_ENTITIES: number = 30
let GAME_INTERVAL: number

interface IGeneratingSpriteImages {
    image: HTMLImageElement,
    x: number,
    y: number
}
interface IEntities {
    entity: Entity | AnimatedEntity | Player,
    running_images?: HTMLImageElement[] | null,
    jumping_images?: HTMLImageElement[] | null,
    generating_sprite_images?: IGeneratingSpriteImages
    generated?: { image: HTMLImageElement, x: number, y: number}[]
}

class GameHelper {
  constructor(
    private _canvas?: HTMLCanvasElement, 
    private _body?: HTMLBodyElement,
    private _background: HTMLImageElement = new Image(),
    private _backgroundX: number = 0,
    private _entities:IEntities[] = []
) {
    this._canvas =
      _canvas ??
      (() => {
        let canvas: HTMLCanvasElement | null = document.querySelector("canvas");

        if (!canvas) {
          canvas = document.createElement("canvas");
          canvas.width = window.outerWidth;
          canvas.height = window.outerHeight - 250;
          canvas.id = CANVAS_ID;
        }
        return canvas;
      })(),

    this._body = _body ?? (() => {
        const body: HTMLBodyElement = document.querySelector("body")!;
        return body
    })()
  }

  loadMap(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        this._body!.append(this._canvas!)
        const ctx: CanvasRenderingContext2D | null = this._canvas!.getContext("2d");
        this._background!.src = new URL("./img/background.png", window.location.href).toString();
    
        this._background!.onload = () => {
          const scaleX:number = this._canvas!.width / this._background!.width
          const scaleY:number = this._canvas!.height / this._background!.height
          const scale:number = Math.max(scaleX, scaleY);

          ctx?.drawImage(this._background!, 0, 0, this._background!.width * scale, this._background!.height * scale);
          resolve(true)
        }
        this._background!.onerror = () => {
            reject(false)
        };  
    })
  }

  loadEntity(entity: Entity): Promise<void> {
    const ctx: CanvasRenderingContext2D | null = this._canvas!.getContext("2d");

    let x:number = entity.getX()
    let y:number = entity.getY();

    if (x + entity.getWidth() > this._canvas!.width) x = this._canvas!.width - entity.getWidth();
    if (y + entity.getHeight() > this._canvas!.height) y = this._canvas!.height - entity.getHeight();
    
    if(!IS_DEBUGGING) {
        const p_images:Promise<HTMLImageElement>[] = []
        const running_images: HTMLImageElement[] = []
        const jumping_images: HTMLImageElement[] = []
        let generating_sprite_images: IGeneratingSpriteImages

        if(entity instanceof AnimatedEntity) {
            for(const [animations_key, [animations_path, animations_frames]] of Object.entries(entity.getAnimationsPath())) {
                if(!animations_path || !animations_frames)
                    continue
    
               
                
                const animations_name:string = animations_path.split("/")[2]
                const sprite_path:string = `${animations_path}${animations_name}`
           
                for(let i = 0; i < animations_frames; i++) {
                    p_images.push(
                        new Promise<HTMLImageElement>((resolve, reject) => {
                            const image: HTMLImageElement = new Image()
                            image.src = new URL(`${sprite_path}${i}.png`, window.location.href).toString();
                            image.onload = () => {
                                if(animations_key.includes("run") && i === 0)
                                    ctx?.drawImage(image, x, y, entity.getWidth(), entity.getHeight());
    
                                if(animations_key.includes("run"))
                                    running_images.push(image)
                                else if(animations_key.includes("jump"))
                                    jumping_images.push(image)
    
                                resolve(image)
                            }
                            image.onerror = () => reject(new Error(`Failed to load image: ${sprite_path}${i}.png`))
                        })
                    )
    
                }  
            }
        }
        else if(entity.constructor.name === "Entity") {
            p_images.push(
                new Promise<HTMLImageElement>((resolve, reject) => {
                    const image: HTMLImageElement = new Image()
                    image.src = new URL(entity.getPath()!, window.location.href).toString();
                    image.onload = () => {
                        generating_sprite_images = {
                            image: image,
                            x: 0,
                            y: 0
                        }
                        resolve(image)
                    }
                    image.onerror = () => reject(new Error(`Failed to load image: ${entity.getPath()}`))
                })
            )
            
        }

        return Promise.all(p_images)
                .then(() => {
                    this._entities.push({
                        entity: entity,
                        running_images: running_images,
                        jumping_images: jumping_images,
                        generating_sprite_images: generating_sprite_images,
                        generated: []
                    })
                })
    }
    else {
        ctx!.fillStyle = entity.getColor(); 
        ctx!.fillRect(x, y, entity.getWidth(), entity.getHeight());

        this._entities.push({
            entity: entity,
        })

        return Promise.resolve()
    }

    
  }

  private runningMap(ctx: CanvasRenderingContext2D | null):boolean {
    const scaleX:number = this._canvas!.width / this._background!.width
    const scaleY:number = this._canvas!.height / this._background!.height
    const scale:number = Math.max(scaleX, scaleY);

    ctx?.drawImage(this._background!, this._backgroundX!, 0, this._background!.width * scale, this._background!.height * scale);
    ctx?.drawImage(this._background!, this._backgroundX! + this._background!.width * scale - 1, 0, this._background!.width * scale, this._background!.height * scale);
    

    if(Math.abs(this._backgroundX!) >= this._background!.width * scale)
        this._backgroundX! = 0
    else
        this._backgroundX! -= 5

    return true
  }

  private runningEntity(entities: IEntities, ctx: CanvasRenderingContext2D | null, sprite_delay: number):boolean {   
    if(entities.entity instanceof AnimatedEntity) {
        const entity = entities.entity
        
        let [sprite, x, y, width, height] = entity.actionRun(this._canvas!, entities.running_images!, sprite_delay)

        ctx?.drawImage(sprite, x, y, width, height);
        
        return true
    }
    return false
  }

  private jumpingEntity(entities: IEntities, ctx: CanvasRenderingContext2D | null, sprite_delay: number) {
    const entity = entities.entity
    if(entity instanceof Player) {
        let [sprite, x, y, width, height] =  entity.actionJump(this._canvas!, entities.jumping_images!, sprite_delay)

        ctx?.drawImage(sprite, x, y, width, height);
        return true
    }
  }

  private animateEntities(ctx: CanvasRenderingContext2D | null, sprite_delay: number) {
    if(!IS_DEBUGGING) {
        for(let i = 0; i < this._entities.length; i++) {
            const entity = this._entities[i].entity
            const player = this._entities.find(e => e.entity instanceof Player)?.entity as Player
            if(entity instanceof AnimatedEntity) {
                if(entity.getCurrentAnimation()?.includes("run"))
                    this.runningEntity(this._entities[i], ctx, sprite_delay)
                else if(entity.getCurrentAnimation()?.startsWith("jump_"))
                    this.jumpingEntity(this._entities[i], ctx, sprite_delay)
            }
            else {
                if(player!.isColliding(entity))
                    clearInterval(GAME_INTERVAL)
            }
            
            
        }
    }
    else {
        for(let i = 0; i < this._entities.length; i++) {
            const entity = this._entities[i].entity
            let x = entity.getX() - 5
            let y = entity.getY();
            
            const player = this._entities.find(e => e.entity instanceof Player)?.entity as Player

            if(entity instanceof Player) {
                if(DEBUG_CURRENT_ANIMATION.startsWith("jump_")) {
                    if(DEBUG_CURRENT_ANIMATION.includes("jump_up")) {
                        if(y >= entity.getOriginalCoord().y - GAME_JUMP_RANGE)
                            entity.setY(y -= 1)
                        else
                            DEBUG_CURRENT_ANIMATION = "jump_down"
                    }
                    else {
                        if(y < entity.getOriginalCoord().y)
                            entity.setY(y += 1)
                        else
                            DEBUG_CURRENT_ANIMATION = "run"
                    }
                }

                ctx!.fillStyle = entity.getColor(); 
                ctx!.fillRect(x, y, entity.getWidth(), entity.getHeight());
            }
            else if(entity.constructor.name === "AnimatedEntity") {
                ctx!.fillStyle = entity.getColor(); 
                ctx!.fillRect(x, y, entity.getWidth(), entity.getHeight());
            }
            else {
                if(player!.isColliding(entity))
                    clearInterval(GAME_INTERVAL)
            }
            
        }
    } 
  }

  generating(ctx: CanvasRenderingContext2D | null) {

    
    for(let i = 0; i < this._entities.length; i++) {
        const entity = this._entities[i].entity
        if(entity.constructor.name === "Entity") {
            const x = this._canvas!.width - entity.getWidth() + this._backgroundX
            const y = entity.getY()

            if(!IS_DEBUGGING) {
                const image = this._entities[i].generating_sprite_images!.image             
                ctx?.drawImage(image, x, y, entity.getWidth(), entity.getHeight());         
            }
            else {
                ctx!.fillStyle = entity.getColor(); 
                ctx!.fillRect(x, y, entity.getWidth(), entity.getHeight());
            }
            entity.setX(x)
        }
    }
  }
  private event_jump() {
    for(let i = 0; i < this._entities.length; i++) {
        const entity = this._entities[i].entity

        if(entity instanceof Player) {
            if(!IS_DEBUGGING) {
                if(entity.getCurrentAnimation().startsWith("jump_"))
                    return

                entity.setCurrentAnimation("jump_up")
            }
                
            else {
                if(DEBUG_CURRENT_ANIMATION.startsWith("jump_"))
                    return

                DEBUG_CURRENT_ANIMATION = "jump_up"
            }
        }
        
    }
  }
  gameStart() {
    const ctx: CanvasRenderingContext2D | null = this._canvas!.getContext("2d");

    

    document.addEventListener("keyup", (e) => {
        if(e.key.includes("w") || e.key.includes(" ")) {
            this.event_jump()
        }
    })

    document.addEventListener('touchstart', (e) => {
        this.event_jump()
    });
    let sprite_delay:number = 0
    GAME_INTERVAL = setInterval(() => {
        ctx?.clearRect(0, 0, this._canvas!.width, this._canvas!.height);
        
        
        this.runningMap(ctx)
        this.animateEntities(ctx, sprite_delay)
        this.generating(ctx)

        sprite_delay++
    }, 1000 / GAME_FPS)
  }
}

interface IAnimationsPath {
    run?: [string | null, number | null],
    jump?: [string | null, number | null]
}

class Entity {
    constructor(
        protected _id:string,
        protected _origin: { x: number, y: number},
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
    getColor() { 
        if(this instanceof Player)
            return "blue"
        else if(this instanceof AnimatedEntity)
            return "red"
        else
            return "yellow"
    }
}

class AnimatedEntity extends Entity {
    constructor (
        _id:string,
        _origin: { x: number, y: number},
        protected _animationsPath:IAnimationsPath = { run: [null, null], jump: [null, null]},
        protected _animationsCounters = { run: 0, jump: 0},
        protected _currentAnimation:string = "run",
        _width:number = 140, 
        _height:number = 140,
        protected _changedCoord: { x: number, y: number} = { ..._origin },
    ) {
        super(_id, _origin, null, _width, _height)
    }

    getX() { return this._changedCoord.x}
    setX(value: number) { this._changedCoord.x = value} 
    getY() { return this._changedCoord.y}
    setY(value: number) { this._changedCoord.y = value} 
    getAnimationsPath() { return this._animationsPath}
    getCurrentAnimation() { return this._currentAnimation}
    setCurrentAnimation(name:string) { this._currentAnimation = name }
    getRunningAnimationsCount() {return this._animationsPath?.run?.[1]}
    getJumpingAnimationsCount() {return this._animationsPath?.jump?.[1]}
    actionRun(canvas: HTMLCanvasElement, frames: HTMLImageElement[], delay: number): [sprite: HTMLImageElement, x:number, y:number, width:number, height: number] {
        let x = this._changedCoord.x
        let y = this._changedCoord.y

        if (x + this._width > canvas.width) 
            x = canvas.width - this._width;
        if (y + this._height > canvas.height) 
            y = canvas.height - this._height;

        const sprite: HTMLImageElement = frames[this._animationsCounters.run]

        if(delay % (GAME_FPS / 10) == 0) {
            if(this._animationsCounters.run >= this.getRunningAnimationsCount()! - 1) 
                this._animationsCounters.run = 0
            else
                this._animationsCounters.run++
        }

        return [sprite, x, y, this._width, this._height]
    }
}

class Player extends AnimatedEntity {
    constructor(
        _id:string,
        _origin: { x: number, y: number},
        _animationsPath:IAnimationsPath, 
        _animationsCounters = { run: 0, jump: 0},
        _currentAnimation:string = "run",
        _width:number = 140, 
        _height:number = 140,
        _changedCoord: { x: number, y: number} = { ..._origin },
    ) {
        super(_id, _origin, _animationsPath, _animationsCounters, _currentAnimation, _width, _height, _changedCoord)
    }

    getOriginalCoord() { return this._origin}

    actionJump(canvas: HTMLCanvasElement, frames: HTMLImageElement[], delay: number): [sprite: HTMLImageElement, x:number, y:number, width:number, height: number] {
        let x = this._changedCoord.x
        let y = this._changedCoord.y

        if (x + this._width > canvas.width) 
            x = canvas.width - this._width;
        if (y + this._height > canvas.height) 
            y = canvas.height - this._height;

        const sprite: HTMLImageElement = frames[this._animationsCounters.jump]
        
        if(delay % (GAME_FPS / 10) == 0) {
            if(this._animationsCounters.jump >= this.getJumpingAnimationsCount()! - 1) 
                this._animationsCounters.jump = 0
            else
                this._animationsCounters.jump++
        }

        if(this._currentAnimation!.includes("jump_up")) {
            
            if(this._changedCoord.y >= this._origin.y - GAME_JUMP_RANGE)
                this._changedCoord.y -= GAME_JUMPING_SPEED
            else
                this._currentAnimation = "jump_down"
        }
        else if(this._currentAnimation!.includes("jump_down")) {
            if(this._changedCoord.y < this._origin.y)
                this._changedCoord.y += GAME_JUMPING_SPEED
            else
                this._currentAnimation = "run"
        }
        
        return [sprite, x, y, this._width, this._height]
    }
    isColliding(entity: Entity) {
        const selfX = this._changedCoord.x
        const selfY = this._changedCoord.y
        const selfWidth = this._width
        const selfHeight = this._height
        const targetX = entity.getX()
        const targetY = entity.getY()
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

const gameHelper = new GameHelper();
const player = new Player("p_santa", { x: 150, y: 470}, {run: ["./img/santa/", 6], jump: ["./img/santa-jump/", 4]} );
const enemy = new AnimatedEntity("e_grinch", { x: 5, y: 470}, {run: ["./img/grinch/", 6] } );
const object = new Entity("o_object_1", { x: 5, y: 560}, "./img/obstacles/A.png", 50, 50);

gameHelper.loadMap()
    .then(() => gameHelper.loadEntity(player))
    .then(() => gameHelper.loadEntity(enemy))
    .then(() => gameHelper.loadEntity(object))


gameHelper.gameStart()







