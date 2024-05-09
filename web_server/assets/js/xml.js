// XML builder
var xmlDoc = document.implementation.createDocument(null, "model");
var size = xmlDoc.createElement("size");
var points = xmlDoc.createElement("points");
var connections = xmlDoc.createElement("connections");
var switches = xmlDoc.createElement("switches");
var semaphores = xmlDoc.createElement("semaphores");
var trains = xmlDoc.createElement("trains");

//var switchesContent = xmlDoc.createTextNode("");
var relativePoints = xmlDoc.createElement("points");
// bindings
//switches.appendChild(switchesContent);
xmlDoc.getElementsByTagName("model")[0].appendChild(relativePoints);
xmlDoc.getElementsByTagName("model")[0].appendChild(connections);
xmlDoc.getElementsByTagName("model")[0].appendChild(switches);
xmlDoc.getElementsByTagName("model")[0].appendChild(semaphores);
xmlDoc.getElementsByTagName("model")[0].appendChild(trains);

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
function prepareXMLsettings(){
    // update state
    //switchesContent.nodeValue = store_switches
    for(let i=0; i<store_switches; i++){
        // TODO kontrola na undefined
        let switchEl = xmlDoc.createElement("switch");
        switchEl.setAttribute("id", i+1);
        switchEl.setAttribute("pin", store_switches_pins[i]);
        switches.appendChild(switchEl);
        if(typeof store_switches_pins[i] === "undefined"){
            return false;
        }
    }
    for(let i=0; i<store_semaphores.length; i++){
        if(store_semaphores[i] == undefined){
            continue;
        }
        let semaphore = xmlDoc.createElement("semaphore");
        semaphore.setAttribute("id", i+1);
        semaphore.setAttribute("connection", store_semaphores[i].connection);
        semaphore.setAttribute("mspin", store_semaphores[i].MSPin);
        semaphore.setAttribute("lspin", store_semaphores[i].LSPin);
        semaphores.appendChild(semaphore);
    }
    for(let i=0; i<store_trains.length; i++){
        if(store_trains[i] == undefined){
            continue;
        }
        let train = xmlDoc.createElement("train");
        train.setAttribute("id", i+1);
        train.setAttribute("ip", store_trains[i].ip);
        train.setAttribute("start", store_trains[i].start);
        trains.appendChild(train);
    }
    return true;
}
function cleanXMLgenerator(){
    switches.innerHTML = "";
    semaphores.innerHTML = "";
    trains.innerHTML = "";
}
function setXMLSize(obj = {x:0, y:0}){
    size.setAttribute("width", obj.x);
    size.setAttribute("height", obj.y);
}
function getXMLSize(){
    let x = parseFloat(size.getAttribute("width"));
    let y = parseFloat(size.getAttribute("height"));
    return {x:x, y:y};
}
function setXMLOffset(obj = {x:0, y:0}){
    size.setAttribute("offset_width", obj.x);
    size.setAttribute("offset_height", obj.y);
}
function getXMLOffset(){
    let x = parseFloat(size.getAttribute("offset_width"));
    let y = parseFloat(size.getAttribute("offset_height"));
    return {x:x, y:y};
}
function addPoint(pointCounter, x, y){
    let point = xmlDoc.createElement("point");
    point.setAttribute("id", pointCounter);
    point.setAttribute("x", x);
    point.setAttribute("y", y);
    points.appendChild(point);
}
function addConnection(id, from, to, isReversed, switches=[], multioccupy=[]){
    let connection = xmlDoc.createElement("connection");
    connection.setAttribute("id", id);
    connection.setAttribute("from", from);
    connection.setAttribute("to", to);
    connection.setAttribute("reversed", isReversed);
    switches.forEach((value)=>{
        let switchEl = xmlDoc.createElement("switch");
        switchEl.setAttribute("id", value.id);
        switchEl.setAttribute("position", value.position);
        connection.appendChild(switchEl);
    });
    multioccupy.forEach((value)=>{
        let multioccupy = xmlDoc.createElement("multioccupy");
        multioccupy.setAttribute("id", value);
        connection.appendChild(multioccupy);
    });
    connections.appendChild(connection);
}
function addRail(railCounter, type, ids){
    let rail = xmlDoc.createElement("rail");
    rail.setAttribute("id", railCounter);
    rail.setAttribute("type", type);
    rail.setAttribute("connections", ids.join(", "));
    rails.appendChild(rail);
}
function deletePoint(id){
    points.querySelector(`point[id="${id}"]`).outerHTML = "";
}
function deleteConnection(id){
    if(connections.querySelector(`connection[id="${id}"]`)){
        connections.querySelector(`connection[id="${id}"]`).outerHTML = "";
    }
}
function returnXML(){
    if(!prepareXMLsettings()){
        cleanXMLgenerator();
        Err.fire({title: "Soubor není možné uložit", text:"Některé výhybky nemají určený GPIO pin"});
        return {success: false, data: null};
    }
    relativePoints.innerHTML = a2r_points(points.cloneNode(true)).innerHTML;
    
    var serializer = new XMLSerializer();
    var xmlString = serializer.serializeToString(xmlDoc);

    cleanXMLgenerator();
    return {success: true, data: xmlString};
}
function downloadXML(){
    let xml = returnXML();
    if(xml.success){
        saveAsFile(xml.data, "scheme.xml");
    }
}

setXMLSize(getCanvasSize());
setXMLOffset(getCanvasOffset());