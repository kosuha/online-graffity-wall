import { Canvas, createCanvas } from "canvas";
import { Draw } from "./Draw.dto";
import { Position } from "./Position.dto";

export class CanvasData {
    pos: Position;
    width: number;
    height: number;
    canvas: Canvas;
    ctx: any;

    constructor (pos: Position, width: number, height: number) {
        this.pos = pos;
        this.width = width;
        this.height = height;
        this.canvas = createCanvas(width, height);
        this.ctx = this.canvas.getContext("2d");
    }

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

    getCanvas() {
        return this.canvas.toDataURL();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}