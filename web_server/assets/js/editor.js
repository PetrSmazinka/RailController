var MODE = "normal";
const OFFSET = {
    point: 7.5,
    connection: 5.5,
};
const warning = (e) => {console.warn(e);};
const r2d = rad => (rad * 180.0) / Math.PI;
const len = (x1, y1, x2, y2) => Math.sqrt(Math.pow((x2-x1), 2) + Math.pow((y2-y1), 2));
const pointElementCallback = (event, point, method) => {
    if((MODE == "normal" && method == "click") || method == "dblclick"){
        if(event.ctrlKey){
            selectPoint(point);
        }
        else{
            // handle multiple selections
            resetSelection("connections");
            while(selectedPoints.length > 1){
                selectedPoints.shift().classList.remove("selected");
            } 
            if(selectedPoints[0] == point){
                selectedPoints.shift().classList.remove("selected");
            }
            else{
                if(selectedPoints.length > 0){
                    selectedPoints.shift().classList.remove("selected");
                }
                selectPoint(point);
            }
        }
    }
};
const connectionElementCallback = (event, connection) => {
    if(MODE == "normal"){
        if(event.ctrlKey){
            selectConnection(connection);
        }
        else{
            // handle multiple selections
            resetSelection("points");
            while(selectedConnections.length > 1){
                selectedConnections.shift().classList.remove("selected");
            } 
            if(selectedConnections[0] == connection){
                selectedConnections.shift().classList.remove("selected");
            }
            else{
                if(selectedConnections.length > 0){
                    selectedConnections.shift().classList.remove("selected");
                }
                selectConnection(connection);
            }
        }
    }
};
const saveAsFile = (content, name="output") => {
    const link = document.createElement("a");
    const file = new Blob([content], {type: "application/xml"});
    link.href = URL.createObjectURL(file);
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
};
var canvasHistory = [];
var canvasHistoryPointer = 0;
var pointElementCounter = 0;
var pointElementClickCallbackContainer = [];
var pointElementDblClickCallbackContainer = [];
var pointElementMouseDownCallbackContainer = [];
var connectionElementCounter = 0;
var connectionElementCallbackContainer = [];
var selectedPoints = [];
var selectedConnections = [];
var isBeingMoved = false;
var movingPointsStartingPositions = [];
var mouseCoords = {x: undefined, y: undefined};
function normalMode(){
    console.info("Normal mode activated");
    MODE = "normal";
    document.body.classList.remove("insert");
    document.body.classList.remove("move");
    document.querySelectorAll(".icon").forEach((elm)=>{elm.classList.remove("active")});
    document.querySelector(".icon.icon-normal").classList.add("active");
}
function insertMode(){
    if(!imageLoaded){
        return;
    }
    MODE = "insert";
    document.body.classList.add("insert");
    document.body.classList.remove("move");
    document.querySelectorAll(".icon").forEach((elm)=>{elm.classList.remove("active")});
    document.querySelector(".icon.icon-insert").classList.add("active");
}
function moveMode(){
    if(!imageLoaded){
        return;
    }
    MODE = "move";
    document.body.classList.remove("insert");
    document.body.classList.add("move");
    document.querySelectorAll(".icon").forEach((elm)=>{elm.classList.remove("active")});
    document.querySelector(".icon.icon-move").classList.add("active");
}
function moreToggle(){
    if(document.body.classList.contains("verbose")){
        document.body.classList.remove("verbose");
        document.querySelector(".icon.icon-more").classList.remove("active");
    }
    else{
        document.body.classList.add("verbose");
        document.querySelector(".icon.icon-more").classList.add("active");
    }
}
function openFile(){
    Swal.fire({
        title: "Zvolte zdroj obrázku",
        showDenyButton: true,
        confirmButtonText: "Nahrát fotografii z počítače",
        denyButtonText: "Vytvořit snímek kolejiště",
        confirmButtonColor: "0476eb"
    }).then(result => {
        if(result.isConfirmed){
            _openFile();
        }
        else if(result.isDenied){
            _captureImage();
        }
    });
}
function _captureImage(){
    Swal.fire({
        title: "Vytvářím snímek",
        showConfirmButton: false,
        showCloseButton: false,
        allowOutsideClisk: false,
        allowEscapeKey: false,
        didRender: () => {
            Swal.showLoading()
        }
    });
    fetch(`../../library/take_photo.php`).then(response => response.json()).then((response)=>{
        if(response.status == "ok"){
            Swal.close();
            document.querySelector("#canvas img").src = `../photo.jpg?uid=${uniqid()}`;
            document.querySelector(".icon.icon-insert").classList.remove("disabled");
            document.querySelector(".icon.icon-move").classList.remove("disabled");
            document.querySelector(".icon.icon-settings").classList.remove("disabled");
            document.querySelector(".icon.icon-import").classList.remove("disabled");
            imageLoaded = true;
        }
        else{
            Err.fire({text: "Nepodařilo se vyfotit kolejiště"});
        }
    }).catch(()=>{
        Err.fire({text: "Nepodařilo se vyfotit kolejiště"});
    })
}
function _openFile(){
    document.getElementById("file_to_open").click();
}
function importFile(){
    if(!imageLoaded){
        return;
    }
    document.getElementById("file_to_import").click();
}
function resetSelection(what = null){
    if(what == null || what == "points"){
        while(selectedPoints.length){
            selectedPoints.shift().classList.remove("selected");
        }
    }
    if(what == null || what == "connections"){
        while(selectedConnections.length){
            selectedConnections.shift().classList.remove("selected");
        }
    }
    selectionChanged();
}
function selectAll(what = null){
    let points = document.querySelectorAll("div.point");
    let connections = document.querySelectorAll("div.connection");
    if(what == null || what == "points"){
        for(let i=0; i<points.length; i++){
            selectPoint(points[i]);
        }
    }
    if(what == null || what == "connections"){
        for(let i=0; i<connections.length; i++){
            selectConnection(connections[i]);
        }
    }
}
function selectPoint(point){
    if(!selectedPoints.includes(point)){
        selectedPoints.push(point);
    }
    point.classList.add("selected");
    selectionChanged();
}
function selectConnection(connection){
    if(!selectedConnections.includes(connection)){
        selectedConnections.push(connection);
    }
    connection.classList.add("selected");
    selectionChanged();
}
function isSelected(returnArray = false){
    if(selectedPoints.length > 0 && selectedConnections.length > 0){
        error("E101");
    }
    else if(selectedPoints.length > 0){
        if(returnArray){
            return [true, "points"];
        }
        return true;
    }
    else if(selectedConnections.length > 0){
        if(returnArray){
            return [true, "connections"];
        }
        return true;
    }
    if(returnArray){
        return [false, null];
    }
    return false;
}
function selectionChanged(){
    // 2+ points 
    if(selectedPoints.length >= 2){
        document.querySelector(".icon.icon-connect").classList.remove("disabled");
    }
    else{
        document.querySelector(".icon.icon-connect").classList.add("disabled");
    }
    // 1 connection
    if(selectedConnections.length == 1){
        document.querySelector(".icon.icon-edit").classList.remove("disabled");
    }
    else{
        document.querySelector(".icon.icon-edit").classList.add("disabled");
    }
    // 1+ connection
    if(selectedConnections.length > 0){
        document.querySelector(".icon.icon-direction").classList.remove("disabled");
    }
    else{
        document.querySelector(".icon.icon-direction").classList.add("disabled");
    }
    // 1+ point / connection
    if(selectedPoints.length > 0 || selectedConnections.length > 0){
        document.querySelector(".icon.icon-unselect").classList.remove("disabled");
        document.querySelector(".icon.icon-delete").classList.remove("disabled");
    }
    else{
        document.querySelector(".icon.icon-unselect").classList.add("disabled");
        document.querySelector(".icon.icon-delete").classList.add("disabled");
    }
    // all points
    if(selectedPoints.length == points.children.length){
        document.querySelector(".icon.icon-points").classList.add("disabled");
    }
    else{
        document.querySelector(".icon.icon-points").classList.remove("disabled");
    }
    // all connections
    if(selectedConnections.length == connections.children.length){
        document.querySelector(".icon.icon-connections").classList.add("disabled");
    }
    else{
        document.querySelector(".icon.icon-connections").classList.remove("disabled");
    }
}
function makeConnection(){
    if(selectedPoints.length == 2){
        createConnection(selectedPoints[0], selectedPoints[1]);
    }
    else if(selectedPoints.length > 2){
        createMultipleConnections(selectedPoints);
    }
    else{
        warning("Spojení lze provést pouze mezi právě dvěma body");
    }
}
function deleteElement(){
    let elements = [];
    const sortElementsFn = (a, b) => {
        if(a.type == "point" && b.type == "point"){
            return 0;
        }
        else if(a.type == "point" && b.type == "connection"){
            return -1;
        }
        else if(a.type == "connection" && b.type == "point"){
            return 1;
        }
        else{
            return 0;
        }
    }
    while(selectedConnections.length !== 0){
        let removedConnection = selectedConnections.shift();
        let removedConnectionId = removedConnection.getAttribute("id").match(/connection#([0-9]+)/)[1];
        let from = connections.querySelector('connection[id="'+removedConnectionId+'"]').getAttribute("from");
        let to = connections.querySelector('connection[id="'+removedConnectionId+'"]').getAttribute("to");
        let reversed = connections.querySelector('connection[id="'+removedConnectionId+'"]').getAttribute("reversed");
        removeConnection(removedConnection);
        elements.push({type: "connection", id: removedConnectionId, attributes: {from: from, to: to, reversed: reversed}});
    }
    while(selectedPoints.length !== 0){
        let removedPoint = selectedPoints.shift();
        let removedPointId = removedPoint.getAttribute("id").match(/point#([0-9]+)/)[1];
        let x = parseFloat(points.querySelector('point[id="'+removedPointId+'"]').getAttribute("x"));
        let y = parseFloat(points.querySelector('point[id="'+removedPointId+'"]').getAttribute("y"));
        let affectedConnections = removePoint(removedPoint);
        elements.push({type: "point", id: removedPointId, attributes: a2r({x: x, y: y})});
        affectedConnections.forEach((value)=>{
            elements.push({type: "connection", id: value.id, attributes: value.attributes});
        });
    }
    elements.sort(sortElementsFn);
    historyCapture({operation: "delete", elements: elements});
    selectionChanged();
}
function autoCreatePoint(x, y, autoID=null){
    let id = autoID !== null ? autoID : ++pointElementCounter;
    addPoint(id, x, y);
    paintPoint(id, x, y);
    selectionChanged();
    return id;
}
function createPoint(event) {
    let x = event.clientX
    let y = event.clientY;
    let id = autoCreatePoint(x, y);
    historyCapture({operation: "create", elements: [{type: "point", id: id, attributes: a2r({x: x, y: y})}]});
}
function paintPoint(id, x, y){
    let point = document.createElement("div");
    point.setAttribute("class", "point");
    point.setAttribute("id", "point#"+ id)
    point.style.left = x-OFFSET.point;
    point.style.top = y-OFFSET.point;
    pointElementClickCallbackContainer[id] = (e)=>{e.stopPropagation();pointElementCallback(e, point, "click")}; 
    pointElementDblClickCallbackContainer[id] = (e)=>{e.stopPropagation();pointElementCallback(e, point, "dblclick")};
    pointElementMouseDownCallbackContainer[id] = (e)=>{e.stopPropagation();beginMove(e, point);}; 
    point.addEventListener("click", pointElementClickCallbackContainer[id]);
    point.addEventListener("dblclick", pointElementDblClickCallbackContainer[id])
    point.addEventListener("mousedown", pointElementMouseDownCallbackContainer[id]);
    document.getElementById("canvas").appendChild(point);

}
function removePoint(point){
    let pointID = Number.isInteger(point) ? point : getXMLElementId(point, "point");
    let pointEL = Number.isInteger(point) ? document.getElementById("point#"+point) : point;
    let affectedConnections = affectConnectionsWhenDelete(pointID);
    deletePoint(pointID);
    unpaint(pointEL);
    return affectedConnections;
}
function autoRemovePoint(pointID){
    removePoint(pointID);
}
function createMultipleConnections(points){
    let conns = [];
    for(let i=0; i<(points.length-1); i++){
        let id, reversed;
        [id, reversed] = createConnection(points[i], points[i+1], MODE, false);
        let from = getXMLElementId(points[i], "point");
        let to = getXMLElementId(points[i+1], "point");
        conns.push({type: "connection", id: id, attributes: {from: from, to: to, reversed: reversed}});
    }
    historyCapture({operation: "create", elements: conns});
}
function autoCreateConnection(id1, id2, autoID = null, switches=[], multioccupy=[]){
    let p1 = document.getElementById("point#"+id1);
    let p2 = document.getElementById("point#"+id2);
    return createConnection(p1, p2, "normal", false, autoID, switches, multioccupy);
}
function createConnection(point1, point2, mode=MODE, history=true, autoID = null, switches=[], multioccupy=[]){
    let tp1 = point1;
    let tp2 = point2;
    let isReversed = false;
    if(parseFloat(point2.style.left) < parseFloat(point1.style.left)){
        let tmp = point1;
        point1 = point2;
        point2 = tmp;
        isReversed= true;
    }
    let x1 = parseFloat(point1.style.left) + OFFSET.point;
    let y1 = parseFloat(point1.style.top)  + OFFSET.connection;
    let x2 = parseFloat(point2.style.left) + OFFSET.point;
    let y2 = parseFloat(point2.style.top)  + OFFSET.connection;
    let angle = r2d(Math.atan((y2-y1)/(x2-x1)));
    let length = len(x1, y1, x2, y2);
    let id = autoID !== null ? autoID : ++connectionElementCounter;
    let from = getXMLElementId(tp1, "point");
    let to = getXMLElementId(tp2, "point");
    addConnection(id, from, to, isReversed, switches, multioccupy);
    paintConnection(id, x1, y1, angle, length, isReversed, switches, multioccupy);
    selectionChanged();
    if(history){
        // TODO update to support switches
        historyCapture({operation: "create", elements: [{type: "connection", id: id, attributes: {from: from, to: to, reversed: isReversed}}]});
        return id;
    }
    return [id, isReversed];
}
function paintConnection(id, x1, y1, angle, length, isReversed, switches=[], multioccupy=[]){
    let connection = document.createElement("div");
    connection.setAttribute("class", "connection");
    connection.setAttribute("id", "connection#"+ id);
    connection.setAttribute("data-id", id);
    connection.setAttribute("data-verbose", id);
    connection.style.left = x1;
    connection.style.top = y1;
    connection.style.transform = `rotate(${angle}deg)`;
    connection.style.width = length;
    if(isReversed){connection.classList.add("reversed");}
        else{connection.classList.remove("reversed");}
    if(switches.length > 0){connection.classList.add("switch");}
        else{connection.classList.remove("switch");}
    if(multioccupy.length > 0){connection.classList.add("multioccupy");}
        else{connection.classList.remove("multioccupy");}
    connectionElementCallbackContainer[id] = (e)=>{e.stopPropagation();connectionElementCallback(e, connection)};
    connection.addEventListener("click", connectionElementCallbackContainer[id]);
    document.getElementById("canvas").appendChild(connection);
}
function removeConnection(connection){
    let connectionID = Number.isInteger(connection) ? connection : getXMLElementId(connection, "connection");
    let connectionEL = Number.isInteger(connection) ? document.getElementById("connection#"+connection) : connection;
    deleteConnection(connectionID);
    unpaint(connectionEL);
}
function reverseConnections(){
    for(let i=0; i<selectedConnections.length; i++){
        let canvasEl = selectedConnections[i];
        let xmlEl = connections.querySelector('connection[id="'+getXMLElementId(canvasEl, "connection")+'"]');
        xmlEl.setAttribute("reversed", !(xmlEl.getAttribute("reversed")==="true"));
        canvasEl.classList.toggle("reversed");
    }
}
function autoRemoveConnection(connectionID){
    removeConnection(connectionID);
}
function autoMovePoint(id, coords){
    let canvasPoint = document.getElementById("point#"+id);
    let xmlPoint = points.querySelector('point[id="'+id+'"]');
    canvasPoint.style.left = coords.x - OFFSET.point;
    canvasPoint.style.top = coords.y - OFFSET.point;
    xmlPoint.setAttribute("x", coords.x);
    xmlPoint.setAttribute("y", coords.y);
}
function unpaint(id){
    id.outerHTML = "";
}
function affectConnectionsWhenDelete(pointID){
    let conns = connections.querySelectorAll("connection");
    let removedConnections = [];
    for(let i=0; i<conns.length; i++){
        if(conns[i].getAttribute("from") == pointID || conns[i].getAttribute("to") == pointID){
            let connID = conns[i].getAttribute("id");
            let from = connections.querySelector('connection[id="'+connID+'"]').getAttribute("from");
            let to = connections.querySelector('connection[id="'+connID+'"]').getAttribute("to");
            let reversed = connections.querySelector('connection[id="'+connID+'"]').getAttribute("reversed");
            removeConnection(document.getElementById("connection#"+connID));
            removedConnections.push({id: connID, attributes: {from: from, to: to, reversed: reversed}});
        }
    }
    return removedConnections;
}
function affectConnectionsWhenMove(pointID){
    let conns = connections.querySelectorAll("connection");
    for(let i=0; i<conns.length; i++){
        if(conns[i].getAttribute("from") != pointID && conns[i].getAttribute("to") != pointID){
            continue;
        }
        let x1, y1, x2, y2, angle, length, fromID, toID, reversed=false;
        let connectionElement = document.getElementById("connection#"+conns[i].getAttribute("id"));
        fromID = conns[i].getAttribute("from");
        toID = conns[i].getAttribute("to");
        x1 = parseFloat(points.querySelector('point[id="'+fromID+'"]').getAttribute("x"));
        y1 = parseFloat(points.querySelector('point[id="'+fromID+'"]').getAttribute("y"));
        x2 = parseFloat(points.querySelector('point[id="'+toID+'"]').getAttribute("x"));
        y2 = parseFloat(points.querySelector('point[id="'+toID+'"]').getAttribute("y"));
        if(x2 < x1){
            [x1, y1, x2, y2] = [x2, y2, x1, y1];
            reversed=true;
        }
        angle = r2d(Math.atan((y2-y1)/(x2-x1)));
        length = len(x1, y1, x2, y2);
        connectionElement.style.left = x1;
        connectionElement.style.top = y1 - OFFSET.point + OFFSET.connection;
        connectionElement.style.transform = `rotate(${angle}deg)`;
        connectionElement.style.width = length;
        if(reversed){
            connectionElement.classList.add("reversed");
        }
        else{
            connectionElement.classList.remove("reversed");
        }
        conns[i].setAttribute("reversed", reversed);
    }
}
function mouseClick(event){
    if(MODE == "insert"){
        createPoint(event);
    }
    else if(MODE == "normal" || MODE == "move"){
        resetSelection();
    }
}
function keyPress(event){
    if(isBeingMoved){
        return;
    }
    if(event.ctrlKey){
        switch(event.key){
            case "a":
            case "A":
                event.preventDefault();
                resetSelection();
                selectAll(); 
                break;
            case "c":
            case "C":
                event.preventDefault();
                resetSelection();
                selectAll("connections");
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
            case "o":
            case "O":
                event.preventDefault();
                if(event.shiftKey){
                    openFile();
                }
                else{
                    importFile();
                }                
                break;
            case "p":
            case "P":
                event.preventDefault();
                resetSelection();
                selectAll("points");
                break;
            case "s":
            case "S":
                event.preventDefault();
                downloadXML();
                break;
            case "y":
            case "Y":
                event.preventDefault();
                historyForward();
                break;
            case "z":
            case "Z":
                event.preventDefault();
                historyBack();    
        }
    }
    else{
        switch(event.key){
            case "c":
            case "C":
                makeConnection();
                break;
            case "d":
            case "D":
            case "Delete":
                deleteElement();
                break;
            case "e":
            case "E":
                editConnectionForm();
                break;
            case "h":
            case "H":
                printHelp();
                break;
            case "i":
            case "I":
            case "Insert":
                insertMode();
                break;
            case "l":
            case "L":
                newSemaphore();
                break;
            case "m":
            case "M":
                moveMode();
                break;
            case "n":
            case "N":
                normalMode();
                break;
            case "r":
            case "R":
            case "Escape":
                resetSelection();
                break;
            case "s":
            case "S":
                settings();
                break;
            case "t":
            case "T":
                newTrain();
                break;
            case "v":
            case "V":
                moreToggle();
                break;
            case "x":
            case "X":
                reverseConnections();
                break;
        }
    }
}
function beginMove(event, point){
    if(MODE == "move"){
        if(event.ctrlKey){
            selectPoint(point);
        }
        else if(!selectedPoints.includes(point)){
            resetSelection();
            selectPoint(point);
        }
        isBeingMoved = true;
        mouseCoords.x = event.clientX;
        mouseCoords.y = event.clientY;
        for(let i=0; i<selectedPoints.length; i++){
            let xmlId = getXMLElementId(selectedPoints[i], "point");
            let x = getXMLAttributeById(points, xmlId, "x");
            let y = getXMLAttributeById(points, xmlId, "y");
            movingPointsStartingPositions.push(a2r({x: x, y: y}));
        }
    }
}
function mouseMove(event){
    if(isBeingMoved){
        let x_diff = event.clientX - mouseCoords.x;
        let y_diff = event.clientY - mouseCoords.y;
        for(let i=0; i<selectedPoints.length; i++){
            let x = parseFloat(selectedPoints[i].style.left) + x_diff;
            let y = parseFloat(selectedPoints[i].style.top) + y_diff;
            selectedPoints[i].style.left = x;
            selectedPoints[i].style.top = y;
            let pointID = selectedPoints[i].getAttribute("id").match(/point#([0-9]+)/)[1];
            let xmlPoint = points.querySelector('point[id="'+pointID+'"]')
            xmlPoint.setAttribute("x", x+OFFSET.point);
            xmlPoint.setAttribute("y", y+OFFSET.point);
        }
        for(let i=0; i<selectedPoints.length; i++){
            let pointID = selectedPoints[i].getAttribute("id").match(/point#([0-9]+)/)[1];
            affectConnectionsWhenMove(pointID);
        }
        mouseCoords.x = event.clientX;
        mouseCoords.y = event.clientY;
    }
}
function mouseUp(event){
    let elements = [];
    for(let i=0; i<selectedPoints.length; i++){
        let pointID = getXMLElementId(selectedPoints[i], "point")
        let x = getXMLAttributeById(points, pointID, "x", true);
        let y = getXMLAttributeById(points, pointID, "y", true);
        let from = movingPointsStartingPositions.shift();
        elements.push({type: "point", id: pointID, attributes: {from: from, to: a2r({x: x, y: y})}});

    }
    if(elements.length > 0 && MODE == "move" && isBeingMoved){
        historyCapture({operation: "move", elements: elements});
    }
    if(isBeingMoved){
        isBeingMoved = false;
    }
    movingPointsStartingPositions = [];
}
function getCanvasSize(){
    let canvas = document.getElementById("canvas");
    return {x:canvas.offsetWidth, y:canvas.offsetHeight};
}
function getCanvasOffset(){
    let bounding = document.getElementById("canvas").getBoundingClientRect();
    return {x: bounding.x, y: bounding.y};
}
function resizeModel(){
    let oldSize = getXMLSize();
    let oldOffset = getXMLOffset();
    let newSize = getCanvasSize();
    let newOffset = getCanvasOffset();
    setXMLSize(newSize);
    setXMLOffset(newOffset);
    let k_x = newSize.x / oldSize.x;
    let k_y = newSize.y / oldSize.y;
    let o_x = newOffset.x - oldOffset.x;
    let o_y = newOffset.y - oldOffset.y;
    resizePoints(k_x, k_y, oldOffset, newOffset);
    resizeConnections();
}
function resizePoints(k_x, k_y, oldOffset, newOffset){
    let ponns = document.getElementsByClassName("point");
    for(let i=0; i<ponns.length; i++){
        let id = ponns[i].getAttribute("id").match(/point#([0-9]+)/)[1];
        let x = (parseFloat(ponns[i].style.left) - oldOffset.x) * k_x  + newOffset.x;
        let y = (parseFloat(ponns[i].style.top) - oldOffset.y)* k_y + newOffset.y
        ponns[i].style.left = x;
        ponns[i].style.top = y;
        let xmlPoint = points.querySelector('point[id="'+id+'"]');
        xmlPoint.setAttribute("x", x + OFFSET.point);
        xmlPoint.setAttribute("y", y + OFFSET.point);
    }
}
function resizeConnections(){
    let conns = document.getElementsByClassName("connection");
    for(let i=0; i<conns.length; i++){
        let id = conns[i].getAttribute("id").match(/connection#([0-9]+)/)[1];
        let fromPointID = connections.querySelector('connection[id="'+id+'"]').getAttribute("from");
        let toPointID = connections.querySelector('connection[id="'+id+'"]').getAttribute("to");
        let fromPoint = points.querySelector('point[id="'+fromPointID+'"]');
        let toPoint = points.querySelector('point[id="'+toPointID+'"]');
        let x1 = parseFloat(fromPoint.getAttribute("x"));
        let y1 = parseFloat(fromPoint.getAttribute("y"));
        let x2 = parseFloat(toPoint.getAttribute("x"));
        let y2 = parseFloat(toPoint.getAttribute("y"));
        if(x2 < x1){
            [x1, y1, x2, y2] = [x2, y2, x1, y1];
        }
        let angle = r2d(Math.atan((y2-y1)/(x2-x1)));
        let length = len(x1, y1, x2, y2);
        conns[i].style.left = x1;
        conns[i].style.top = y1 - OFFSET.point + OFFSET.connection;
        conns[i].style.transform = `rotate(${angle}deg)`; // should not change;
        conns[i].style.width = length;
    }
}
function historyCapture(event = {operation: "void", elements: []}){
    if(canvasHistoryPointer > 0){
        for(;canvasHistoryPointer > 0; canvasHistoryPointer--){
            canvasHistory.pop();
        }
    }
    canvasHistory.push(event);
}
function historyBack(){
    if(canvasHistoryPointer < canvasHistory.length){
        canvasHistoryPointer++;
        let event = canvasHistory[canvasHistory.length-canvasHistoryPointer];
        switch(event.operation){
            case "create":
                historyOperationDelete(event.elements);
                break;
            case "delete":
                historyOperationCreate(event.elements);
                break;
            case "move":
                historyOperationMove(event.elements, "from");
                break;
        }
        selectionChanged();
    }
}
function historyForward(){
    if(canvasHistoryPointer > 0){
        let event = canvasHistory[canvasHistory.length-canvasHistoryPointer];
        switch(event.operation){
            case "create":
                historyOperationCreate(event.elements);
                break;
            case "delete":
                historyOperationDelete(event.elements);
                break;
            case "move":
                historyOperationMove(event.elements, "to");
                break;
        }
        canvasHistoryPointer--;
        selectionChanged();
    }
}
function historyOperationCreate(elements){
    elements.forEach((value)=>{
        if(value.type=="point"){
            let coords = r2a(value.attributes);
            autoCreatePoint(coords.x, coords.y, value.id);
        }
        else if(value.type=="connection"){
            autoCreateConnection(value.attributes.from, value.attributes.to, value.id);
        }
    });
}
function historyOperationDelete(elements){
    elements.forEach((value)=>{
        if(value.type=="point"){
            autoRemovePoint(value.id);
        }
        else if(value.type=="connection"){
            autoRemoveConnection(value.id);
        }
    });
}
function historyOperationMove(elements, direction){
    elements.filter(value => value.type == "point").forEach(value => {
        let coords;
        if(direction == "from"){
            coords = r2a(value.attributes.from);
        }
        else if(direction == "to"){
            coords = r2a(value.attributes.to);
        }
        autoMovePoint(value.id, coords);
    });
    elements.filter(value => value.type == "point").forEach(value => {
        affectConnectionsWhenMove(value.id);
    })
}
function getXMLAttributeById(data, id, attribute, isFloat = false){
    let value;
    if(data == points){
        value = data.querySelector('point[id="'+id+'"]').getAttribute(attribute);
    }
    else if(data == connections){
        value = data.querySelector('connection[id="'+id+'"]').getAttribute(attribute);
    }    
    return isFloat ? parseFloat(value) : value;
}
function getXMLContentById(data, id){
    let elmt;
    if(data == points){
        elmt = Array.from(data.querySelector('point[id="'+id+'"]').children);
    }
    else if(data == connections){
        elmt = Array.from(data.querySelector('connection[id="'+id+'"]').children);
    }    
    return elmt;
}
function getXMLElementId(element, type){
    if(type == "point"){
        return element.getAttribute("id").match(/point#([0-9]+)/)[1];
    }
    else if(type == "connection"){
        return element.getAttribute("id").match(/connection#([0-9]+)/)[1];
    }
}
function printHelp(){
    Swal.fire({
        title: "Nápověda",
        showCloseButton: true,
        confirmButtonColor: "#0476eb",
        confirmButtonText: "Rozumím!",
        html: `Editor slouží k vytvoření XML souboru reprezentujícího kolejiště. Nejprve je nutné nahrát snímek kolejiště. Je možné nahrát obrázek z disku, anebo nechat systém pořídit snímek kolejiště. Po nahrání souboru lze volitelně importovat již existující XML soubor.<hr>
        
        Standarní postup vytvoření se skládá z vytvoření bodů v&nbsp;režimu kreslení (I), jejich vybrání v normálním režimu. Výběr více elementů se provádí se stisknutou klávesou Ctrl. Následně se stiskem tlačítka nebo klávesy C provede vytvoření spojení. Směr spojení lze modifikovat pomocí tlačítka nebo klávesy X. Pro posun bodů je nutné se přepnout do režimu posunu. Podporován je přesun jednoho, ale i více bodů zároveň.<hr>
        
        Nastavení jednotlivých úseků, konkrétně vyžadované polohy výhybek a přiřazení úseků se sdílenou obsazeností se provádí po vybrání právě jednoho úseku a následného otevření odpovídající nabídky (E). Obecná nastavení plánku zahrnující semafory a výhybky lze otevřít pomocí speciálního tlačítka nebo klávesy S. V&nbsp;této nabídce probíhá specifikace počtu vlaků a jejich výchozích úseků. Systém umožňuje automatickou detekci vlaků, které jsou připojeny ke stejné Wi-Fi síti.`
    });
}
function gotoIndex(){
    location.href="../";
}
function gotoEditor(){
    location.href="./";
}

document.getElementById("canvas").addEventListener("click", mouseClick);
document.body.addEventListener("keydown", keyPress);
document.body.addEventListener("mousemove", mouseMove);
document.body.addEventListener("mouseup", mouseUp);
addEventListener("resize", resizeModel);
document.querySelector(".link.link-overview").addEventListener("click", gotoIndex);
document.querySelector(".link.link-editor").addEventListener("click", gotoEditor);
document.querySelector(".icon.icon-normal").addEventListener("click", normalMode);
document.querySelector(".icon.icon-insert").addEventListener("click", insertMode);
document.querySelector(".icon.icon-move").addEventListener("click", moveMode);
document.querySelector(".icon.icon-more").addEventListener("click", moreToggle);
document.querySelector(".icon.icon-connect").addEventListener("click", makeConnection);
document.querySelector(".icon.icon-direction").addEventListener("click", reverseConnections);
document.querySelector(".icon.icon-points").addEventListener("click", () => selectAll("points"));
document.querySelector(".icon.icon-connections").addEventListener("click", () => selectAll("connections"));
document.querySelector(".icon.icon-unselect").addEventListener("click", () => resetSelection(null));
document.querySelector(".icon.icon-delete").addEventListener("click", deleteElement);
document.querySelector(".icon.icon-edit").addEventListener("click", editConnectionForm);
document.querySelector(".icon.icon-settings").addEventListener("click", settings);
document.querySelector(".icon.icon-open").addEventListener("click", openFile);
document.querySelector(".icon.icon-import").addEventListener("click", importFile);
document.querySelector(".icon.icon-history-back").addEventListener("click", historyBack);
document.querySelector(".icon.icon-history-forward").addEventListener("click", historyForward);
document.querySelector(".icon.icon-download").addEventListener("click", () => downloadXML());
document.querySelector(".icon.icon-help").addEventListener("click", printHelp);

