import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DrawData } from './drawdata.entity';
import { Draw } from './dataTransferObjects/Draw.dto';

@Injectable()
export class DrawRepository {
    constructor(
        @InjectRepository(DrawData)
        private drawRepository: Repository<DrawData>,
    ) {}
    
    async insertData(draw: Draw) {
        
        const drawData = new DrawData();
        drawData.id = draw.id;
        drawData.width = draw.width;
        drawData.color = draw.color;
        drawData.from_x = draw.from.x;
        drawData.from_y = draw.from.y;
        drawData.to_x = draw.to.x;
        drawData.to_y = draw.to.y;
        
        await this.drawRepository.save(drawData);
    }

    async getAllDraw(): Promise<Draw[]> {
        const data = await this.drawRepository.find({
            select: ["id", "width", "color", "from_x", "from_y", "to_x", "to_y"],
        });
        let ret: Draw[] = [];
        data.forEach(d => {
            ret.push({
                id: d.id,
                width: d.width,
                color: d.color,
                from: { x: d.from_x, y: d.from_y },
                to: { x: d.to_x, y: d.to_y }
            });
        });
        
        return ret;
    }
}
