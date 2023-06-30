import { Canvas, createCanvas } from "canvas";
import { UserRepository } from "src/repositories/user.repository";
import { Draw } from "./Draw.dto";

export class Room {
    canvas: Canvas = createCanvas(2000, 2000);
    ctx: any = this.canvas.getContext('2d');
    users: UserRepository = new UserRepository();

    updateDraw(draw: Draw) {
        if (draw.from.x === draw.to.x && draw.from.y === draw.to.y) {
            this.ctx.beginPath();
            this.ctx.arc(draw.from.x, draw.from.y, draw.width / 2, 0, Math.PI * 2);
            this.ctx.fillStyle = draw.color;
            this.ctx.fill();
            this.ctx.closePath();
        } else {
            this.ctx.beginPath();
            this.ctx.lineJoin = 'round';
            this.ctx.lineCap = 'round';
            this.ctx.lineWidth = draw.width;
            this.ctx.strokeStyle = draw.color;
            this.ctx.moveTo(draw.from.x, draw.from.y);
            this.ctx.lineTo(draw.to.x, draw.to.y);
            this.ctx.stroke();
        }
    }

    getImage() {
        return this.canvas.toDataURL();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}