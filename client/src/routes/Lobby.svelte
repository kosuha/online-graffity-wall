<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { socketStore } from "../store";
    import { nanoid } from 'nanoid';

    interface UserData {
        id: string;
        pos: Position;
        isDrawing: boolean;
        color: string;
        width: number;
    }

    interface Position {
        x: number;
        y: number;
    }

    interface Draw {
        id: string;
        width: number;
        color: string;
        from: Position;
        to: Position;
    }
    
    let canvasBox: HTMLDivElement;
    let canvas: HTMLCanvasElement;
    let context: CanvasRenderingContext2D;
    let canvasMouse: HTMLCanvasElement;
    let contextMouse: CanvasRenderingContext2D;

    let myData: UserData = {
        id: $socketStore.id,
        pos: { x: 0, y: 0 },
        isDrawing: false,
        color: "#000000",
        width: 1
    };
    let users: UserData[] = [];
    let drawingOn: boolean = false;
    let isDown: boolean = false;
    const roomId: string = "lobby";
    let intervalId;
    let seletedTool: string = "move-tool";
    let preSeletedTool: string = "move-tool";

    onMount(() => {
        getUsers();
        getImage();
        
        canvasBox = document.getElementById("canvas-box") as HTMLDivElement;
        canvas = document.getElementById("canvas") as HTMLCanvasElement;
        canvasMouse = document.getElementById("canvas-mouse") as HTMLCanvasElement;
        context = canvas.getContext("2d") as CanvasRenderingContext2D;
        contextMouse = canvasMouse.getContext("2d") as CanvasRenderingContext2D;
        
        canvasMouse.addEventListener("mousedown", mouseDownEvent);
        canvasMouse.addEventListener("mousemove", mouseMoveEvent);
        canvasMouse.addEventListener("mouseup", mouseUpEvent);
        canvasMouse.addEventListener("mouseleave", mouseUpEvent);
        canvasMouse.addEventListener("mouseout", mouseUpEvent);
        
        canvasMouse.addEventListener("touchstart", touchStartEvent);
        canvasMouse.addEventListener("touchmove", touchMoveEvent);
        canvasMouse.addEventListener("touchend", touchEndEvent);
        canvasMouse.addEventListener("touchcancle", touchEndEvent);

        document.body.addEventListener('keydown', keydownEvent);
        document.body.addEventListener('keyup', keyupEvent);
        
        $socketStore.on("join", (data: UserData) => {
            users.push(data);
        })

        $socketStore.on("disconnected", (id: string) => {
            users = users.filter(user => user.id !== id);
        })

        $socketStore.on("leave", (id: string) => {
            users = users.filter(user => user.id !== id);
        })

        $socketStore.on("mousemove", (data: any) => {
            if (data.draw !== undefined) {
                drawLine(data.draw);
            }
            for (let i = 0; i < users.length; i++) {
                if (users[i].id === data.user.id) {
                    users[i] = data.user;
                    return ;
                }
            }
        })

        intervalId = setInterval(drawMouse, 0.1);
    });

    onDestroy(() => {
        clearInterval(intervalId);
        $socketStore.emit("leave", { roomId, user: myData });
    });

    // 마우스 그리기
    const drawMouse = () => {
        contextMouse.clearRect(0, 0, canvasMouse.width, canvasMouse.height);
        users.forEach(user => {
            contextMouse.beginPath()
            contextMouse.arc(user.pos.x, user.pos.y, 5, 0, Math.PI * 2);
            contextMouse.strokeStyle = "black";
            contextMouse.lineWidth = 3;
            contextMouse.stroke();
            contextMouse.closePath();
            
        });
        if (seletedTool === "brush-tool") {
            contextMouse.beginPath()
            contextMouse.arc(myData.pos.x, myData.pos.y, myData.width / 2, 0, Math.PI * 2);
            contextMouse.fillStyle = myData.color;
            contextMouse.fill();
            contextMouse.closePath();
        }
    }

    const mouseDownEvent = (e: MouseEvent) => {
        e.preventDefault();

        const data: UserData = {
            id: $socketStore.id,
            pos: {
                x: e.clientX - canvasBox.offsetLeft + window.scrollX,
                y: e.clientY - canvasBox.offsetTop + window.scrollY
            },
            isDrawing: myData.isDrawing,
            color: myData.color,
            width: myData.width
        }

        if (seletedTool === "move-tool") {
            isDown = true;
        }

        if (drawingOn && seletedTool === "brush-tool") {
            data.isDrawing = true;

            const draw: Draw = {
                id: myData.id,
                width: myData.width,
                color: myData.color,
                from: {
                    x: e.clientX - canvasBox.offsetLeft + window.scrollX,
                    y: e.clientY - canvasBox.offsetTop + window.scrollY
                },
                to: {
                    x: e.clientX - canvasBox.offsetLeft + window.scrollX,
                    y: e.clientY - canvasBox.offsetTop + window.scrollY
                }
            }
    
            drawLine(draw);
            $socketStore.emit("mousemove", { roomId: roomId, user: data, draw: draw });
        }
        myData = data;
    }

    const mouseUpEvent = (e: MouseEvent) => {
        e.preventDefault();
        isDown = false;
        myData.isDrawing = false;
    }

    const mouseMoveEvent = (e: MouseEvent) => {
        e.preventDefault();

        if (seletedTool === "move-tool" && isDown) {
            canvasBox.style.left = `${canvasBox.offsetLeft + (e.clientX - canvasBox.offsetLeft) - myData.pos.x}px`;
            canvasBox.style.top = `${canvasBox.offsetTop + (e.clientY - canvasBox.offsetTop) - myData.pos.y}px`;
        }

        const data: UserData = {
            id: $socketStore.id,
            pos: {
                x: e.clientX - canvasBox.offsetLeft + window.scrollX,
                y: e.clientY - canvasBox.offsetTop + window.scrollY
            },
            isDrawing: myData.isDrawing,
            color: myData.color,
            width: myData.width
        }

        if (myData.isDrawing && drawingOn) {
            const draw: Draw = {
                id: myData.id,
                width: myData.width,
                color: myData.color,
                from: { x: myData.pos.x, y: myData.pos.y },
                to: {
                    x: e.clientX - canvasBox.offsetLeft + window.scrollX, 
                    y: e.clientY - canvasBox.offsetTop + window.scrollY
                }
            }
            drawLine(draw);
            $socketStore.emit("mousemove", { roomId: roomId, user: data, draw: draw });
        } else {
            $socketStore.emit("mousemove", { roomId: roomId, user: data, draw: undefined });
        }
        myData = data;
    }

    // touch

    const touchStartEvent = (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];

        const data: UserData = {
            id: $socketStore.id,
            pos: {
                x: touch.clientX - canvasBox.offsetLeft + window.scrollX,
                y: touch.clientY - canvasBox.offsetTop + window.scrollY
            },
            isDrawing: myData.isDrawing,
            color: myData.color,
            width: myData.width
        }

        if (seletedTool === "move-tool") {
            isDown = true;
        }

        if (drawingOn && seletedTool === "brush-tool") {
            data.isDrawing = true;

            const draw: Draw = {
                id: myData.id,
                width: myData.width,
                color: myData.color,
                from: {
                    x: touch.clientX - canvasBox.offsetLeft + window.scrollX,
                    y: touch.clientY - canvasBox.offsetTop + window.scrollY
                },
                to: {
                    x: touch.clientX - canvasBox.offsetLeft + window.scrollX,
                    y: touch.clientY - canvasBox.offsetTop + window.scrollY
                }
            }
            drawLine(draw);
            $socketStore.emit("mousemove", { roomId: roomId, user: data, draw: draw });
        }
        myData = data;
        console.log(myData.isDrawing);
    }

    const touchEndEvent = (e: TouchEvent) => {
        e.preventDefault();
        isDown = false;
        myData.isDrawing = false;
        console.log("end");
        
    }

    const touchMoveEvent = (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];

        if (seletedTool === "move-tool" && isDown) {
            canvasBox.style.left = `${canvasBox.offsetLeft + (touch.clientX - canvasBox.offsetLeft) - myData.pos.x}px`;
            canvasBox.style.top = `${canvasBox.offsetTop + (touch.clientY - canvasBox.offsetTop) - myData.pos.y}px`;
        }

        const data: UserData = {
            id: $socketStore.id,
            pos: {
                x: touch.clientX - canvasBox.offsetLeft + window.scrollX,
                y: touch.clientY - canvasBox.offsetTop + window.scrollY
            },
            isDrawing: myData.isDrawing,
            color: myData.color,
            width: myData.width
        }

        if (myData.isDrawing && drawingOn) {
            const draw: Draw = {
                id: myData.id,
                width: myData.width,
                color: myData.color,
                from: { x: myData.pos.x, y: myData.pos.y },
                to: {
                    x: touch.clientX - canvasBox.offsetLeft + window.scrollX, 
                    y: touch.clientY - canvasBox.offsetTop + window.scrollY
                }
            }
            drawLine(draw);
            $socketStore.emit("mousemove", { roomId: roomId, user: data, draw: draw });
        } else {
            $socketStore.emit("mousemove", { roomId: roomId, user: data, draw: undefined });
        }
        myData = data;
    }

    const getImage = () => {
        fetch('/image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: roomId,
            })
        })
        .then(response => response.json())
        .then((data) => {
            if (data.image !== undefined) {
                let img = new Image();
                img.onload = function() {
                    context.drawImage(img, 0, 0);
                };
                img.src = data.image;
            }
            drawingOn = true;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    const getUsers = () => {
        fetch('/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: roomId,
            })
        })
        .then(response => response.json())
        .then((data) => {
            users = data.users as UserData[];
            if (users === undefined) {
                users = [];
            }
            $socketStore.emit("join", {roomId, user: myData});
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    const colorButtonEvent = () => {
        const picker = document.getElementById("color-picker") as HTMLInputElement;
        picker.click();
    };

    const drawLine = (draw: Draw) => {
        if (draw.from.x === draw.to.x && draw.from.y === draw.to.y) {
            context.beginPath()
            context.arc(draw.from.x, draw.from.y, draw.width / 2, 0, Math.PI * 2);
            context.fillStyle = draw.color;
            context.fill();
            context.closePath();
        } else {
            context.beginPath()
            context.lineJoin = 'round';
            context.lineCap = 'round';
            context.lineWidth = draw.width;
            context.strokeStyle = draw.color;
            context.moveTo(draw.from.x, draw.from.y);
            context.lineTo(draw.to.x, draw.to.y);
            context.stroke();
        }
    }

    const newBoardButtonEvent = () => {
        window.open(`/#/board?id=${nanoid()}`);
    };

    const saveEvent = () => {
        const a = document.createElement("a") as HTMLAnchorElement;
        a.href = canvas.toDataURL();
        a.download = "doodle.png";
        a.click();
        a.remove();
    }

    const toolButtonEvent = (e: any) => {
        seletedTool = e.target.id;

        if (seletedTool === "select-tool") {
            canvasMouse.style.cursor = "pointer";
        } else if (seletedTool === "move-tool") {
            canvasMouse.style.cursor = "move";
        } else if (seletedTool === "brush-tool") {
            canvasMouse.style.cursor = "crosshair";
        }
    }

    const keydownEvent = (e) => {
        if (e.key === ' ') {
            e.preventDefault();
            if (seletedTool !== "move-tool") {
                preSeletedTool = seletedTool;
                seletedTool = "move-tool";
                canvasMouse.style.cursor = "move";
            }
        }
    }

    const keyupEvent = (e) => {
        if (e.key === ' ' && seletedTool === "move-tool") {
            seletedTool = preSeletedTool;
            if (seletedTool === "select-tool") {
                canvasMouse.style.cursor = "pointer";
            } else if (seletedTool === "move-tool") {
                canvasMouse.style.cursor = "move";
            } else if (seletedTool === "brush-tool") {
                canvasMouse.style.cursor = "crosshair";
            }
        }
    }

</script>

<div id="canvas-box">
    <canvas id="canvas-mouse" bind:this={canvasMouse} width="2000" height="2000"></canvas>
    <canvas id="canvas" bind:this={canvas} width="2000" height="2000"></canvas>
</div>

<div id="tools">
    <button id="move-tool" on:click={toolButtonEvent}>
        Move
    </button>
    <button id="brush-tool" on:click={toolButtonEvent}>
        Brush
    </button>
    <div id="brush-set">
        <div id="color-box">
            <button id="color-picker-button" on:click={colorButtonEvent} style="background-color: {myData.color};"></button>
            <input id="color-picker" type="color" bind:value={myData.color} />
        </div>
        <input id="range" type="range" min=1 max=200 bind:value={myData.width} style="accent-color: {myData.color};">
    </div>
</div>
<div id="menu">
    <button id="new-board" on:click={newBoardButtonEvent}>New Board</button>
    <button id="save" on:click={saveEvent}>Save</button>
</div>


<style>
    #canvas-box {
        position: absolute;
        top: 0;
        left: 0;
        margin: 0px;
    }

    #canvas, #canvas-mouse {
        position: absolute;
        top: 0;
        left: 0;
        margin: 0px;
        box-sizing: border-box;
    }

    #canvas {
        border: 1px solid rgba(0, 0, 0, 0.5);
        z-index: 0;
    }

    #canvas-mouse {
        background-color: rgba(255, 255, 255, 0);
        z-index: 99999999;
        cursor: move;
    }

    #menu, #tools {
        margin: 5px;
    }

    #menu {
        position: fixed;
        top: 0px;
        right: 0px;
        z-index: 100000000;
        display: flex;
        flex-direction: row;
        padding-right: 10px;
    }

    #tools {
        position: fixed;
        top: 0px;
        left: 0px;
        z-index: 100000000;
        
        display: flex;
        flex-direction: row;
        align-content: center;
        align-items: center;
    }

    #tools > button {
        height: 40px;
        margin-right: 5px;
        border-radius: 10px;
    }

    #brush-set {
        background-color: rgba(47, 47, 47, 0.5);
        border: 1px solid black;
        padding: 10px;
        margin-right: 10px;
        border-radius: 10px;
        display: flex;
        flex-direction: row;
        align-content: center;
        align-items: center;
        height: 40px;
    }

    #menu > button {
        margin-right: 5px;
        border-radius: 500px;
        padding-left: 10px;
        padding-right: 10px;
        border: 1px solid black;
    }

    #menu > button:hover {
        margin-right: 5px;
        border-radius: 500px;
        padding-left: 10px;
        padding-right: 10px;
        border: 1px solid blue;
        color: blue;
    }

    #color-picker-button {
        position: relative;
        width: 30px;
        height: 30px;
        border-radius: 500px;
        border: none;
        padding: 1px;
        margin: 5px;
        border-radius: 20px;
        z-index: 2;
    }

    #color-box {
        position: relative;
    }

    #color-box > #color-picker {
        position: absolute;
        top: 20px;
        left: 20px;
        width: 1px;
        height: 1px;
        z-index: 1;
    }

    #range {
        height: 5px;
        background: white;
        border-radius: 10px;
        outline: none;
        accent-color: #000000;
        margin: 10px;
    }

</style>
