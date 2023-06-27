import { Injectable } from '@nestjs/common';

@Injectable()
export class ImageRepository {
    imageData: string;

    saveImage(data: string): void {
        this.imageData = data;
    }

    getImage(): string {
        return this.imageData;
    }
}