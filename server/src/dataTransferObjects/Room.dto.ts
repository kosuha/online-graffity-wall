import { Canvas, Image, createCanvas } from "canvas";
import { UserRepository } from "src/repositories/user.repository";
import { Draw } from "./Draw.dto";
import { ImageData } from "./ImageData.dto";
import { CanvasData } from "./CanvasData.dto";
import { UserData } from "./UserData.dto";

export class Room {
    canvasList: CanvasData[];
    users: UserRepository;

    constructor() {
        this.canvasList = [new CanvasData({x: 0, y: 0}, 2000, 2000)];
        this.users = new UserRepository();
        this.canvasList[0].ctx.fillStyle = "rgb(255, 255, 255)";
        this.canvasList[0].ctx.fillRect(0, 0, this.canvasList[0].width, this.canvasList[0].height);
    }
    
    getCanvas() {
        let ret = [];
        for (let i = 0; i < this.canvasList.length; i++) {
            ret.push({
                pos: this.canvasList[i].pos,
                src: this.canvasList[i].canvas.toDataURL(),
            });
        }
        return ret;
    }

    clear() {
        for (let i = 0; i < this.canvasList.length; i++) {
            this.canvasList[i].clear();
        }
        this.canvasList = [new CanvasData({x: 0, y: 0}, 2000, 2000)];
        this.canvasList[0].ctx.fillStyle = "rgb(255, 255, 255)";
        this.canvasList[0].ctx.fillRect(0, 0, this.canvasList[0].canvas.width, this.canvasList[0].canvas.height);
    }

    updataDraw(draw: Draw) {
        this.canvasList[this.canvasList.length - 1].updateDraw(draw);
    }

    loadImage(image: string) {
        const img = new Image();
        img.onload = () => {
            const newCanvas = new CanvasData({x: 0, y: 0}, img.width, img.height);
            newCanvas.ctx.drawImage(img, 0, 0, img.width, img.height);
            this.canvasList.push(newCanvas);
            this.canvasList.push(new CanvasData({x: 0, y: 0}, img.width, img.height));
        }
        img.src = image;

    }
}