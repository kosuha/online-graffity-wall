<script lang="ts">
    import { onMount, afterUpdate } from "svelte";
    import { socketStore } from "../store";

    interface UserData {
        id: string;
        x: number;
        y: number;
        isDrawing: boolean;
        color: string;
        width: number;
    }
    
    let canvas: HTMLCanvasElement;
    let context: CanvasRenderingContext2D;
    let canvasMouse: HTMLCanvasElement;
    let contextMouse: CanvasRenderingContext2D;

    let myData: UserData = {
        id: $socketStore.id,
        x: 0,
        y: 0,
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

        $socketStore.on("connected", (data) => {
            users.push(data.userData);
        })

        $socketStore.on("disconnected", (data) => {
            users = users.filter(user => user.id !== data.userData.id);
        })

        $socketStore.on("mousemove", (data) => {
            for (let i = 0; i < users.length; i++) {
                if (users[i].id === data.userData.id) {
                    if (users[i].isDrawing) {
                        context.beginPath()
                        context.lineJoin = 'round';
                        context.lineCap = 'round';
                        context.lineWidth = users[i].width;
                        context.strokeStyle = users[i].color;
                        context.moveTo(users[i].x, users[i].y);
                        context.lineTo(data.userData.x, data.userData.y);
                        context.stroke();
                    }

                    users[i] = data.userData;
                    return ;
                }
            }
        })

        $socketStore.on("mousedown", (data) => {
            for (let i = 0; i < users.length; i++) {
                if (users[i].id === data.userData.id) {
                    users[i].isDrawing = true;
                    context.beginPath()
                    context.lineJoin = 'round';
                    context.lineCap = 'round';
                    context.lineWidth = users[i].width;
                    context.strokeStyle = users[i].color;
                    context.moveTo(users[i].x, users[i].y);
                    context.lineTo(data.userData.x, data.userData.y);
                    context.stroke();

                    users[i] = data.userData;
                    return ;
                }
            }
        })

        $socketStore.on("mouseup", (data) => {
            for (let i = 0; i < users.length; i++) {
                if (users[i].id === data.userData.id) {
                    users[i] = data.userData;
                    return ;
                }
            }
        })

        setInterval(draw, 0.1);
    });

    // 마우스 그리기
    const draw = () => {
        contextMouse.clearRect(0, 0, canvasMouse.width, canvasMouse.height);
        users.forEach(user => {
            contextMouse.beginPath()
            contextMouse.arc(user.x, user.y, 5, 0, Math.PI * 2);
            contextMouse.strokeStyle = "black";
            contextMouse.lineWidth = 3;
            contextMouse.stroke();
            contextMouse.closePath();
            
        });
        contextMouse.beginPath()
        contextMouse.arc(myData.x, myData.y, myData.width / 2, 0, Math.PI * 2);
        contextMouse.fillStyle = myData.color;
        contextMouse.fill();
        contextMouse.closePath();
    }

    const mouseDownEvent = (e: MouseEvent) => {
        $socketStore.emit('mousedown', myData);
        myData.isDrawing = true;

        context.beginPath()
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.lineWidth = myData.width;
        context.strokeStyle = myData.color;
        context.moveTo(myData.x, myData.y);
        context.lineTo(myData.x, myData.y);
        context.stroke();
    }

    const mouseUpEvent = (e: MouseEvent) => {
        $socketStore.emit('mouseup', myData);
        myData.isDrawing = false;
        saveImage();
    }

    const mouseMoveEvent = (e: MouseEvent) => {
        if (myData.isDrawing) {
            context.beginPath()
            context.lineJoin = 'round';
            context.lineCap = 'round';
            context.lineWidth = myData.width;
            context.strokeStyle = myData.color;
            context.moveTo(myData.x, myData.y);
            context.lineTo(e.clientX - canvasMouse.offsetLeft + window.scrollX, e.clientY - canvasMouse.offsetTop + window.scrollY);
            context.stroke();
        }
        
        const data: UserData = {
            id: $socketStore.id,
            x: e.clientX - canvasMouse.offsetLeft + window.scrollX,
            y: e.clientY - canvasMouse.offsetTop + window.scrollY,
            isDrawing: myData.isDrawing,
            color: myData.color,
            width: myData.width
        }
        $socketStore.emit("mousemove", data);
        myData = data;
    }

    const saveImage = () => {
        let dataURL = canvas.toDataURL('image/png') as string;
        fetch('/image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: dataURL })
        })
        .catch((error) => {
            console.error('Error:', error);
        });
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
            let dataURL = data.image;          
            let img = new Image();
            img.src = dataURL;

            // 이미지 로딩이 완료되면 캔버스에 그림
            img.onload = function() {
                context.drawImage(img, 0, 0);
            };
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
</script>

<svelte:head>
    <title>
        Online Graffity Wall
    </title>
    <script src="https://unpkg.com/vanilla-picker@2.10.1"></script>
</svelte:head>

<canvas id="canvas-mouse" bind:this={canvasMouse} width="3000" height="3000"></canvas>
<canvas id="canvas" bind:this={canvas} width="3000" height="3000"></canvas>
<div id="palette">
    <input id="color-picker" type="color" bind:value={myData.color} style="display: none;" />
    <button id="color-picker-button" on:click={colorButtonEvent} style="background-color: {myData.color};"></button>
    <input id="range" type="range" min=1 max=50 bind:value={myData.width} style="accent-color: {myData.color};">
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
    }

    #color-picker {
        position: fixed;
        top: 50px;
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
