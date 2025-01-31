import { Entity } from './src/ts/class/Entity/Entity.js';
import { AnimatedEntity } from './src/ts/class/AnimatedEntity/AnimatedEntity.js';
import { Player } from './src/ts/class/Player/Player.js';
import { config } from "./src/ts/config.js"
import * as Interfaces from './src/ts/interface.js';

let GAME_INTERVAL: NodeJS.Timeout

class GameHelper {
  constructor(
    private _canvas?: HTMLCanvasElement, 
    private _body?: HTMLBodyElement,
    private _background: HTMLImageElement = new Image(),
    private _backgroundX: number = 0,
    private _entities:Interfaces.IEntities[] = []
) {
    this._canvas =
      _canvas ??
      (() => {
        let canvas: HTMLCanvasElement | null = document.querySelector("canvas");

        if (!canvas) {
          canvas = document.createElement("canvas");
          canvas.width = window.outerWidth;
          canvas.height = window.outerHeight - 250;
          canvas.id = config.CANVAS_ID;
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
        this._background!.src = new URL("./src/img/background.png", window.location.href).toString();
    
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
    
    const p_images:Promise<HTMLImageElement>[] = []
    const running_images: HTMLImageElement[] = []
    const jumping_images: HTMLImageElement[] = []
    let generating_sprite_images: Interfaces.IGeneratingSpriteImages

    if(entity instanceof AnimatedEntity) {
        for(const [animations_key, [animations_path, animations_frames]] of Object.entries(entity.getAnimationsPath())) {
            if(!animations_path || !animations_frames)
                continue    
            
            const animations_name:string = animations_path.split("/")[3]
            const sprite_path:string = `${animations_path}${animations_name}`

            for(let i = 0; i < animations_frames; i++) {
                p_images.push(
                    new Promise<HTMLImageElement>((resolve, reject) => {
                        const image: HTMLImageElement = new Image()
                        image.src = new URL(`${sprite_path}${i}.png`, window.location.href).toString();
                        image.onload = () => {
                            const scaleX = this._canvas!.width / this._background.width;
                            const scaleY = this._canvas!.height / this._background.height;
                            const scale = Math.max(scaleX, scaleY);
                            let x = entity.getX()
                            let y = entity.getY()

                            if(x === "adaptive") {
                                const bgW = this._background.width * scale
                                x = bgW - (entity.getWidth() + 20) 
                                entity.setX(x)
                            }
                            
                            if(y === "adaptive") {
                                const bgY = this._background.height * scale
                                y = bgY - (entity.getHeight() + 20) 
                                entity.setY(y)
                            }
                            
                            if(animations_key.includes("run") && i === 0)
                                ctx?.drawImage(image, x as number, y as number, entity.getWidth(), entity.getHeight());

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

  private runningEntity(entities: Interfaces.IEntities, ctx: CanvasRenderingContext2D | null, sprite_delay: number):boolean {   
    if(entities.entity instanceof AnimatedEntity) {
        const entity = entities.entity
        
        let [sprite, x, y, width, height] = entity.actionRun(this._canvas!, entities.running_images!, sprite_delay)

        ctx?.drawImage(sprite, x, y, width, height);
        
        return true
    }
    return false
  }

  private jumpingEntity(entities: Interfaces.IEntities, ctx: CanvasRenderingContext2D | null, sprite_delay: number) {
    const entity = entities.entity
    if(entity instanceof Player) {
        let [sprite, x, y, width, height] =  entity.actionJump(this._canvas!, entities.jumping_images!, sprite_delay)

        ctx?.drawImage(sprite, x, y, width, height);
        return true
    }
  }

  private animateEntities(ctx: CanvasRenderingContext2D | null, sprite_delay: number) {
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

  generating(ctx: CanvasRenderingContext2D | null) {
    for(let i = 0; i < this._entities.length; i++) {
        const entity = this._entities[i].entity
        if(entity.constructor.name === "Entity") {
            let x = this._canvas!.width - entity.getWidth() + this._backgroundX;
            let y = entity.getY()
            const scaleX = this._canvas!.width / this._background.width;
            const scaleY = this._canvas!.height / this._background.height;
            const scale = Math.max(scaleX, scaleY);
                
            if(y === "adaptive") {
                const bgY = this._background.height * scale
                y = bgY - (entity.getHeight() + 20) 
                entity.setY(y)
            }

            const image = this._entities[i].generating_sprite_images!.image             
            ctx?.drawImage(image, x, y as number, entity.getWidth(), entity.getHeight());     
            entity.setX(x)
        }
    }
  }
  private event_jump() {
    for(let i = 0; i < this._entities.length; i++) {
        const entity = this._entities[i].entity

        if(entity instanceof Player) {
            if(entity.getCurrentAnimation().startsWith("jump_"))
                return

            entity.setCurrentAnimation("jump_up")
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
    }, 1000 / config.GAME_FPS)
  }
}


const gameHelper = new GameHelper();
const player = new Player("p_santa", { x: 150, y: "adaptive" }, { run: ["./src/img/santa/", 6], jump: ["./src/img/santa-jump/", 4] });
const enemy = new AnimatedEntity("e_grinch", { x: 5, y: "adaptive" }, { run: ["./src/img/grinch/", 6] });
const object = new Entity("o_object_1", { x: 5, y: "adaptive" }, "./src/img/obstacles/A.png", 50, 50);

gameHelper.loadMap()
    .then(() => gameHelper.loadEntity(player))
    .then(() => gameHelper.loadEntity(enemy))
    .then(() => gameHelper.loadEntity(object))


gameHelper.gameStart()

window.addEventListener("resize", () => location.reload() )







