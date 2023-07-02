<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { querystring, push } from 'svelte-spa-router';
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

    interface CanvasData {
        id: string;
        pos: Position;
        width: number;
        height: number;
        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
        isLayer: boolean;
        isSelected: boolean;
    }
    
    let canvasBox: HTMLDivElement;
    let canvas: HTMLCanvasElement;
    let context: CanvasRenderingContext2D;
    let canvasMouse: HTMLCanvasElement;
    let contextMouse: CanvasRenderingContext2D;

    let canvasList: Map<string, CanvasData> = new Map();

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

    let roomId: string = new URLSearchParams($querystring).get("id");
    let intervalId;
    let zIndex: number = 1;
    let seletedTool: string = "move-tool";
    let preSeletedTool: string = "move-tool";
    let mouseOnLayerKey: string;
    let mySelectedLayerKey: string;
    let isBurgerMenuOpen = false;

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
        getUsers();
        getCanvas();
        
        canvasBox = document.getElementById("canvas-box") as HTMLDivElement;

        canvas = document.getElementById("canvas") as HTMLCanvasElement;
        context = canvas.getContext("2d") as CanvasRenderingContext2D;

        context.fillStyle = "rgb(255, 255, 255)";
        context.fillRect(0, 0, canvas.width, canvas.height);

        canvasMouse = document.getElementById("canvas-mouse") as HTMLCanvasElement;
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
        });

        $socketStore.on("disconnected", (id: string) => {
            users = users.filter(user => user.id !== id);
        });

        $socketStore.on("leave", (id: string) => {
            users = users.filter(user => user.id !== id);
        });

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
        });

        $socketStore.on("loadImage", (data) => {
            loadImage(data.image, data.id1, data.id2);
        });

        $socketStore.on("clear", () => {
            clear("0");
        })

        $socketStore.on("layerMove", (data) => {
            canvasList.get(data.id).pos = data.pos;
            canvasList.get(data.id).canvas.style.left = `${data.pos.x}px`;
            canvasList.get(data.id).canvas.style.top = `${data.pos.y}px`;
        })

        $socketStore.on("layerMoveStart", (data) => {
            canvasList.get(data.id1).isSelected = true;
            canvasList.get(data.id1).canvas.style.zIndex = `${zIndex}`;
            const temp: CanvasData = canvasList.get(data.id1);
            
            zIndex++;
            canvasList.delete(data.id1);
            canvasList.set(data.id1, temp);
            addNewCanvas(data.id2);
        })

        $socketStore.on("layerMoveEnd", (data) => {
            canvasList.get(data.id).isSelected = false;
        })

        selectedToolButtonDesign();

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
        } else if (seletedTool === "select-tool") {
            mouseOnLayerKey = undefined;
            for (let [key, value] of canvasList) {
                if (value.isLayer) {
                    if (value.isSelected) {
                        contextMouse.strokeStyle = "yellow";
                    } else {
                        contextMouse.strokeStyle = "blue";
                    }
                    contextMouse.strokeRect(value.pos.x, value.pos.y, value.width, value.height);
                }
            }
            
            if (mySelectedLayerKey === undefined) {
                for (let [key, value] of canvasList) {
                    if (value.isLayer && !value.isSelected) {
                        if (value.pos.x < myData.pos.x 
                            && myData.pos.x < value.pos.x + value.width
                            && value.pos.y < myData.pos.y 
                            && myData.pos.y < value.pos.y + value.height
                        ) {
                            contextMouse.strokeStyle = "green";
                            contextMouse.strokeRect(value.pos.x, value.pos.y, value.width, value.height);
                            mouseOnLayerKey = key;
                        }
                    }
                }
            } else {
                contextMouse.strokeStyle = "green";
                contextMouse.strokeRect(canvasList.get(mySelectedLayerKey).pos.x, canvasList.get(mySelectedLayerKey).pos.y, canvasList.get(mySelectedLayerKey).width, canvasList.get(mySelectedLayerKey).height);
            }
        }
    }

    const mouseDownEvent = (e: MouseEvent) => {
        e.preventDefault();

        if (seletedTool === "move-tool") {
            isDown = true;
        }

        if (seletedTool === "select-tool") {
            isDown = true;
            mySelectedLayerKey = mouseOnLayerKey;
            if (mySelectedLayerKey) {
                canvasList.get(mySelectedLayerKey).isSelected = true;
                canvasList.get(mySelectedLayerKey).canvas.style.zIndex = `${zIndex}`;
                zIndex++;
                const mySelectedLayer = canvasList.get(mySelectedLayerKey);
                canvasList.delete(mySelectedLayerKey);
                canvasList.set(mySelectedLayerKey, mySelectedLayer);
                const id = nanoid();
                addNewCanvas(id);
                $socketStore.emit("layerMoveStart", { roomId: roomId, user: myData, id1: mySelectedLayer.id, id2: id});
            }
        }

        if (drawingOn && seletedTool === "brush-tool") {
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
            $socketStore.emit("mousemove", { roomId: roomId, user: data, draw: draw });
        }
    }

    const mouseUpEvent = (e: MouseEvent) => {
        e.preventDefault();
        if (seletedTool === "select-tool" && isDown) {
            if (mySelectedLayerKey !== undefined && canvasList.get(mySelectedLayerKey) !== undefined) {
                canvasList.get(mySelectedLayerKey).isSelected = false;
                $socketStore.emit("layerMoveEnd", { roomId: roomId, user: myData, id: mySelectedLayerKey });
                mySelectedLayerKey = undefined;
            }
        }
        isDown = false;
        myData.isDrawing = false;
    }

    const mouseMoveEvent = (e: MouseEvent) => {
        e.preventDefault();

        if (seletedTool === "move-tool" && isDown) {
            canvasBox.style.left = `${canvasBox.offsetLeft + (e.clientX - canvasBox.offsetLeft) - myData.pos.x}px`;
            canvasBox.style.top = `${canvasBox.offsetTop + (e.clientY - canvasBox.offsetTop) - myData.pos.y}px`;
        }

        if (seletedTool === "select-tool" && isDown) {
            if (mySelectedLayerKey !== undefined && canvasList.get(mySelectedLayerKey) !== undefined) {
                canvasList.get(mySelectedLayerKey).pos.x += (e.clientX - canvasBox.offsetLeft) - myData.pos.x;
                canvasList.get(mySelectedLayerKey).pos.y += (e.clientY - canvasBox.offsetTop) - myData.pos.y;
                canvasList.get(mySelectedLayerKey).canvas.style.left = `${canvasList.get(mySelectedLayerKey).pos.x}px`;
                canvasList.get(mySelectedLayerKey).canvas.style.top = `${canvasList.get(mySelectedLayerKey).pos.y}px`;
                
                
                $socketStore.emit("layerMove", {roomId, user: myData, id: mySelectedLayerKey, pos: canvasList.get(mySelectedLayerKey).pos});
            }
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
    }

    const touchEndEvent = (e: TouchEvent) => {
        e.preventDefault();
        isDown = false;
        myData.isDrawing = false;
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

    const addNewCanvas = (id: string) => {
        const drawCanvas = document.createElement("canvas") as HTMLCanvasElement;
        const drawCtx = drawCanvas.getContext("2d") as CanvasRenderingContext2D;
        drawCanvas.width = 2000;
        drawCanvas.height = 2000;
        drawCanvas.style.position = "absolute";
        drawCanvas.style.top = "0";
        drawCanvas.style.left = "0";
        drawCanvas.style.zIndex = `${zIndex}`;
        zIndex++;
        drawCanvas.style.margin = "0";
        drawCanvas.style.padding = "0";

        const newCanvasData = {
            id: id,
            pos: {x: 0, y: 0},
            width: drawCanvas.width,
            height:drawCanvas.height,
            canvas: drawCanvas,
            ctx: drawCtx,
            isLayer: false,
            isSelected: false
        };

        canvasList.set(newCanvasData.id, newCanvasData);
        canvasBox.appendChild(drawCanvas);
        
        canvas = drawCanvas;
        context = drawCtx;

        return newCanvasData;
    }

    const getCanvas = () => {
        fetch('/canvas', {
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
            if (data.canvas !== undefined) {
                canvasList.clear();
                data.canvas.forEach(c => {
                    let img = new Image();
                    img.onload = function() {
                        const tempCanvas = document.createElement("canvas") as HTMLCanvasElement;
                        const tempCtx = tempCanvas.getContext("2d") as CanvasRenderingContext2D;

                        canvasBox.appendChild(tempCanvas);
                        let scale = Math.min(1, 2000 / img.width, 2000 / img.height);
                        tempCanvas.width = img.width * scale;
                        tempCanvas.height = img.height * scale;
                        tempCtx.drawImage(img, 0, 0, img.width * scale, img.height * scale);
                        tempCanvas.style.position = "absolute";
                        tempCanvas.style.top = `${c.pos.y}px`;
                        tempCanvas.style.left = `${c.pos.x}px`;
                        tempCanvas.style.margin = "0";
                        tempCanvas.style.padding = "0";
                        tempCanvas.style.zIndex = `${zIndex}`;
                        
                        zIndex++;
                        
                        canvasList.set(c.id, {
                            id: c.id,
                            pos: c.pos,
                            width: tempCanvas.width,
                            height: tempCanvas.height,
                            canvas: tempCanvas,
                            ctx: tempCtx,
                            isLayer: c.isLayer,
                            isSelected: false
                        });
                        canvas = tempCanvas;
                        context = tempCtx;
                    };
                    img.src = c.src;
                });
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
        clear("0");
        $socketStore.emit("clear", { roomId: roomId, user: myData });
    }

    const clear = (id: string) => {
        canvasList.forEach(c => {
            c.canvas.remove();
        });
        zIndex = 1;
        canvasList.clear();
        const newCanvas: CanvasData = addNewCanvas(id);
        
        newCanvas.ctx.fillStyle = "rgb(255, 255, 255)";
        newCanvas.ctx.fillRect(0, 0, newCanvas.canvas.width, newCanvas.canvas.height);
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

    const loadImage = (imageSrc: string, id1: string, id2: string) => {
        const img = new Image();
        img.onload = function() {
            const tempCanvas = document.createElement("canvas") as HTMLCanvasElement;
            const tempCtx = tempCanvas.getContext("2d") as CanvasRenderingContext2D;

            let scale = Math.min(1, 2000 / img.width, 2000 / img.height);
            tempCanvas.width = img.width * scale;
            tempCanvas.height = img.height * scale;
            tempCtx.drawImage(img, 0, 0, img.width * scale, img.height * scale);
            canvasBox.insertBefore(tempCanvas, canvasBox.children[1]);
            tempCanvas.style.position = "absolute";
            tempCanvas.style.zIndex = `${zIndex}`;
            
            zIndex++;
            tempCanvas.style.top = "0";
            tempCanvas.style.left = "0";
            tempCanvas.style.margin = "0";
            tempCanvas.style.padding = "0";

            canvasList.set(id1, {
                id: id1,
                pos: {x: 0, y: 0},
                width: tempCanvas.width,
                height: tempCanvas.height,
                canvas: tempCanvas,
                ctx: tempCtx,
                isLayer: true,
                isSelected: false
            })

            addNewCanvas(id2);
        }
        img.src = imageSrc;
    }

    const loadEvent = (e) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const src = event.target.result as string;
            const id1 = nanoid();
            const id2 = nanoid();
            loadImage(src, id1, id2);
            $socketStore.emit("loadImage", { roomId: roomId, user: myData, image: src, id1, id2 });
        }
        if (e.target.files[0]) {
            reader.readAsDataURL(e.target.files[0]);
        }
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
        selectedToolButtonDesign();
    }

    const keydownEvent = (e) => {
        if (e.key === ' ') {
            e.preventDefault();
            if (seletedTool !== "move-tool") {
                preSeletedTool = seletedTool;
                seletedTool = "move-tool";
                canvasMouse.style.cursor = "move";
                selectedToolButtonDesign();
            }
        }
    }

    const keyupEvent = (e) => {
        if (e.key === ' ') {
            seletedTool = preSeletedTool;
            if (seletedTool === "select-tool") {
                canvasMouse.style.cursor = "pointer";
            } else if (seletedTool === "move-tool") {
                canvasMouse.style.cursor = "move";
            } else if (seletedTool === "brush-tool") {
                canvasMouse.style.cursor = "crosshair";
            }
            selectedToolButtonDesign();
        }
    }

    const selectedToolButtonDesign = () => {
        const select = document.getElementById("select-tool") as HTMLButtonElement;
        const move = document.getElementById("move-tool") as HTMLButtonElement;
        const brush = document.getElementById("brush-tool") as HTMLButtonElement;

        select.style.color = "black";
        select.style.border = "1px solid black";
        move.style.color = "black";
        move.style.border = "1px solid black";
        brush.style.color = "black";
        brush.style.border = "1px solid black";

        if (seletedTool === "select-tool") {
            select.style.color = "blue";
            select.style.border = "1px solid blue";    
        } else if (seletedTool === "move-tool") {
            move.style.color = "blue";
            move.style.border = "1px solid blue";   
        } else if (seletedTool === "brush-tool") {
            brush.style.color = "blue";
            brush.style.border = "1px solid blue";   
        }
    }

    const toggleBurgerMenu = () => {
        isBurgerMenuOpen = !isBurgerMenuOpen;
    }

</script>

<div id="canvas-box">
    <canvas id="canvas-mouse" bind:this={canvasMouse} width="2000" height="2000"></canvas>
    <canvas id="canvas" bind:this={canvas} width="2000" height="2000"></canvas>
</div>

<div id="tools">
    <button id="select-tool" on:click={toolButtonEvent}>
        Select
    </button>
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
    <button id="burger-menu" on:click={toggleBurgerMenu}>☰</button>
    {#if isBurgerMenuOpen}
        <button id="clear" class="menu-item" on:click={clearButtonEvent}>Clear</button>
        <button id="new-board" class="menu-item" on:click={newBoardButtonEvent}>New Board</button>
        <button id="save" class="menu-item" on:click={saveEvent}>Save</button>
        <button id="load" class="menu-item" on:click={() => {document.getElementById("imageLoader").click();}}>Load</button>
        <input type="file" id="imageLoader" on:change={loadEvent} accept="image/*" style="display: none;"/>
    {/if}
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

    #menu {
        position: fixed;
        top: 0px;
        right: 0px;
        z-index: 100000000;
        display: flex;
        flex-direction: column;
        margin-top: 10px;
        margin-right: 10px;
        align-items: end;
    }

    #burger-menu {
        height: 50px;
        width: 50px;
        padding-bottom: 4px;
        border-radius: 500px;
        border: 1px solid black;
        margin-bottom: 5px;
        font-size: 30px;
        font-weight: 300;
        text-align: center;
    }

    #burger-menu:hover {
        color: blue;
        border: 1px solid blue;
    }

    .menu-item {
        height: 40px;
        margin-bottom: 5px;
        border-radius: 10px;
        border: 1px solid black;
    }

    .menu-item:hover {
        margin-right: 5px;
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

    @media (max-aspect-ratio: 1/1) {
        #menu {
            position: fixed;
            bottom: 0px;
            right: 0px;
            z-index: 100000000;
            display: flex;
            flex-direction: column-reverse;
            margin-top: 10px;
            margin-right: 10px;
            align-items: end;
        }
    }

</style>
