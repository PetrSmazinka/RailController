var canvas_size;
var canvas_offset;
var canvas_points={};
var canvas_connections={};
var canvas_trains={};
var color_converter={"R": "red", "Y": "yellow", "G": "green", "-": ""};
var state_converter={"S": "straight", "D": "diverted", "U": ""};
var last_console_message_id = null;
var logs_paused = false;
var server_state = null;

const uniqid = () => Date.now().toString(36);
const Err = Swal.mixin({"title": "Chyba", "icon" : "error", "confirmButtonColor": "0476eb"});
const Success = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    icon: "success",
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });

const OFFSET = {connection: {x: 7.5, y: 5.5}, train: {x: -20, y: -15}};
const len = (point1, point2) => Math.sqrt(Math.pow((point2.x-point1.x), 2) + Math.pow((point2.y-point1.y), 2));
const r2d = rad => (rad * 180.0) / Math.PI;
const r2a_x = x => (x * getCanvasSize().x) + getCanvasOffset().x;
const r2a_y = y => (y * getCanvasSize().y) + getCanvasOffset().y;
const a2r_x = x => (x - getCanvasOffset().x) / getCanvasSize().x;
const a2r_y = y => (y - getCanvasOffset().y) / getCanvasSize().y;
const a2r = (input = {x: 0, y: 0}) => {let size = {...input}; size.x -= getCanvasOffset().x; size.x /= getCanvasSize().x; size.y -= getCanvasOffset().y; size.y /= getCanvasSize().y; return size;};
const r2a = (input = {x: 0, y: 0}) => {let size = {...input}; size.x *= getCanvasSize().x; size.x += getCanvasOffset().x; size.y *= getCanvasSize().y; size.y += getCanvasOffset().y; return size;};
const a2r_points = (pointElm) => {
    let ponns = pointElm.querySelectorAll("point");
    for(let i=0; i<ponns.length; i++){
        ponns[i].setAttribute("x", a2r_x(ponns[i].getAttribute("x")));
        ponns[i].setAttribute("y", a2r_y(ponns[i].getAttribute("y")));
    }
    return pointElm;
};
const getCanvasSize = () => {
    let canvas = document.getElementById("canvas");
    return {x:canvas.offsetWidth, y:canvas.offsetHeight};
};
const getCanvasOffset = () => {
    let bounding = document.getElementById("canvas").getBoundingClientRect();
    return {x: bounding.x, y: bounding.y};
};
const swapIfReverseOrder = (point1, point2) => {
    if(point2.x < point1.x){
        return [point2, point1, true];
    }
    else{
        return [point1, point2, false];
    }
};
const addPoints = (point1, point2) => {return {x: point1.x+point2.x, y: point1.y+point2.y}};
const getCenter = (point1, point2) => {return {x: (point1.x+point2.x)/2, y: (point1.y+point2.y)/2}};
const shortColor2Long = (color) => {let colors = {R: "red", Y: "yellow", G: "green"}; return colors[color];};
const time_tFormat = (time) => {
    let milliseconds = time * 1000;
    let date = new Date(milliseconds);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    return `[${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}] `;
};

function setConnectionColor(connection, color){
    document.getElementById("connection#"+connection).classList.remove("red");
    document.getElementById("connection#"+connection).classList.remove("yellow");
    document.getElementById("connection#"+connection).classList.remove("green");
    document.getElementById("connection#"+connection).classList.add(color);
}
function getConnectionColor(connection){
    if(document.getElementById("connection#"+connection).classList.contains("red")){
        return "red";
    }
    else if(document.getElementById("connection#"+connection).classList.contains("yellow")){
        return "yellow";
    }
    else if(document.getElementById("connection#"+connection).classList.contains("green")){
        return "green";
    }
}
function rePaintPreviousConnections(color="yellow"){
    for(let conn in canvas_connections){
        for(let conn2 in canvas_connections){
            if(canvas_connections[conn].to == canvas_connections[conn2].from && getConnectionColor(conn2) == "red" && getConnectionColor(conn) != "red"){
                setConnectionColor(conn, color);
            }
        }
    }
}
function loadPoints(points){
    for(let i=0; i<points.length; i++){
        let x = r2a_x(parseFloat(points[i].getAttribute("x")));
        let y = r2a_y(parseFloat(points[i].getAttribute("y")));
        let id = points[i].getAttribute("id");
        
        canvas_points[id] = {x:x, y:y};
    }
}
function loadConnections(connections){
    for(let i=0; i<connections.length; i++){
        let id = connections[i].getAttribute("id");
        let from = connections[i].getAttribute("from");
        let to = connections[i].getAttribute("to");
        
        // switches & multioccupies
        let switches=[];
        let multioccupies=[];
        let arr = Array.from(connections[i].children);
        arr.forEach((value)=>{
            if(value.nodeName == "switch"){
                let id = value.getAttribute("id");
                let position = value.getAttribute("position");
                switches.push({id: id, position: position});
            }
            else if(value.nodeName == "multioccupy"){
                let id = value.getAttribute("id");
                multioccupies.push({id: id});
            }
        });
        canvas_connections[id] = {from: from, to: to, switches: switches, multioccupies: multioccupies};
    }
}
function loadSwitches(switches){
    const status_bar = document.getElementById("statusbar");
    if(switches.length > 0){
        let heading = document.createElement("div")
        heading.classList.add("heading");
        heading.innerText = "Výhybky";
        status_bar.appendChild(heading);
    }
    for(let i=0; i<switches.length; i++){
        let property = document.createElement("div");
        property.classList.add("property");
        property.innerText = `${switches[i].getAttribute("id")}:`;
        let switchEl = document.createElement("div");
        switchEl.setAttribute("id", `switch#${switches[i].getAttribute("id")}`);
        switchEl.classList.add("switch-state");
        status_bar.appendChild(property);
        status_bar.appendChild(switchEl);
    }
}
function loadSemaphores(semaphores){
    const status_bar = document.getElementById("statusbar");
    if(semaphores.length > 0){
        let heading = document.createElement("div")
        heading.classList.add("heading");
        heading.innerText = "Signalizace";
        status_bar.appendChild(heading);
    }
    for(let i=0; i<semaphores.length; i++){
        let property = document.createElement("div");
        property.classList.add("property");
        property.innerText = `${semaphores[i].getAttribute("id")}:`;
        let semaphoreEl = document.createElement("div");
        semaphoreEl.setAttribute("id", `semaphore#${semaphores[i].getAttribute("id")}`);
        semaphoreEl.classList.add("light-state");
        status_bar.appendChild(property);
        status_bar.appendChild(semaphoreEl);
    }
}
function loadTrains(trains){
    for(let i=0; i<trains.length; i++){
        let id = trains[i].getAttribute("id");
        let ip = trains[i].getAttribute("ip");
        let start = trains[i].getAttribute("start");
        canvas_trains[id] = {ip: ip, start: start};
    }
}
function paint(){
    canvas_size = getCanvasSize();
    canvas_offset = getCanvasOffset();
    for(let connection in canvas_connections){
        let conn = canvas_connections[connection];
        let from = canvas_points[conn.from];
        let to = canvas_points[conn.to];
        
        let reversed=false;
        [from, to, reversed] = swapIfReverseOrder(from, to);
        let angle = r2d(Math.atan((to.y-from.y)/(to.x-from.x)));
        let length = len(from, to);

        let connection_element = document.createElement("div");
        connection_element.setAttribute("id", "connection#"+connection);
        connection_element.setAttribute("data-id", connection);
        let data_switches = [];
        for(let i=0; i< canvas_connections[connection].switches.length; i++){
            let sw = canvas_connections[connection].switches[i];
            data_switches.push(`${sw.id}${sw.position}`);
        }
        if(data_switches.length > 0){
            connection_element.setAttribute("data-switches", `${data_switches.join(", ")}`);
            connection_element.classList.add("switchlist");
        }
        connection_element.classList.add("connection");
        connection_element.classList.add("green");
        connection_element.style.left = from.x;
        connection_element.style.top = from.y;
        connection_element.style.transform = `rotate(${angle}deg)`;
        connection_element.style.width = length;
        connection_element.innerHTML = '<div class="arrow">></div>';
        if(reversed){
            connection_element.classList.add("reversed");
            connection_element.innerHTML = '<div class="arrow"><</div>';
        }
        document.getElementById("canvas").appendChild(connection_element);
    }
    for(let train in canvas_trains){
        let start = canvas_trains[train].start;
        let connection = canvas_connections[start];
        let from = canvas_points[connection.from];
        let to = canvas_points[connection.to];
        let center = getCenter(from, to);
        center = addPoints(center, OFFSET.train);

        let train_element = document.createElement("div");
        train_element.setAttribute("id", "train#"+train);
        train_element.classList.add("train");
        train_element.style.left = center.x;
        train_element.style.top = center.y;
        train_element.innerHTML = `<i class="fa-solid fa-train"></i> ${train}`;
        document.getElementById("canvas").appendChild(train_element);
        setConnectionColor(start, "red");
        for(moccup in canvas_connections[start].multioccupies){
            setConnectionColor(canvas_connections[start].multioccupies[moccup].id, "red");
        }
    }
    rePaintPreviousConnections();
}
function resizeModel(){
    let oldOffset = canvas_offset;
    let oldSize = canvas_size;
    let newOffset = getCanvasOffset();
    let newSize = getCanvasSize();
    canvas_offset = newOffset;
    canvas_size = newSize;
    let k_x = newSize.x / oldSize.x;
    let k_y = newSize.y / oldSize.y;
    resizePoints(k_x, k_y, oldOffset, newOffset);
    resizeConnections();
    resizeTrains(k_x, k_y, oldOffset, newOffset);
}
function resizePoints(k_x, k_y, oldOffset, newOffset){
    for(point in canvas_points){
        let p = canvas_points[point];
        p.x = (p.x-oldOffset.x)*k_x+newOffset.x;
        p.y = (p.y-oldOffset.y)*k_y+newOffset.y;
    }
}
function resizeConnections(){
    let conns = document.getElementsByClassName("connection");
    for(let i=0; i<conns.length; i++){
        let id = conns[i].getAttribute("id").match(/connection#([0-9]+)/)[1];
        let from = canvas_points[canvas_connections[id].from];
        let to = canvas_points[canvas_connections[id].to];

        let reversed=false;
        [from, to, reversed] = swapIfReverseOrder(from, to);
        let angle = r2d(Math.atan((to.y-from.y)/(to.x-from.x)));
        let length = len(from, to);

        conns[i].style.left = from.x;
        conns[i].style.top = from.y;
        conns[i].style.transform = `rotate(${angle}deg)`;
        conns[i].style.width = length;
        if(reversed){
            conns[i].classList.add("reversed");
        }
        else{
            conns[i].classList.remove("reversed");
        }
    }
}
function resizeTrains(k_x, k_y, oldOffset, newOffset){
    let trains = document.getElementsByClassName("train");
    for(let i=0; i<trains.length; i++){
        trains[i].style.left = (parseFloat(trains[i].style.left)-oldOffset.x)*k_x + newOffset.x;
        trains[i].style.top = (parseFloat(trains[i].style.top)-oldOffset.y)*k_y + newOffset.y;
    }
}
function keyPress(event){
    if(event.ctrlKey){
        switch(event.key){
            case "c":
            case "C":
                event.preventDefault();
                captureImage();                
                break; 
            case "d":
            case "D":
                event.preventDefault();
                if(event.shiftKey){
                    gotoIndex();
                }
                break;
            case "e":
            case "E":
                event.preventDefault();
                if(event.shiftKey){
                    gotoEditor();
                }
                break;
            case "Enter":
                event.preventDefault();    
                if(event.altKey && event.shiftKey){
                    TURN_ON_OFF();
                }
                else{
                    EMERGENCY_STOP();
                }
                break;
            case "o":
            case "O":
                event.preventDefault();
                uploadXML();                
                break;
            case "s":
            case "S":
                event.preventDefault();
                openGauge();                
                break; 
        }
    }
    else{
        switch(event.key){
            case "h":
            case "H":
                printHelp();
                break;
            case "l":
            case "L":
                changeTrainLight();
                break;
            case "s":
            case "S":
                openStream();
                break;
            case "r":
            case "R":
                makeRequest();
                break;
        }
    }
}
function parseFile(content){
    const parser = new DOMParser();
    const DOM = parser.parseFromString(content, "application/xml");
    loadPoints(DOM.querySelectorAll("point"));
    loadConnections(DOM.querySelectorAll("connection"));
    loadSemaphores(DOM.querySelectorAll("semaphore"));
    loadSwitches(DOM.querySelectorAll("switches switch"));
    loadTrains(DOM.querySelectorAll("train"));
    //updateMetaData();
    paint();
}
function printHelp(){
    Swal.fire({
        title: "Nápověda",
        showCloseButton: true,
        confirmButtonColor: "#0476eb",
        confirmButtonText: "Rozumím!",
        html: `Nacházíte se v přehledu kolejiště. Je-li server vypnutý, je zobrazeno okno s odpovídající hláškou. Možné je ovládat osvětlení lokomotiv, zapnout přenos obrazu z&nbsp;vlaků a manuálně ovládat vlaky. Rovněž je možné aktualizovat snímek kolejiště. Pro zapnutí serveru stiskněte tlačítko zapnutí, nebo klávesovou zkratku Ctrl+Alt+Shift+Enter. Hlavní panel je možné pomocí horního okraje přesouvat po plánku<hr>
        
        Pokud je server zapnutý, manuální posun není dovolen. Rovněž není možné pořizovat snímky kolejiště. Můžete však zadávat nové požadavky jízdy. Zadání dalšího požadavku je možné až po dokončení předchozího. Pro odvrácení hrozícího nebezpečí je součástí kolejiště tlačítko nouzového zastavení. Pokud dojde k nouzovému zastavení (událost může vyvolat uživatel i systém), jediným způsobem zotavení je vypnutí a opětovné zapnutí serveru.<hr>
        
        Po pravé straně obrazovky se nachází přehledová tabulka periferií a jejich aktuálního stavu. Tabulku lze stejně jako hlavní panel po plánku přemisťovat.<hr>
        
        Ve spodní části okna se nachází logovací výstup serveru. Nabídku lze minimalizovat, výpis logů je možné filtrovat, pozastavit, či rovnou vymazat.`
    });
}
function makeRequest(){
    if(document.querySelector(".icon.icon-ride").classList.contains("disabled")){
        return;
    }
    let trainSelect = (function(){
        let acc=`<option selected disabled>--</option>`;
        for(let train in canvas_trains){
            acc += `<option value="${train}">${train}</option>`;
        }
        return acc;
    })();
    let trackSelect = (function(){
        let acc=`<option selected disabled>--</option>`;
        for(let track in canvas_connections){
            acc += `<option value="${track}">${track}</option>`;
        }
        return acc;
    })();
    Swal.fire({
        title: "Nový požadavek jízdy",
        html: `Vlak:
                <br><select class="swal2-input" id="train_id">${trainSelect}</select>
                <br><br>Cílový blok
                <br><select class="swal2-input" id="track_id">${trackSelect}</select>
                <br><br>Rychlost
                <br><br><span id="speed-result">200</span>
                <br><input type="range" min="0" max="255" step="1" value="200" onchange="change_speed();" oninput="change_speed()" id="train_speed">`,
        confirmButtonText: "Zadat jízdu",
        showCancelButton: true,
        cancelButtonText: "Zrušit",
        confirmButtonColor: "#0476eb",
        preConfirm: () => {
            let train_id = document.getElementById("train_id").value;
            let track_id = document.getElementById("track_id").value;
            let train_speed = document.getElementById("train_speed").value;
            fetch(`../../library/send_query.php?train=${train_id}&track=${track_id}&speed=${train_speed}`).then(response => response.json()).then(response => {
                if(response.status == "error"){
                    if(response.description == "Not initialized memory"){
                        offline();
                    }
                    if(response.description == "Train busy"){
                        Err.fire({text: "Vlak již má zadaný požadavek jízdy, vyčkejte prosím na jeho dokončení."})
                    }
                }
                else{
                    online();
                }    
            }).catch(()=>{

            });
        }
    });
}
function change_speed(){
    document.getElementById("speed-result").innerHTML = document.getElementById("train_speed").value;
}
async function openStream(){
    let id = 1;
    let performOpen = true;
    if((Object.entries(canvas_trains).length-Object.entries(STREAMING_FROM_TRAINS).length) > 1){
        await Swal.fire({
            title: "Vyberte vlak",
            input: "select",
            inputOptions: (() => {
                let acc=[];
                for(let index in canvas_trains){
                    if(STREAMING_FROM_TRAINS[index]){
                        continue;
                    }
                    acc[index] = `Vlak ${index}`;
                }
                return acc;
            })(),
            confirmButtonColor: "0476eb"
        }).then((result) => {
            if(result.isConfirmed){
                id = result.value;
            }
            else if(result.isDenied || result.isDismissed){
                performOpen = false;
            }
        });
    }
    if((Object.entries(canvas_trains).length-Object.entries(STREAMING_FROM_TRAINS).length) == 1){
        for(let index in canvas_trains){
            if(!STREAMING_FROM_TRAINS[index]){
                id = index;
                break;
            }
        }
    }
    if(performOpen){
        createWindow(id, canvas_trains[id].ip);
    }
}
async function changeTrainLight(){
    let id = 1;
    let performOpen = true;
    if(Object.entries(canvas_trains).length > 1){
        await Swal.fire({
            title: "Vyberte vlak",
            input: "select",
            inputOptions: (() => {
                let acc=[];
                for(index in canvas_trains){
                    acc[index] = `Vlak ${index}`;
                }
                return acc;
            })(),
            confirmButtonColor: "0476eb"
        }).then((result) => {
            if(result.isConfirmed){
                id = result.value;
            }
            else if(result.isDenied || result.isDismissed){
                performOpen = false;
            }
        });
    }
    if(performOpen){
        fetch(`../../library/loco.php?ip=${canvas_trains[id].ip}`).then(response => response.json()).then(response => {
            if(response.status == "ok"){
                adjustLight(id, response.data.led);        
            }
            else{
                adjustLight(id);        
            }
        }).catch(()=>{
            adjustLight(id);
        });
    }
}
function adjustLight(id, inputValue=0){
    const inputStep = 1;
    Swal.fire({
        title: `Úprava jasu LED vlaku ${id}`,
        html: `<input type="number" value="${inputValue}" step="${inputStep}" class="swal2-input" id="range-value">`,
        input: 'range',
        inputValue,
        inputAttributes: {
            min: '0',
            max: '255',
            step: inputStep.toString(),
        },
        confirmButtonColor:  "#0476eb",
        showCancelButton: true,
        didOpen: () => {
            const inputRange = Swal.getInput();
            const inputNumber = Swal.getPopup().querySelector('#range-value');
            Swal.getPopup().querySelector('output').style.display = 'none'
            inputRange.style.width = '100%'
            inputRange.addEventListener('input', () => {
                inputNumber.value = inputRange.value;
            });
            inputNumber.addEventListener('change', () => {
                inputRange.value = inputNumber.value;
            });
        },
    }).then((result) => {
        if(result.isConfirmed){
            fetch(`../../library/set_intensity.php?ip=${canvas_trains[id].ip}&intensity=${result.value}`).then(response => response.json()).then((response)=>{
                if(response.status == "error"){
                    Err.fire({text: "Nepodařilo se nastavit intenzitu světla"});
                    if(response.description == "Not initialized memory"){
                        offline();
                    }
                }
            });
        }
    });
}
function adjustSpeed(ip, speed){
    fetch(`../../library/set_speed.php?ip=${ip}&speed=${speed}`).then(response => response.json()).then((response)=>{
        if(response.status == "error"){
            Err.fire({text: "Nepodařilo se nastavit rychlost vlaku"});
        }
    });
}
function uploadImage(){
    document.getElementById("file_to_upload_photo").click();
}
function uploadXML(){
    document.getElementById("file_to_upload_xml").click();
}
function captureImage(){
    if(document.querySelector(".icon.icon-upload-photo").classList.contains("disabled")){
        return;
    }
    fetch(`../../library/take_photo.php`).then(response => response.json()).then((response)=>{
        if(response.status == "ok"){
            document.querySelector("#canvas img").src = `photo.jpg?uid=${uniqid()}`;
        }
        else{
            Err.fire({text: "Nepodařilo se vyfotit kolejiště"});
        }
    }).catch(()=>{
        Err.fire({text: "Nepodařilo se vyfotit kolejiště"});
    })
}
function formUploadPhoto() {
    const form = document.getElementById("form_upload_photo");
    const url = new URL(form.action);
    const formData = new FormData(form);
    const searchParams = new URLSearchParams(formData);
    const fetchOptions = {
        method: form.method,
    };
    if(form.method.toLowerCase() === 'post'){
        if(form.enctype === 'multipart/form-data'){
            fetchOptions.body = formData;
        }
        else{
            fetchOptions.body = searchParams;
        }
    }
    else{
      url.search = searchParams;
    }
    fetch(url, fetchOptions).then(response => response.text()).then(response => {
        if(response != "200 OK"){
            Err.fire({text: "Nepodařilo se nahrát fotografii kolejiště na server"});
        }
        else{
            location.reload();
        }
    });
    document.getElementById("file_to_upload_photo").value="";    
}
function formUploadXML() {
    const form = document.getElementById("form_upload_xml");
    const url = new URL(form.action);
    const formData = new FormData(form);
    const searchParams = new URLSearchParams(formData);
    const fetchOptions = {
        method: form.method,
    };
    if(form.method.toLowerCase() === 'post'){
        if(form.enctype === 'multipart/form-data'){
            fetchOptions.body = formData;
        }
        else{
            fetchOptions.body = searchParams;
        }
    }
    else{
      url.search = searchParams;
    }
    fetch(url, fetchOptions).then(response => response.text()).then(response => {
        if(response != "200 OK"){
            Err.fire({text: "Nepodařilo se nahrát XML soubor kolejiště na server"});
        }
        else{
            location.reload();
        }
    });
    document.getElementById("file_to_upload_xml").value="";    
}
function importLocalFile(name){
    fetch(name).then(result => result.text()).then((content) => {
        parseFile(content);
    }).catch(e => console.error(e));
}
async function openGauge(){
    if(document.querySelector(".icon.icon-shunting").classList.contains("disabled")){
        return;
    }
    let id = 1;
    let performOpen = true;
    if((Object.entries(canvas_trains).length-Object.entries(MANUALLY_CONTROLLED_TRAINS).length) > 1){
        await Swal.fire({
            title: "Vyberte vlak",
            input: "select",
            inputOptions: (() => {
                let acc=[];
                for(index in canvas_trains){
                    if(MANUALLY_CONTROLLED_TRAINS[index]){
                        continue;
                    }
                    acc[index] = `Vlak ${index}`;
                }
                return acc;
            })(),
            confirmButtonColor: "0476eb"
        }).then((result) => {
            if(result.isConfirmed){
                id = result.value;
            }
            else if(result.isDenied || result.isDismissed){
                performOpen = false;
            }
        });
    }
    if((Object.entries(canvas_trains).length-Object.entries(MANUALLY_CONTROLLED_TRAINS).length) == 1){
        for(let index in canvas_trains){
            if(!MANUALLY_CONTROLLED_TRAINS[index]){
                id = index;
                break;
            }
        }
    }
    if(performOpen){
        createGaugeWindow(id, canvas_trains[id].ip);
    }
}
function fetchState(){
    fetch("../../library/state.php").then(result => result.json()).then((content)=>{
        updateState(content);
    }).catch(()=>{/* do nothing when status update fails */});
}
function updateState(state){
    if(state.status == "ok"){
        // reset trains visibility
        let trains = document.getElementsByClassName("train");
        for(let i=0;i<trains.length; i++){
            trains[i].classList.add("hidden");
        }
        // reset connections color to green
        let connections = document.getElementsByClassName("connection");
        for(let i=0; i<connections.length; i++){
            let id=connections[i].getAttribute("id").match(/connection#([0-9]+)/)[1];
            setConnectionColor(id, "green");
        }
        // change position of trains
        for(let train in state.data.trains){
            let from = canvas_points[canvas_connections[state.data.trains[train]].from];
            let to = canvas_points[canvas_connections[state.data.trains[train]].to];
            let center = getCenter(from, to);
            center = addPoints(center, OFFSET.train);
            let train_element = document.getElementById("train#"+train);
            train_element.classList.remove("hidden");
            train_element.style.left = center.x;
            train_element.style.top = center.y;
        }
        // update connections colors
        for(let connection in state.data.connections){
            setConnectionColor(connection, shortColor2Long(state.data.connections[connection]));
        }
        // update semaphores
        for(let semaphore in state.data.semaphores){
            document.getElementById("semaphore#"+semaphore).classList.remove("red");
            document.getElementById("semaphore#"+semaphore).classList.remove("yellow");
            document.getElementById("semaphore#"+semaphore).classList.remove("green");
            if(state.data.semaphores[semaphore] != "-"){
                document.getElementById("semaphore#"+semaphore).classList.add(color_converter[state.data.semaphores[semaphore]]);
            }
        }
        // update switches
        for(let switchEl in state.data.switches){
            document.getElementById("switch#"+switchEl).classList.remove("straight");
            document.getElementById("switch#"+switchEl).classList.remove("diverted");
            if(state.data.switches[switchEl] != "U"){
                document.getElementById("switch#"+switchEl).classList.add(state_converter[state.data.switches[switchEl]]);
            }
        }
        // check for emergency stop
        if(state.data.serverstate == "RUNNING"){
            online();
        }
        else if(state.data.serverstate == "EMERGENCY_STOP"){
            stopped();
        }
        last_server_state = state.data.serverstate;
        // print console logs
        if(logs_paused){
            return;
        }
        const consolebar = document.querySelector("#consolebar .log-content");
        let logs = Object.entries(state.data.logs);
        let old_last_id = last_console_message_id;
        if(logs.length > 0){
            last_console_message_id = logs[logs.length-1][0];
        }
        let acc =[];
        for(let i=logs.length-1; i>=0; i--){
            if(logs[i][0] == old_last_id){
                break;
            }
            let line = document.createElement("div");
            let flag = document.createElement("span");
            let msgTime = logs[i][1][0];
            let msgText = logs[i][1][1];
            let [erReg, erFlagText, erMessageText] = getErrorRegex(msgText);
            let [wrReg, wrFlagText, wrMessageText] = getWarningRegex(msgText);
            let [inReg, inFlagText, inMessageText] = getInfoRegex(msgText);
            let [noReg, noFlagText, noMessageText] = getNoticeRegex(msgText);
            let messageTime = time_tFormat(msgTime);
            if(erReg){
                flag.innerText = erFlagText;
                line.classList.add("error");
                line.appendChild(document.createTextNode(messageTime));
                line.appendChild(flag);
                line.appendChild(document.createTextNode(erMessageText));
            }
            else if(wrReg){
                flag.innerText = wrFlagText;
                line.classList.add("warning");
                line.appendChild(document.createTextNode(messageTime));
                line.appendChild(flag);
                line.appendChild(document.createTextNode(wrMessageText));
            }
            else if(inReg){
                flag.innerText = inFlagText;
                line.classList.add("info");
                line.appendChild(document.createTextNode(messageTime));
                line.appendChild(flag);
                line.appendChild(document.createTextNode(inMessageText));
            }
            else if(noReg){
                flag.innerText = noFlagText;
                line.classList.add("notice");
                line.appendChild(document.createTextNode(messageTime));
                line.appendChild(flag);
                line.appendChild(document.createTextNode(noMessageText));
            }
            acc.push(line);
        }
        while(acc.length > 0){
            consolebar.insertBefore(acc.pop(), consolebar.firstChild);
        }
    }
    else if(state.status == "error" && state.description == "Not initialized memory"){
        offline();
        let semaphores = document.querySelectorAll(".light-state");
        for(let i=0; i<semaphores.length; i++){
            semaphores[i].classList.remove("red");
            semaphores[i].classList.remove("yellow");
            semaphores[i].classList.remove("green");
        }
        let switches = document.querySelectorAll(".switch-state");
        for(let i=0; i<switches.length; i++){
            switches[i].classList.remove("straight");
            switches[i].classList.remove("diverted");
        }
    }
}
function getErrorRegex(text){
    let erReg = text.match(/ERROR:(.*)/);
    let chReg = text.match(/CHYBA:(.*)/);
    if(erReg){
        return [true, "ERROR: ", erReg[1]];
    }
    else if(chReg){
        return [true, "CHYBA: ", chReg[1]];
    }
    return [false, null, null];
}
function getWarningRegex(text){
    let wrReg = text.match(/WARNING:(.*)/);
    let vaReg = text.match(/VAROVÁNÍ:(.*)/);
    if(wrReg){
        return [true, "WARNING: ", wrReg[1]];
    }
    else if(vaReg){
        return [true, "VAROVÁNÍ: ", vaReg[1]];
    }
    return [false, null, null];
}
function getInfoRegex(text){
    let inReg = text.match(/INFO:(.*)/);
    if(inReg){
        return [true, "INFO: ", inReg[1]];
    }
    return [false, null, null];
}
function getNoticeRegex(text){
    let noReg = text.match(/NOTICE:(.*)/);
    let poReg = text.match(/POZNÁMKA:(.*)/);
    if(noReg){
        return [true, "NOTICE: ", noReg[1]];
    }
    else if(poReg){
        return [true, "POZNÁMKA: ", poReg[1]];
    }
    return [false, null, null];
}

function gotoIndex(){
    location.href="./";
}
function gotoEditor(){
    location.href="./editor/";
}
function open_close_console(){
    document.querySelector("#consolebar").classList.toggle("minimized");
}
function run_pause_console(){
    logs_paused = !logs_paused;
    document.querySelector("#consolebar .pause").classList.toggle("paused");
}
function clear_console(){
    document.querySelector("#consolebar .log-content").innerHTML = "";
}
function show_hide_errors(){
    document.querySelector("#consolebar").classList.toggle("hide-errors");
}
function show_hide_warnings(){
    document.querySelector("#consolebar").classList.toggle("hide-warnings");
}
function show_hide_infos(){
    document.querySelector("#consolebar").classList.toggle("hide-infos");
}
function show_hide_notices(){
    document.querySelector("#consolebar").classList.toggle("hide-notices");
}
function online(){
    server_state == "ONLINE";
    document.body.classList.remove("disconnected");
    document.body.classList.remove("stopped");
    document.querySelector(".icon.icon-ride").classList.remove("disabled");
    document.querySelector(".icon.icon-upload-photo").classList.add("disabled");
    document.querySelector(".icon.icon-emergency").classList.remove("disabled");
    document.querySelector(".icon.icon-shunting").classList.add("disabled");
    // close all shunting windows
    let sh_trains = document.querySelectorAll('.window.window-small');
    for(let i=0; i<sh_trains.length; i++){
        sh_trains[i].outerHTML = "";
    }
    MANUALLY_CONTROLLED_TRAINS = {};
}
function stopped(){
    server_state == "STOPPED";
    document.body.classList.remove("disconnected");
    document.body.classList.add("stopped");
    document.querySelector(".icon.icon-ride").classList.add("disabled");
    document.querySelector(".icon.icon-upload-photo").classList.add("disabled");
    document.querySelector(".icon.icon-emergency").classList.add("disabled");
    document.querySelector(".icon.icon-shunting").classList.remove("disabled");
}
function offline(){
    server_state == "OFFLINE";
    last_console_message_id = null;
    document.body.classList.add("disconnected");
    document.body.classList.remove("stopped");
    document.querySelector(".icon.icon-ride").classList.add("disabled");
    document.querySelector(".icon.icon-upload-photo").classList.remove("disabled");
    document.querySelector(".icon.icon-emergency").classList.add("disabled");
    document.querySelector(".icon.icon-shunting").classList.remove("disabled");
}
function EMERGENCY_STOP(){
    if(document.querySelector(".icon.icon-emergency").classList.contains("disabled")){
        return;
    }
    fetch(`../../library/emergency_stop.php`).then(response => response.json()).then((response) => {
        if(response.status == "error"){
            Err.fire("Nepovedlo se provést nouzové zastavení");
        }
        else if(response.status == "ok"){
            stopped();
        }
    })
}
async function _turn_on(){
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    await fetch("../../library/start_server.php", { signal: controller.signal }).catch(()=>{});
}
async function _turn_off(){
    await fetch("../../library/stop_server.php");
}
function TURN_ON_OFF(){
    if(document.body.classList.contains("disconnected")){
        _turn_on();
    }
    else{
        _turn_off();
    }
}

addEventListener("resize", resizeModel);
document.body.addEventListener("keydown", keyPress);

document.getElementById("file_to_upload_photo").addEventListener("change", formUploadPhoto); 
document.getElementById("file_to_upload_xml").addEventListener("change", formUploadXML); 

document.querySelector(".link.link-overview").addEventListener("click", gotoIndex);
document.querySelector(".link.link-editor").addEventListener("click", gotoEditor);
document.querySelector(".icon.icon-ride").addEventListener("click", makeRequest);
document.querySelector(".icon.icon-stream").addEventListener("click", openStream);
document.querySelector(".icon.icon-light").addEventListener("click", changeTrainLight);
document.querySelector(".icon.icon-upload-photo").addEventListener("click", captureImage);
document.querySelector(".icon.icon-upload-xml").addEventListener("click", uploadXML);
document.querySelector(".icon.icon-help").addEventListener("click", printHelp);
document.querySelector(".icon.icon-shunting").addEventListener("click", openGauge);
document.querySelector(".icon.icon-turn-on-off").addEventListener("click", TURN_ON_OFF);
document.querySelector(".icon.icon-emergency").addEventListener("click", EMERGENCY_STOP);

document.querySelector("#consolebar .filterbar .errors").addEventListener("click", show_hide_errors)
document.querySelector("#consolebar .filterbar .warnings").addEventListener("click", show_hide_warnings)
document.querySelector("#consolebar .filterbar .infos").addEventListener("click", show_hide_infos)
document.querySelector("#consolebar .filterbar .notices").addEventListener("click", show_hide_notices)
document.querySelector("#consolebar .delete").addEventListener("click", clear_console)
document.querySelector("#consolebar .pause").addEventListener("click", run_pause_console)
document.querySelector("#consolebar .cross").addEventListener("click", open_close_console)

window.setInterval(fetchState, 166);