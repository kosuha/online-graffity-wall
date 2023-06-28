<script lang="ts">
    import { onMount } from "svelte";
    import { socketStore } from "../store";

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

    onMount(() => {
        canvas = document.getElementById("canvas") as HTMLCanvasElement;
        canvasMouse = document.getElementById("canvas-mouse") as HTMLCanvasElement;
        context = canvas.getContext("2d") as CanvasRenderingContext2D;
        contextMouse = canvasMouse.getContext("2d") as CanvasRenderingContext2D;

        getImage();
        getUsers();

        canvasMouse.addEventListener("mousedown", mouseDownEvent);
        canvasMouse.addEventListener("mousemove", mouseMoveEvent);
        canvasMouse.addEventListener("mouseup", mouseUpEvent);

        $socketStore.on("connected", (data: UserData) => {
            users.push(data);
        })

        $socketStore.on("disconnected", (data: UserData) => {
            users = users.filter(user => user.id !== data.id);
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

        setInterval(drawMouse, 0.1);
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
        contextMouse.beginPath()
        contextMouse.arc(myData.pos.x, myData.pos.y, myData.width / 2, 0, Math.PI * 2);
        contextMouse.fillStyle = myData.color;
        contextMouse.fill();
        contextMouse.closePath();
    }

    const mouseDownEvent = (e: MouseEvent) => {
        myData.isDrawing = true;

        const data: UserData = {
            id: $socketStore.id,
            pos: { x: myData.pos.x, y: myData.pos.y },
            isDrawing: myData.isDrawing,
            color: myData.color,
            width: myData.width
        }

        const draw: Draw = {
            id: myData.id,
            width: myData.width,
            color: myData.color,
            from: { x: myData.pos.x, y: myData.pos.y },
            to: { x: myData.pos.x, y: myData.pos.y }
        }

        drawLine(draw);
        $socketStore.emit("mousemove", { user: data, draw: draw });
    }

    const mouseUpEvent = (e: MouseEvent) => {
        myData.isDrawing = false;
    }

    const mouseMoveEvent = (e: MouseEvent) => {
        const data: UserData = {
            id: $socketStore.id,
            pos: {
                x: e.clientX - canvasMouse.offsetLeft + window.scrollX,
                y: e.clientY - canvasMouse.offsetTop + window.scrollY
            },
            isDrawing: myData.isDrawing,
            color: myData.color,
            width: myData.width
        }

        if (myData.isDrawing) {
            const draw: Draw = {
                id: myData.id,
                width: myData.width,
                color: myData.color,
                from: { x: myData.pos.x, y: myData.pos.y },
                to: {
                    x: e.clientX - canvasMouse.offsetLeft + window.scrollX, 
                    y: e.clientY - canvasMouse.offsetTop + window.scrollY
                }
            }
            drawLine(draw);
            $socketStore.emit("mousemove", { user: data, draw: draw });
        } else {
            $socketStore.emit("mousemove", { user: data, draw: undefined });
        }
        myData = data;
    }

    const getImage = () => {
        fetch('/image', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then((data) => {
            for (let i = 0; i < data.image.length; i++) {
                drawLine(data.image[i]);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    const getUsers = () => {
        fetch('/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then((data) => {
            users = data.users as UserData[];
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
        context.beginPath()
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.lineWidth = draw.width;
        context.strokeStyle = draw.color;
        context.moveTo(draw.from.x, draw.from.y);
        context.lineTo(draw.to.x, draw.to.y);
        context.stroke();
    }
</script>

<svelte:head>
    <title>
        Online Graffity Wall
    </title>
    <script src="https://unpkg.com/vanilla-picker@2.10.1"></script>
</svelte:head>

<canvas id="canvas-mouse" bind:this={canvasMouse} width="2000" height="2000"></canvas>
<canvas id="canvas" bind:this={canvas} width="2000" height="2000"></canvas>
<div id="palette">
    <button id="color-picker-button" on:click={colorButtonEvent} style="background-color: {myData.color};"></button>
    <input id="range" type="range" min=1 max=50 bind:value={myData.width} style="accent-color: {myData.color};">
    <input id="color-picker" type="color" bind:value={myData.color} />
</div>

<style>
    #canvas, #canvas-mouse {
        position: absolute;
        top: 0;
        left: 0;
        margin: 0px;
        box-sizing: border-box;
    }

    #canvas {
        z-index: 1;
        border: 1px solid rgba(0, 0, 0, 0.5);
    }

    #canvas-mouse {
        background-color: rgba(255, 255, 255, 0);
        z-index: 2;
    }

    #palette {
        position: fixed;
        z-index: 3;
        background-color: rgba(47, 47, 47, 0.5);
        border: 1px solid black;
        padding: 10px;
        border-radius: 10px;
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    #color-picker-button {
        width: 30px;
        height: 30px;
        border: none;
        padding: 1px;
        margin-right: 10px;
        border-radius: 20px;
        z-index: 3;
    }

    #color-picker {
        position: fixed;
        top: 30px;
        left: 30px;
        width: 1px;
        height: 1px;
        z-index: 2;
    }

    #range {
        height: 5px;
        background: white;
        border-radius: 10px;
        outline: none;
        -webkit-appearance: none;
        accent-color: #000000;
    }

</style>
