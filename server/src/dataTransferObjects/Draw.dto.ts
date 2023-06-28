import { Position } from "./Position.dto";

export class Draw {
    id: string;
    width: number;
    color: string;
    from: Position;
    to: Position;
}