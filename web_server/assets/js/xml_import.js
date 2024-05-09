// XML importer
var imageLoaded = false;
var pointIdConvertor = {};
var connectionIdConvertor = {};
var switchIdConvertor = {};

function clearDataStructures(){
    pointIdConvertor = {};
    connectionIdConvertor = {};
    switchIdConvertor = {};
}

function importLocalFile(name){
    fetch(name).then(result => result.text()).then((content) => {
        parseFile(content);
    }).catch(e => console.error(e));
}
function updateMetaData(){
    let connections = Array.from(xmlDoc.querySelectorAll("connection"));
    for(let i=0; i<connections.length; i++){
        updateSwitchMetaInfo(connections[i].getAttribute("id"));
    }
}
function changeBackgrounImage(binary){
    let dataURL = URL.createObjectURL(binary);
    document.querySelector("img").src = dataURL;
}
function parseFile(content){
    const parser = new DOMParser();
    const DOM = parser.parseFromString(content, "application/xml");
    loadPoints(DOM.querySelectorAll("point"));
    loadConnections(DOM.querySelectorAll("connection"));
    loadSwitches(DOM.querySelectorAll("switches switch"));
    loadSemaphores(DOM.querySelectorAll("semaphore"));
    loadTrains(DOM.querySelectorAll("train"));
    updateMetaData();
    clearDataStructures();
}
function loadPoints(points){
    for(let i=0; i<points.length; i++){
        let x = r2a_x(parseFloat(points[i].getAttribute("x")));
        let y = r2a_y(parseFloat(points[i].getAttribute("y")));
        let id = points[i].getAttribute("id");
        let createdID = autoCreatePoint(x, y);
        pointIdConvertor[id] = createdID;
    }
}
function loadConnections(connections){
    for(let i=0; i<connections.length; i++){
        let from = connections[i].getAttribute("from");
        let to = connections[i].getAttribute("to");
        let id = connections[i].getAttribute("id");
        from = pointIdConvertor[from];
        to = pointIdConvertor[to];
        // switches & multioccupy
        let switches=[];
        let multioccupy=[];
        let arr = Array.from(connections[i].children);
        arr.forEach((value)=>{
            if(value.nodeName == "switch"){
                let id = value.getAttribute("id");
                let position = value.getAttribute("position");
                switches.push({id: "abs!"+id, position: position});
            }
            else if(value.nodeName == "multioccupy"){
                let id = value.getAttribute("id");
                multioccupy.push("abs!"+id);
            }
        });
        let createObj = autoCreateConnection(from, to, null, switches, multioccupy);
        let createID = createObj[0];
        connectionIdConvertor[id] = createID;
    }
    let multioccupiesXML = xmlDoc.querySelectorAll("connection multioccupy");
    for(let i=0; i<multioccupiesXML.length; i++){
        let possible_absid = multioccupiesXML[i].getAttribute("id").match(/abs!([0-9]+)/);
        if(possible_absid != null){
            let absid = possible_absid[1];
            multioccupiesXML[i].setAttribute("id", connectionIdConvertor[absid]);
        }
    }
}
function loadSwitches(switches){
    for(let i=0;i<switches.length;i++){
        let id = switches[i].getAttribute("id");
        let pin = switches[i].getAttribute("pin");
        store_switches_pins[store_switches] = pin;
        store_switches++;
        switchIdConvertor[id] = store_switches;
    }
    let switchesXML = xmlDoc.querySelectorAll("connection switch");
    for(let i=0; i<switchesXML.length; i++){
        let possible_absid = switchesXML[i].getAttribute("id").match(/abs!([0-9]+)/);
        if(possible_absid != null){
            let absid = possible_absid[1];
            switchesXML[i].setAttribute("id", switchIdConvertor[absid]);
        }
    }
}
function loadSemaphores(semaphores){
    for(let i=0; i<semaphores.length; i++){
        let id = semaphores[i].getAttribute("id");
        let connection = semaphores[i].getAttribute("connection");
        let mspin = semaphores[i].getAttribute("mspin");
        let lspin = semaphores[i].getAttribute("lspin");
        store_semaphores.push({connection: connectionIdConvertor[connection], MSPin: mspin, LSPin: lspin});
    }
}
function loadTrains(trains){
    for(let i=0; i<trains.length; i++){
        let id = trains[i].getAttribute("id");
        let ip = trains[i].getAttribute("ip");
        let start = trains[i].getAttribute("start");
        store_trains.push({ip: ip, start: connectionIdConvertor[start]});
    }
}
function formOpenSubmit() {
    const form = document.getElementById("form_open");
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
    fetch(url, fetchOptions).then(response => response.blob()).then(response => {
        changeBackgrounImage(response);
        document.querySelector(".icon.icon-insert").classList.remove("disabled");
        document.querySelector(".icon.icon-move").classList.remove("disabled");
        document.querySelector(".icon.icon-settings").classList.remove("disabled");
        document.querySelector(".icon.icon-import").classList.remove("disabled");
        imageLoaded = true;
    });
    document.getElementById("file_to_open").value="";    
}
function formImportSubmit() {
    const form = document.getElementById("form_import");
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
        parseFile(response);
    });
    document.getElementById("file_to_import").value="";    
}
document.getElementById("file_to_open").addEventListener("change", formOpenSubmit); 
document.getElementById("file_to_import").addEventListener("change", formImportSubmit); 