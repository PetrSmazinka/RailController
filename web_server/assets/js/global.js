var STREAMING_FROM_TRAINS={};
var MANUALLY_CONTROLLED_TRAINS={};

function makeDraggable (element) {
    let currentPosX = 0, currentPosY = 0, previousPosX = 0, previousPosY = 0;
    if (element.querySelector('.window-top')) {
        element.querySelector('.window-top').onmousedown = dragMouseDown;
    } 
    else if (element.querySelector('.grab')) {
        element.querySelector('.grab').onmousedown = dragMouseDown;
    } 
    else {
        element.onmousedown = dragMouseDown;
    }

    function dragMouseDown (e) {
        e.preventDefault();
        previousPosX = e.clientX;
        previousPosY = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag (e) {
        e.preventDefault();
        let currentPosX = previousPosX - e.clientX;
        let currentPosY = previousPosY - e.clientY;
        previousPosX = e.clientX;
        previousPosY = e.clientY;
        element.style.top = (element.offsetTop - currentPosY) + 'px';
        element.style.left = (element.offsetLeft - currentPosX) + 'px';
    }

    function closeDragElement () {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
async function createWindow(id, ip){
    if(STREAMING_FROM_TRAINS[id]){
        return;
    }
    let openWindow = false;
    let aborted = false;
    let controller = new AbortController();
    let signal = controller.signal;
    Swal.fire({
        title: "Prosím čekejte",
        text: `Probíhá načítání přenosu obrazu z vlaku ${id}`,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCloseButton: true,
        didRender: () => {
            Swal.showLoading();
        }
    }).then((result)=>{
        if(result.isDismissed && !openWindow){
            aborted = true;
            controller.abort();
        }
    });
    await fetch(`http://${ip}/_TC_VERSION`, {signal}).then(response => response.text()).then(response => {
        console.info(response);
        openWindow = true;
        Swal.close();
    }).catch((e)=>{
        if(!aborted){
            Err.fire({text: `Nepodařilo se připojit k vlaku ${id}`});
        }
    });
    if(!openWindow){
        return;
    }
    STREAMING_FROM_TRAINS[id] = true;
    let div_window = document.createElement("div");
    div_window.classList.add("window");
    let div_window_top = document.createElement("div");
    div_window_top.classList.add("window-top");
    let div_window_title = document.createElement("div");
    div_window_title.classList.add("window-title");
    let div_window_cross = document.createElement("div");
    div_window_cross.classList.add("window-cross");
    let div_window_content = document.createElement("div");
    div_window_content.classList.add("window-content");
    let iframe_window_iframe = document.createElement("iframe");
    iframe_window_iframe.classList.add("window-iframe");

    div_window.setAttribute("data-id", id);
    div_window_title.innerHTML = `Pohled z vlaku ${id}`;
    div_window_cross.innerHTML = `×`;
    iframe_window_iframe.src = `../../library/rtsp.php?ip=${ip}`;
    iframe_window_iframe.onerror = () => {destroyWindow(div_window)};

    div_window_cross.onclick = function(){destroyWindow(div_window);}; 

    div_window_top.appendChild(div_window_title);
    div_window_top.appendChild(div_window_cross);
    div_window_content.appendChild(iframe_window_iframe);
    div_window.appendChild(div_window_top);
    div_window.appendChild(div_window_content);
    document.body.appendChild(div_window);

    makeDraggable(div_window);
}
function destroyWindow(window){
    let id = window.getAttribute("data-id");
    delete STREAMING_FROM_TRAINS[id];
    window.outerHTML = ""
}

async function createGaugeWindow(id, ip){
    if(MANUALLY_CONTROLLED_TRAINS[id]){
        return;
    }
    let speed = 0;
    let set_backward = false;
    let set_moving = false;
    let response = await fetch(`../../library/loco.php?ip=${canvas_trains[id].ip}`);
    let responseObj = await response.json();
    if(responseObj.status == "ok"){
        speed = responseObj.data.speed;
        if(responseObj.data.speed != 0){
            set_moving = true
        }
        if(responseObj.data.speed < 0){
            set_backward = true;
            speed = -speed;
        }
    }

    MANUALLY_CONTROLLED_TRAINS[id] = true;
    let div_window = document.createElement("div");
    div_window.classList.add("window");
    div_window.classList.add("window-small");
    div_window.setAttribute("data-id", id);
    let div_window_top = document.createElement("div");
    div_window_top.classList.add("window-top");
    let div_window_title = document.createElement("div");
    div_window_title.classList.add("window-title");
    div_window_title.innerHTML = `Ovládání vlaku ${id}`;
    let div_window_cross = document.createElement("div");
    div_window_cross.classList.add("window-cross");
    div_window_cross.innerHTML = "×";
    let div_window_content = document.createElement("div");
    div_window_content.classList.add("window-content");
    let div_content_grid = document.createElement("div");
    div_content_grid.classList.add("content-grid");
    let btn_direction = document.createElement("button");
    btn_direction.classList.add("btn");
    btn_direction.classList.add("btn-direction");
    if(set_backward){
        btn_direction.classList.add("reverse");
    }
    let div_group = document.createElement("div");
    div_group.classList.add("group");
    let div_speed = document.createElement("div");
    div_speed.classList.add("speed");
    let div_speed_value = document.createElement("div");
    div_speed_value.innerHTML = speed;
    let input_range = document.createElement("input");
    input_range.classList.add("range");
    input_range.setAttribute("type", "range");
    input_range.setAttribute("min", "0");
    input_range.setAttribute("max", "255");
    input_range.setAttribute("step", "1");
    input_range.setAttribute("value", speed);
    let btn_start_stop = document.createElement("button");
    btn_start_stop.classList.add("btn");
    btn_start_stop.classList.add("btn-start-stop");
    if(set_moving){
        btn_start_stop.classList.add("moving");
    }

    div_window_top.appendChild(div_window_title);
    div_window_top.appendChild(div_window_cross);
    div_group.appendChild(div_speed);
    div_group.appendChild(div_speed_value);
    div_group.appendChild(input_range);
    div_content_grid.appendChild(btn_direction);
    div_content_grid.appendChild(div_group);
    div_content_grid.appendChild(btn_start_stop);
    div_window_content.appendChild(div_content_grid);
    div_window.appendChild(div_window_top);
    div_window.appendChild(div_window_content);

    btn_direction.addEventListener("click", () => {
        btn_direction.classList.toggle("reverse");
        if(btn_start_stop.classList.contains("moving")){
            let direction = 1;
            if(btn_direction.classList.contains("reverse")){
                direction = -1;
            }
            adjustSpeed(ip, direction * input_range.value);
        }
    });
    input_range.addEventListener("input", () => {
        div_speed_value.innerHTML = input_range.value;
        if(btn_start_stop.classList.contains("moving")){
            let direction = 1;
            if(btn_direction.classList.contains("reverse")){
                direction = -1;
            }
            adjustSpeed(ip, direction * input_range.value);
        }
    });
    input_range.addEventListener("change", () => {
        if(btn_start_stop.classList.contains("moving")){
            let direction = 1;
            if(btn_direction.classList.contains("reverse")){
                direction = -1;
            }
            adjustSpeed(ip, direction * input_range.value);
        }
    });
    btn_start_stop.addEventListener("click", () => {
        if(btn_start_stop.classList.contains("moving")){
            // stop train
            adjustSpeed(ip, 0);
        }
        else{
            let direction = 1;
            if(btn_direction.classList.contains("reverse")){
                direction = -1;
            }
            adjustSpeed(ip, direction * input_range.value);
        }
        btn_start_stop.classList.toggle("moving");
    });
    div_window_cross.onclick = function(){destroyGaugeWindow(div_window);}; 
    document.body.appendChild(div_window);

    makeDraggable(div_window);
}

function destroyGaugeWindow(window){
    let id = window.getAttribute("data-id");
    delete MANUALLY_CONTROLLED_TRAINS[id];
    window.outerHTML = ""
}

makeDraggable(document.querySelector("#menubar"));
if(document.querySelector("#statusbar")){
    makeDraggable(document.querySelector("#statusbar"));
}
else{
    console.info("A");
}