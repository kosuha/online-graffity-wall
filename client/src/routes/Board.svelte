<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { querystring, push, location } from 'svelte-spa-router';
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
    let roomId: string = new URLSearchParams($querystring).get("id");
    let intervalId;

    $: {
        let searchParams = new URLSearchParams($querystring);
        const newParam: string = searchParams.get("id");
        if (newParam === "lobby") {
            push('/');
        }
        if (roomId !== newParam) {
            window.location.reload();
        }
    }
    
    onMount(() => {
        getImage();
        getUsers();
        
        canvas = document.getElementById("canvas") as HTMLCanvasElement;
        canvasMouse = document.getElementById("canvas-mouse") as HTMLCanvasElement;
        context = canvas.getContext("2d") as CanvasRenderingContext2D;
        contextMouse = canvasMouse.getContext("2d") as CanvasRenderingContext2D;
        
        canvasMouse.addEventListener("mousedown", mouseDownEvent);
        canvasMouse.addEventListener("mousemove", mouseMoveEvent);
        canvasMouse.addEventListener("mouseup", mouseUpEvent);

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

        $socketStore.on("clear", () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
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

        if (drawingOn) {
            const draw: Draw = {
                id: myData.id,
                width: myData.width,
                color: myData.color,
                from: { x: myData.pos.x, y: myData.pos.y },
                to: { x: myData.pos.x, y: myData.pos.y }
            }
    
            drawLine(draw);
            $socketStore.emit("mousemove", { roomId: roomId, user: data, draw: draw });
        }
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

        if (myData.isDrawing && drawingOn) {
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

    const clearButtonEvent = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        $socketStore.emit("clear", { roomId: roomId, user: myData });
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

    const loadEvent = (e) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const hRatio = canvas.width  / img.width;
                const vRatio = canvas.height / img.height;
                const ratio  = Math.min(hRatio, vRatio);
                
                const centerShift_x = (canvas.width - img.width*ratio) / 2;
                const centerShift_y = (canvas.height - img.height*ratio) / 2;  

                context.drawImage(img, 0, 0, img.width, img.height,
                                  centerShift_x, centerShift_y, img.width*ratio, img.height*ratio);
            }
            img.src = event.target.result as string;
        }
        reader.readAsDataURL(e.target.files[0]);
    }
</script>

<canvas id="canvas-mouse" bind:this={canvasMouse} width="2000" height="2000"></canvas>
<canvas id="canvas" bind:this={canvas} width="2000" height="2000"></canvas>
<div id="menu">
    <div>
        <button id="color-picker-button" on:click={colorButtonEvent} style="background-color: {myData.color};"></button>
        <input id="range" type="range" min=1 max=200 bind:value={myData.width} style="accent-color: {myData.color};">
        <input id="color-picker" type="color" bind:value={myData.color} />
    </div>
    <div>
        <button id="clear" on:click={clearButtonEvent}>Clear</button>
        <button id="new-board" on:click={newBoardButtonEvent}>New Board</button>
        <button id="save" on:click={saveEvent}>Save</button>
        <button id="load" on:click={() => {document.getElementById("imageLoader").click();}}>Load</button>
        <input type="file" id="imageLoader" on:change={loadEvent} accept="image/*" style="display: none;"/>
    </div>
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

    #menu {
        position: fixed;
        width: 100%;
        z-index: 3;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    #menu > div:first-child {
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

    #menu > div:nth-child(2) {
        padding-right: 10px;
    }

    #menu > div:nth-child(2) > button {
        margin-right: 5px;
        border-radius: 500px;
        padding-left: 10px;
        padding-right: 10px;
        border: 1px solid black;
    }

    #menu > div:nth-child(2) > button:hover {
        margin-right: 5px;
        border-radius: 500px;
        padding-left: 10px;
        padding-right: 10px;
        border: 1px solid blue;
        color: blue;
    }

    #color-picker-button {
        width: 30px;
        height: 30px;
        border-radius: 500px;
        border: none;
        padding: 1px;
        margin: 5px;
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
        accent-color: #000000;
        margin: 10px;
    }

</style>
