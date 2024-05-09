var store_switches = 0;
var store_switches_pins = {};
var store_semaphores=[];
var store_trains = [];
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

function checkClassList(id){
    let children = Array.from(xmlDoc.querySelector('connection[id="'+id+'"]').children);
    let switch_count = 0;
    let multioccupy_count = 0;
    children.forEach((value)=>{
        if(value.nodeName == "switch"){
            switch_count++;
        }
        else if(value.nodeName == "multioccupy"){
            multioccupy_count++;
        }
    });
    if(switch_count > 0){document.getElementById("connection#"+id).classList.add("switch");}
        else{document.getElementById("connection#"+id).classList.remove("switch");}
    if(multioccupy_count > 0){document.getElementById("connection#"+id).classList.add("multioccupy");}
        else{document.getElementById("connection#"+id).classList.remove("multioccupy");}
}
function updateSwitchMetaInfo(connection_id){
    let children = Array.from(xmlDoc.querySelector('connection[id="'+connection_id+'"]').children);
    let metadata = connection_id;
    let switches_m = [];
    let multioccupy_m = [];
    for(let i=0; i<children.length; i++){
        if(children[i].nodeName == "switch"){
            switches_m.push(children[i].getAttribute("id") + children[i].getAttribute("position"));
        }
        else if(children[i].nodeName == "multioccupy"){
            multioccupy_m.push(children[i].getAttribute("id"));
        }
    }
    if(switches_m.length > 0){
        metadata += ": " + switches_m.join(", ");
    }
    if(multioccupy_m.length > 0){
        metadata += "(" + multioccupy_m.join(",") + ")";
    }
    document.getElementById("connection#"+connection_id).setAttribute("data-verbose", metadata);
}
function changeSwitchCount(count){
    store_switches = count;
    let collection = Array.from(xmlDoc.querySelectorAll('switch'));
    for(let i=0; i<collection.length; i++){
        let curr_id = collection[i].getAttribute("id");
        if(curr_id > count){
            let curr_el = xmlDoc.querySelector('switch[id="'+curr_id+'"]');
            let parent_id = curr_el.parentNode.getAttribute("id"); 
            curr_el.outerHTML = "";
            checkClassList(parent_id);
        }
    }
    document.getElementById("switches_list").outerHTML = getSwitches();
}
function addSwitchPin(id, pin){
    // TODO pin control
    store_switches_pins[id] = pin;
}
function addSemaphore(connection, MSPin, LSPin){
    // TODO pin control
    store_semaphores.push({connection: connection, MSPin: MSPin, LSPin: LSPin});
}
function editSemaphore(id, connection, MSPin, LSPin){
    // TODO pin control
    store_semaphores[id] = {connection: connection, MSPin: MSPin, LSPin: LSPin};
}
function deleteSemaphore(id){
    store_semaphores.splice(id, 1);
}
function addTrain(ip, start){
    store_trains.push({ip: ip, start: start});
}
function editTrain(id, ip, start){
    store_trains[id] = {ip: ip, start: start};
}
function deleteTrain(id){
    store_trains.splice(id, 1);
}
function deleteTrains(){
    store_trains=[];
}
function getSwitches(){
    const header = `<table border="1" id="switches_list"><tr><th>ID výhybky</th><th>Pin</th><th></th></tr>`;
    const footer = `</table>`;
    if(store_switches == 0){
        return `${header}
        <tr><td colspan="3">Žádné výhybky nebyly vloženy</td></tr></table>`;
    }
    let acc = header;
    for(let i=0; i< store_switches; i++){
        let pin = store_switches_pins[i] ? store_switches_pins[i] : undefined;
        let text_pin = pin==undefined ? `<span class="undefinedPin">NEZADÁNO</span>` : pin;
        acc += `<tr>
                    <td>${i+1}</td>
                    <td>${text_pin}</td>
                    <td>
                        <i class="fa-solid fa-pencil" onclick="updateSwitchPin(${i}, ${pin})"></i>
                    </td>
                </tr>`;
    }
    acc +=footer;
    return acc;
}
function getSemaphores(){
    const header = `<table border="1"><tr><th>ID semaforu</th><th>Přidružený úsek</th><th>MSPin</th><th>LSPin</th><th></th></tr>`;
    const footer = `</table>`;
    if(store_semaphores.length <= 0 || (store_semaphores.length==1 && store_semaphores[0] == undefined)){
        return `${header}
        <tr><td colspan="5">Žádné semafory nebyly vloženy</td></tr></table>`;
    }
    let acc = header;
    store_semaphores.forEach((value, index) => {
        acc += `<tr>
                    <td>${index+1}</td>
                    <td>${value.connection}</td>
                    <td>${value.MSPin}</td>
                    <td>${value.LSPin}</td>
                    <td>
                        <i class="fa-solid fa-pencil" onclick="updateSemaphore(${index}, ${value.connection}, ${value.MSPin}, ${value.LSPin})"></i>
                        <i class="fa-solid fa-trash-can" onclick="removeSemaphore(${index})"></i>
                    </td>
                </tr>`;
    });
    acc +=footer;
    return acc;
}
function getTrains(){
    const header = `<table border="1"><tr><th>ID vláčku</th><th>IP adresa</th><th>Výchozí úsek</th><th></th></tr>`;
    const footer = `</table>`;
    if(store_trains.length <= 0|| (store_trains.length==1 && store_trains[0] == undefined)){
        return `${header}
        <tr><td colspan="4">Žádné vláčky nebyly vloženy</td></tr></table>`;
    }
    let acc = header;
    store_trains.forEach((value, index) => {
        //index=1;
        acc += `<tr>
                    <td>${index+1}</td>
                    <td>${value.ip}</td>
                    <td>${value.start}</td>
                    <td>
                        <i class="fa-solid fa-pencil" onclick="updateTrain(${index}, '${value.ip}', ${value.start})"></i>
                        <i class="fa-solid fa-trash-can" onclick="removeTrain(${index})"></i>
                    </td>
                </tr>`;
    });
    acc +=footer;
    return acc;
}
function getSwitchesAndMultioccupy(switches, connection_id){
    const headerS = `<table border="1"><tr><th>ID výhybky</th><th>Poloha</th><th></th></tr>`; 
    const footerS = `</table>`;
    const headerM = `<table border="1"><tr><th>Kolizní úsek</th><th></th></tr>`; 
    const footerM = `</table>`
    let switch_count = 0;
    let multioccupy_count = 0;
    let accS = headerS;
    let accM = headerM;
    switches.forEach((value, index)=>{
        if(value.nodeName == "switch"){
            switch_count++;
            let id = value.getAttribute("id");
            let position = value.getAttribute("position");
            accS += `<tr>
                        <td>${id}</td>
                        <td>${position}</td>
                        <td>
                            <i class="fa-solid fa-pencil" onclick="updateSwitch(${connection_id}, ${id}, '${position}');"></i>
                            <i class="fa-solid fa-trash-can" onclick="removeSwitch(${connection_id}, ${id}, '${position}');"></i>
                        </td>
                    </tr>`;
        }
        else if(value.nodeName == "multioccupy"){
            multioccupy_count++;
            let id = value.getAttribute("id");
            accM += `<tr>
                        <td>${id}</td>
                        <td>
                            <i class="fa-solid fa-pencil" onclick="updateMultioccupy(${connection_id}, ${id});"></i>
                            <i class="fa-solid fa-trash-can" onclick="removeMultioccupy(${connection_id}, ${id});"></i>
                        </td>
                    </tr>`;
        }
    });
    if(switch_count == 0){
        accS += `<tr><td colspan="3">Úsek nevyžaduje žádné nastavení výhybek</td></tr>`;
    }
    if(multioccupy_count == 0){
        accM += `<tr><td colspan="2">Úsek nekoliduje s jinými úseky</td></tr>`;
    }
    accS += footerS;
    accM += footerM;
    return [accS, accM];
}
function settings(){
    if(!imageLoaded){
        return;
    }
    Swal.fire({
        title: "Nastavení plánku",
        html:  `<h3>Výhybky</h3>
                    Počet výhybek: <input type="number" value="${store_switches}" onchange="changeSwitchCount(this.value)"><br><br>
                    ${getSwitches()}
                <h3>Semafory</h3>
                    ${getSemaphores()}
                    <input type="button" value="Přidat semafor" onclick="newSemaphore('settings');">
                <h3>Vláčky</h3>
                    ${getTrains()}
                    <input type="button" value="Přidat vláček" onclick="newTrain('settings');">
                    <input type="button" value="Načíst vláčky automaticky" onclick="autoLoadTrains();">`,
        showConfirmButton: false,
        showCloseButton: true,
        width: "60vw",
        allowOutsideClick: false,
        animation: false
    });
}
function updateSwitchPin(id, pin){
    Swal.fire({
        title: "Úprava výhybky "+ (id+1),
        html: `Připojený pin:
                <br><input type="number" class="swal2-input" id="pin">`,
        confirmButtonText: "Uložit",
        showCancelButton: true,
        cancelButtonText: "Zrušit",
        confirmButtonColor: "#0476eb",
        didRender: () => {
            document.getElementById("pin").value = pin;
        },
        preConfirm: () => {
            let new_pin = document.getElementById("pin").value;
            addSwitchPin(id, new_pin)
        }
    }).then(()=>{
        settings();
    });
}
function newSemaphore(origin=null){
    Swal.fire({
        title: "Nový semafor",
        html: `Připojit semafor k úseku:
                <br><input type="number" class="swal2-input" id="connected_rail">
                <br>MSPin:
                <br><input type="number" class="swal2-input" id="mspin">
                <br>LSPin:
                <br><input type="number" class="swal2-input" id="lspin">`,
        confirmButtonText: "Uložit",
        showCancelButton: true,
        cancelButtonText: "Zrušit",
        confirmButtonColor: "#0476eb",
        preConfirm: () => {
            let connection = document.getElementById("connected_rail").value;
            let mspin = document.getElementById("mspin").value;
            let lspin = document.getElementById("lspin").value;
            let afterwards = ()=>{
                if(origin == "settings"){
                    settings();
                }
            };
            if(!!document.getElementById("connection#"+connection)){
                addSemaphore(connection, mspin, lspin);
                afterwards();
            }
            else{
                Err.fire({text: "Zadaný úsek neexistuje"}).then(afterwards);
            }
        }
    });
}
function updateSemaphore(id, connection, MSPin, LSPin){
    Swal.fire({
        title: "Úprava semaforu "+id,
        html: `Připojit semafor k úseku:
                <br><input type="number" class="swal2-input" id="connected_rail">
                <br>MSPin:
                <br><input type="number" class="swal2-input" id="mspin">
                <br>LSPin:
                <br><input type="number" class="swal2-input" id="lspin">`,
        confirmButtonText: "Uložit",
        showCancelButton: true,
        cancelButtonText: "Zrušit",
        confirmButtonColor: "#0476eb",
        didRender: () => {
            document.getElementById("connected_rail").value = connection;
            document.getElementById("mspin").value = MSPin;
            document.getElementById("lspin").value = LSPin;
        },
        preConfirm: () => {
            let new_connection = document.getElementById("connected_rail").value;
            let new_mspin = document.getElementById("mspin").value;
            let new_lspin = document.getElementById("lspin").value;
            editSemaphore(id, new_connection, new_mspin, new_lspin);
        }
    }).then(()=>{
        settings();
    });
}
function removeSemaphore(id){
    deleteSemaphore(id);
    Swal.close();
    settings();
}
function newTrain(origin=null){
    Swal.fire({
        title: "Nový vlak",
        html:  `IP adresa vlaku:
                <br><input type="text" class="swal2-input" id="ip_address">
                <br>Výchozí úsek:
                <br><input type="number" class="swal2-input" id="start_rail">`,
        confirmButtonText: "Uložit",
        showCancelButton: true,
        cancelButtonText: "Zrušit",
        confirmButtonColor: "#0476eb",
        preConfirm: () => {
            let ip = document.getElementById("ip_address").value;
            let start = document.getElementById("start_rail").value;
            addTrain(ip, start);
            Success.fire({text: "Vlak vytvořen"});
        }
    }).then(()=>{
        if(origin == "settings"){
            settings();
        }
    });
}
function updateTrain(id, ip, start){
    Swal.fire({
        title: "Úprava vlaku",
        html:  `IP adresa vlaku:
                <br><input type="text" class="swal2-input" id="ip_address">
                <br>Výchozí úsek:
                <br><input type="number" class="swal2-input" id="start_rail">`,
        confirmButtonText: "Uložit",
        showCancelButton: true,
        cancelButtonText: "Zrušit",
        confirmButtonColor: "#0476eb",
        didRender: () => {
            document.getElementById("ip_address").value = ip;
            document.getElementById("start_rail").value = start;
        },
        preConfirm: () => {
            let ip = document.getElementById("ip_address").value;
            let start = document.getElementById("start_rail").value;
            editTrain(id, ip, start);
        }
    }).then(()=>{
        settings();
    });
}
function removeTrain(id){
    deleteTrain(id);
    Swal.close();
    settings();
}
function editConnectionForm(){
    if(document.querySelector(".icon.icon-edit").classList.contains("disabled")){
        return;
    }
    let id = getXMLElementId(selectedConnections[0], "connection");
    let children = getXMLContentById(connections, id);
    let tables = getSwitchesAndMultioccupy(children, id);
    Swal.fire({
        title: "Nastavení úseku " + id,
        html:  `<h3>Vyžadovaná poloha výhybek</h3>
                ${tables[0]}
                <input type="button" value="Přidat výhybku" onclick="newSwitch(${id});">
                <h3>Kolize s úseky</h3>
                ${tables[1]}
                <input type="button" value="Přidat kolizi" onclick="newMultioccupy(${id});">`,
        showConfirmButton: false,
        allowOutsideClick: false,
        showCloseButton: true,
        animation: false,
    });
}
function newSwitch(id){
    let switchSelect = (function(){
        let acc=`<option selected disabled>--</option>`;
        for(let i=1; i<=store_switches;i++){
            acc += `<option value="${i}">${i}</option>`;
        }
        return acc;
    })();
    let switchPosition = `<option selected disabled>--</option><option value="S">S</option><option value="D">D</option>`;
    Swal.fire({
        title: "Nová výhybka",
        html: `Vyžadovaná poloha výhybky:
                <br><select class="swal2-input" id="switch_id">${switchSelect}</select>
                <select class="swal2-input" id="switch_position">${switchPosition}</select>`,
        confirmButtonText: "Uložit",
        showCancelButton: true,
        cancelButtonText: "Zrušit",
        confirmButtonColor: "#0476eb",
        preConfirm: () => {
            let sw_id = document.getElementById("switch_id").value;
            let sw_position = document.getElementById("switch_position").value;
            let other_position = sw_position == "S" ? "D" : "S";
            let elmt = xmlDoc.querySelector('switch[id="'+sw_id+'"][position="'+sw_position+'"]');
            let elmt_id;
            if(elmt){
                elmt_id = elmt.parentNode.getAttribute("id");
                if(id == elmt_id){
                    return Swal.showValidationMessage('Tato poloha výhybky je již tomuto úseku přidělena');    
                }
                return Swal.showValidationMessage('Tato poloha výhybky je již přidělena úseku '+elmt_id);
            }
            elmt = xmlDoc.querySelector('switch[id="'+sw_id+'"][position="'+other_position+'"]');
            if(elmt && (elmt_id = elmt.parentNode.getAttribute("id")) == id){
                return Swal.showValidationMessage('Stejnému úseku nelze přidělit opačné polohy stejné výhybky');
            }
            let switchNode = xmlDoc.createElement("switch");
            switchNode.setAttribute("id", sw_id);
            switchNode.setAttribute("position", sw_position);
            xmlDoc.querySelector('connection[id="'+id+'"]').appendChild(switchNode);
            document.getElementById("connection#"+id).classList.add("switch");
            updateSwitchMetaInfo(id);
        }
    }).then(()=>{
        editConnectionForm();
    });
}
function updateSwitch(id, switch_id, switch_position){
    let switchSelect = (function(){
        let acc=`<option selected disabled>--</option>`;
        for(let i=1; i<=store_switches;i++){
            acc += `<option value="${i}">${i}</option>`;
        }
        return acc;
    })();
    let switchPosition = `<option selected disabled>--</option><option value="S">S</option><option value="D">D</option>`;
    Swal.fire({
        title: "Úprava výhybky",
        html: `Vyžadovaná poloha výhybky:
                <br><select class="swal2-input" id="switch_id">${switchSelect}</select>
                <select class="swal2-input" id="switch_position">${switchPosition}</select>`,
        confirmButtonText: "Uložit",
        showCancelButton: true,
        cancelButtonText: "Zrušit",
        confirmButtonColor: "#0476eb",
        didRender: () =>{
            document.getElementById("switch_id").value = switch_id;
            document.getElementById("switch_position").value = switch_position;
        },
        preConfirm: () => {
            let sw_id = document.getElementById("switch_id").value;
            let sw_position = document.getElementById("switch_position").value;
            let other_position = sw_position == "S" ? "D" : "S";
            let elmt = xmlDoc.querySelector('switch[id="'+sw_id+'"][position="'+sw_position+'"]');
            let elmt_id;
            if(elmt){
                elmt_id = elmt.parentNode.getAttribute("id");
                if(id == elmt_id){
                    return Swal.showValidationMessage('Tato poloha výhybky je již tomuto úseku přidělena');    
                }
                return Swal.showValidationMessage('Tato poloha výhybky je již přidělena úseku '+elmt_id);
            }
            // delete old option
            xmlDoc.querySelector('connection[id="'+id+'"] switch[id="'+switch_id+'"][position="'+switch_position+'"]').outerHTML = "";
            // add new
            let switchNode = xmlDoc.createElement("switch");;
            switchNode.setAttribute("id", sw_id);
            switchNode.setAttribute("position", sw_position);
            xmlDoc.querySelector('connection[id="'+id+'"]').appendChild(switchNode);
            updateSwitchMetaInfo(id);
        }
    }).then(()=>{
        editConnectionForm();
    });
}
function removeSwitch(connection_id, switch_id, switch_position){
    xmlDoc.querySelector('connection[id="'+connection_id+'"] switch[id="'+switch_id+'"][position="'+switch_position+'"]').outerHTML = "";
    checkClassList(connection_id);
    updateSwitchMetaInfo(connection_id);
    editConnectionForm();
}
function newMultioccupy(id){
    let connectionSelect = (function(){
        let acc=`<option selected disabled>--</option>`;
        let conns = xmlDoc.querySelectorAll('connection');
        for(let i=0; i<conns.length;i++){
            let curr_id = conns[i].getAttribute("id");
            if(curr_id == id){
                continue;
            }
            let conti=false;
            let children = Array.from(xmlDoc.querySelector('connection[id="'+id+'"]').children);
            for(let j=0; j< children.length; j++){
                if(children[j].nodeName == "multioccupy" && children[j].getAttribute("id") == curr_id){
                    conti=true;
                    break;
                }
            }
            if(conti){
                continue;
            }
            acc += `<option value="${curr_id}">${curr_id}</option>`;
        }
        return acc;
    })();
    Swal.fire({
        title: "Nová kolize úseku "+id,
        html: `Kolizní úsek:
                <br><select class="swal2-input" id="connection_id">${connectionSelect}</select>`,
        confirmButtonText: "Uložit",
        showCancelButton: true,
        cancelButtonText: "Zrušit",
        confirmButtonColor: "#0476eb",
        preConfirm: () => {
            let conn_id = document.getElementById("connection_id").value;
            if(conn_id == id){
                return Swal.showValidationMessage('Úsek nemůže kolidovat se sebou samým');
            }
            let multioccupyNode = xmlDoc.createElement("multioccupy");
            multioccupyNode.setAttribute("id", conn_id);
            xmlDoc.querySelector('connection[id="'+id+'"]').appendChild(multioccupyNode);
            document.getElementById("connection#"+id).classList.add("multioccupy");
            updateSwitchMetaInfo(id);
        }
    }).then(()=>{
        editConnectionForm();
    });
}
function updateMultioccupy(id, collision_id){
    let connectionSelect = (function(){
        let acc=``;
        let conns = xmlDoc.querySelectorAll('connection');
        for(let i=0; i<conns.length;i++){
            let curr_id = conns[i].getAttribute("id");
            if(curr_id == id){
                continue;
            }
            let selected="";
            if(curr_id == collision_id){
                selected=` selected="selected"`;
            }
            acc += `<option value="${curr_id}"${selected}>${curr_id}</option>`;
        }
        return acc;
    })();
    Swal.fire({
        title: "Nová kolize úseku "+id,
        html: `Kolizní úsek:
                <br><select class="swal2-input" id="connection_id">${connectionSelect}</select>`,
        confirmButtonText: "Uložit",
        showCancelButton: true,
        cancelButtonText: "Zrušit",
        confirmButtonColor: "#0476eb",
        preConfirm: () => {
            let conn_id = document.getElementById("connection_id").value;
            if(conn_id == id){
                return Swal.showValidationMessage('Úsek nemůže kolidovat se sebou samým');
            }
            //delete old
            xmlDoc.querySelector('connection[id="'+id+'"] multioccupy[id="'+collision_id+'"]').outerHTML = "";
            // set new
            let multioccupyNode = xmlDoc.createElement("multioccupy");
            multioccupyNode.setAttribute("id", conn_id);
            xmlDoc.querySelector('connection[id="'+id+'"]').appendChild(multioccupyNode);
            document.getElementById("connection#"+id).classList.add("multioccupy");
            updateSwitchMetaInfo(id);
        }
    }).then(()=>{
        editConnectionForm();
    });
}
function removeMultioccupy(connection_id, collision_id){
    xmlDoc.querySelector('connection[id="'+connection_id+'"] multioccupy[id="'+collision_id+'"]').outerHTML = "";
    checkClassList(connection_id);
    updateSwitchMetaInfo(connection_id);
    editConnectionForm();
}
function autoLoadTrains(){
    fetch("../../library/train_list.txt?uid="+uniqid()).then(response => response.text()).then(async(response)=>{
        let lines = response.split("\n");
        let update=true;
        let refresh=true;
        let error= false;
        if(lines.length == 3){
            await Swal.fire({
                title: "Co chcete provést?",
                html: `Vaši lokální síť jste skenovali naposledy<br><b>
                       ${lines[0]}.</b><br>
                       Chcete použít tato data nebo provést nové skenování?
                       Skenování může v závislosti na velikosti Vaší sítě
                       trvat i několik minut. Veškerá data v tabulce vlaků
                       budou nahrazena! Po přidání je nutné u každého vláčku
                       upravit výchozí úsek.`,
                confirmButtonText: "Provést nové skenování",
                confirmButtonColor: "#0476eb",
                showDenyButton: true,
                denyButtonText: "Využít výsledky předchozího",
                showCloseButton: true
            }).then((result)=>{
                if(result.isConfirmed){
                    refresh=true;
                }
                else if(result.isDenied){
                    refresh=false;
                }
                else{
                    update=false;
                }
            });
        }
        else{
            await Swal.fire({
                title: "Skenování sítě",
                html: `Vaše lokální síť bude proskenována za účelem nalezení
                       vláčků. Skenování může v závislosti na velikosti Vaší
                       sítě trvat i několik minut. Veškerá data v tabulce vlaků
                       budou nahrazena! Po přidání je nutné u každého vláčku
                       upravit výchozí úsek.`,
                confirmButtonText: "Zahájit skenování",
                confirmButtonColor: "#0476eb",
                showCloseButton: true
            }).then(result => {
                if(result.isConfirmed){
                    refresh=true;
                }
                else{
                    update=false;
                }
            });
        }
        if(update){
            let data = lines[1];
            if(refresh){
                Swal.fire({
                    title: "Skenuji síť",
                    text: "Tato akce může trvat pár minut, čekejte prosím",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: ()=>{
                        Swal.showLoading();
                    }
                });
                await fetch("../../library/autoscan.php").then(response => response.text()).then(response => {
                    Swal.close();
                    if(response == "ERROR"){
                        error=true;
                    }
                }).catch(()=>{
                    Swal.close();
                    error=true;
                });
                await fetch("../../library/train_list.txt?uid="+uniqid()).then(response=>response.text()).then(response=>{
                    let lines = response.split("\n");
                    data = lines[1];
                }).catch(()=>{
                    error=true;
                });
            }
            if(!error){
                deleteTrains();
                let ip_addresses = data.split(" ");
                ip_addresses.forEach((value, index)=>{
                    index+=1;
                    if(value.match(/(\b25[0-5]|\b2[0-4][0-9]|\b[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}/)){
                        addTrain(value, index);
                    }
                });
                settings();
            }
            else{
                Err.fire({text: "Došlo k chybě při skenování"});
            }
        }
        else{
            settings();
        }
    });
}