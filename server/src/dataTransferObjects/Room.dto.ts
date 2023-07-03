import { Image } from "canvas";
import { UserRepository } from "src/repositories/user.repository";
import { Draw } from "./Draw.dto";
import { CanvasData } from "./CanvasData.dto";

export class Room {
    canvasList: Map<string, CanvasData>;
    users: UserRepository;

    constructor() {
        this.canvasList = new Map();
        this.canvasList.set("0", new CanvasData({x: 0, y: 0}, 2000, 2000, false));
        this.users = new UserRepository();
        this.canvasList.get("0").ctx.fillStyle = "rgb(255, 255, 255)";
        this.canvasList.get("0").ctx.fillRect(0, 0, 2000, 2000);
    }
    
    getCanvas() {
        let ret = [];
        for (let [key, value] of this.canvasList) {
            ret.push({
                id: key,
                pos: value.pos,
                src: value.canvas.toDataURL(),
                isLayer: value.isLayer
            });
        }
        return ret;
    }

    clear() {
        for (let [key, value] of this.canvasList) {
            value.clear();
        }
        this.canvasList.clear();
        this.canvasList.set("0", new CanvasData({x: 0, y: 0}, 2000, 2000, false));
        this.canvasList.get("0").ctx.fillStyle = "rgb(255, 255, 255)";
        this.canvasList.get("0").ctx.fillRect(0, 0, 2000, 2000);
    }

    updataDraw(draw: Draw) {
        let lastEntry: CanvasData;
        for (let [key, value] of this.canvasList) {
            lastEntry = value;
        }
        lastEntry.updateDraw(draw);
    }

    loadImage(image: string, id1: string, id2: string) {
        let img = new Image();
        img.onload = () => {
            const newCanvas = new CanvasData({x: 0, y: 0}, img.width, img.height, true);
            newCanvas.ctx.drawImage(img, 0, 0, img.width, img.height);
            this.canvasList.set(id1, newCanvas);
            this.canvasList.set(id2, new CanvasData({x: 0, y: 0}, 2000, 2000, false));

            // Event listener 제거
            img.onload = null;
            img.onerror = null;

            // Image 객체 메모리 해제
            img.src = '';
            img = null;
        }
        img.onerror = (error) => {
            console.error('Image loading error: ', error);
            img.onload = null;
            img.onerror = null;
            img.src = '';
            img = null;
        }
        img.src = image;
    }
}