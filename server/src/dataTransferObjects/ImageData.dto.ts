import { Position } from "./Position.dto";
import { UserData } from "./UserData.dto";

export class ImageData {
    src: string;
    uploader: UserData;
    zIndex: number;
    pos: Position;
    width: number;
    height: number;
}