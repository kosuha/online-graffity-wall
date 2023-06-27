<script lang="ts">
    import { onMount, afterUpdate } from "svelte";
    import { socketStore } from "../store";

    interface UserData {
        id: string;
        x: number;
        y: number;
        isDrawing: boolean;
    }
    
    let canvas: HTMLCanvasElement;
    let context: CanvasRenderingContext2D;
    let canvasMouse: HTMLCanvasElement;
    let contextMouse: CanvasRenderingContext2D;

    let myData: UserData = {
        id: $socketStore.id,
        x: 0,
        y: 0,
        isDrawing: false
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
                        context.lineWidth = 10;
                        context.moveTo(users[i].x, users[i].y);
                        context.lineTo(data.userData.x, data.userData.y);
                        context.stroke();
                    }

                    users[i].x = data.userData.x;
                    users[i].y = data.userData.y;
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
                    context.lineWidth = 10;
                    context.moveTo(users[i].x, users[i].y);
                    context.lineTo(data.userData.x, data.userData.y);
                    context.stroke();
                    return ;
                }
            }
        })

        $socketStore.on("mouseup", (data) => {
            for (let i = 0; i < users.length; i++) {
                if (users[i].id === data.userData.id) {
                    users[i].isDrawing = false;
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
            contextMouse.fillStyle = "yellow";
            contextMouse.fillRect(user.x, user.y, 10, 10);
        });
        contextMouse.fillStyle = "green";
        contextMouse.fillRect(myData.x, myData.y, 10, 10);
    }

    const mouseDownEvent = (e: MouseEvent) => {
        $socketStore.emit('mousedown', myData);
        myData.isDrawing = true;

        context.beginPath()
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.lineWidth = 10;
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
            context.lineWidth = 10;
            context.moveTo(myData.x, myData.y);
            context.lineTo(e.clientX - canvasMouse.offsetLeft + window.scrollX, e.clientY - canvasMouse.offsetTop + window.scrollY);
            context.stroke();
        }
        
        const data: UserData = {
            id: $socketStore.id,
            x: e.clientX - canvasMouse.offsetLeft + window.scrollX,
            y: e.clientY - canvasMouse.offsetTop + window.scrollY,
            isDrawing: myData.isDrawing
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
</script>

<svelte:head>
    <title>
        Online Graffity Wall
    </title>
</svelte:head>

<canvas id="canvas-mouse" bind:this={canvasMouse} width="2000" height="2000"></canvas>
<canvas id="canvas" bind:this={canvas} width="2000" height="2000"></canvas>

<style>
    #canvas, #canvas-mouse {
        position: absolute;
        top: 0;
        left: 0;
        margin: 10px;
    }

    #canvas {
        border: 1px solid black;
    }

    #canvas-mouse {
        background-color: rgba(255, 255, 255, 0);
        z-index: 999;
    }
</style>
