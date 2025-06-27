let formLabels = document.getElementsByClassName('form-label');
let tabs = document.getElementsByClassName("nav-link");
let invoice_number = window.location.href.split('/').pop();
let contSize = document.getElementById('CONT_SIZE-I');
let typeContainer = document.getElementById('ch-type-0').children[0];
let uniContainer = document.getElementById('ch-uni-0').children[0];
let amountUSDContainers = document.getElementsByClassName('amountusd');
let options = document.getElementsByClassName('options');
let piecesContainer = document.getElementById('sh-pieces-0').children[0];
let memberNameContainer = document.getElementById('sh-sm-0').children[0];
let scacContainer = document.getElementById('sh-scac-0').children[0];
let gblContainer = document.getElementById('sh-gbl-0').children[0];
let weightLBSContainer = document.getElementById('sh-weight_lbs-0').children[0];
let ttlCFContainer = document.getElementById('sh-ttl_cf-0').children[0];
let rddContainer = document.getElementById('sh-rdd-0').children[0];
let netContainer = document.getElementById('sh-net-0').children[0];

let bolFields = document.getElementsByClassName('bol');
let contNumFields = document.getElementsByClassName('cont-num');
let contSizeFields = document.getElementsByClassName('cont-size');
let vesselFields = document.getElementsByClassName('vessel')

let months = ["JAN","FEB","MAR","APR","MAY", "JUN", "JUL","AUG","SEP","OCT","NOV","DEC"];
let payload_data = {}
let check_match = {
    'BOL': Boolean, 
    'VESSEL':Boolean,
    'VOYAGE': Boolean,
    'CONT_SIZE': Boolean,
    'CONT_NUM': Boolean,
};

// LISTENERS Invoice
contSize.addEventListener('input', (e)=>{
    let sizeInputsContainers = document.getElementsByClassName('size');
    updateInvoiceFields(sizeInputsContainers, e);
})

typeContainer.addEventListener('input',(e)=>{
    let typeContainers = document.getElementsByClassName('type');
    updateInvoiceFields(typeContainers, e);
})

uniContainer.addEventListener('input',(e)=>{
    if((e.originalTarget.value).match(/[A-z]/g)){
        e.originalTarget.value = e.originalTarget.value.slice(0,-1)
    }
    let uniContainers = document.getElementsByClassName('uni');
    updateInvoiceFields(uniContainers, e);
})

options[0].addEventListener('focusin', optionsUpdate)

function optionsUpdate(){
    console.log(this)
    let optionsInUse = [];

    for(n of options){
        if(n.value != this.value){
            optionsInUse.push(n.value);
        }
    }

    for(n of this.children){
        if(optionsInUse.includes(n.value)){
            n.disabled = true;
        }else{
            n.disabled = false;
        }
    }
}

for(n of amountUSDContainers){
    if(n.tagName != "TH"){
        n.addEventListener('input', amountusdUpdate)
    }
}

function amountusdUpdate(){
    if((this.children[0].value).match(/[A-z]/g)){
        this.children[0].value = this.children[0].value.slice(0,-1)
        this.children[0].value == ""? this.children[0].value = 0:{}; 
        return
    }

    let rateCurrency = document.getElementById("ch-rate-"+this.id.slice(-1)).children[0];
    let amount = document.getElementById("ch-amount-"+this.id.slice(-1)).children[0];
    
    rateCurrency.value = this.children[0].value;
    amount.value = this.children[0].value;

    totalUpdate()

}

function totalUpdate(){
    let total = document.getElementById('TOTAL-I');
    total.value = 0;
    for(n of amountUSDContainers){
        if(n.tagName != "TH"){
            total.value = parseFloat(total.value) + parseFloat(n.children[0].value)
        }
    }
    total.value = parseFloat(total.value).toLocaleString('en-US', {style: 'currency',currency: 'USD'});
}

function updateInvoiceFields(containers, e){
    for(n of containers){
        if(n.tagName != "TH"){
            n.children[0].value = e.originalTarget.value;
        }
    }
}

// Listeners Waybill
piecesContainer.addEventListener('input', noSpaces);
memberNameContainer.addEventListener('input', (e)=>{
    if(e.data==null){return};
    if((e.originalTarget.value).match(/[a-z]/g)){
        e.originalTarget.value = e.originalTarget.value.toUpperCase()
    }

    if((e.data).match(/[0-9]/g)){
        e.originalTarget.value = e.originalTarget.value.slice(0,-1)
    }
});
memberNameContainer.addEventListener('focusout',(e)=>{
    e.originalTarget.value = e.originalTarget.value.trim();
});
scacContainer.addEventListener('input', (e)=>{
    upperCase(e);
    noSymbols(e);
});
gblContainer.addEventListener('input', upperCase);
weightLBSContainer.addEventListener('input', onlyNumbers);
ttlCFContainer.addEventListener('input', onlyNumbers);
// rddContainer.addEventListener('input', noSpaces);
netContainer.addEventListener('input', onlyNumbers);

function onlyNumbers(e){
    if(e.data==null){return};
    noSpaces(e);
    if((e.data).match(/[^0-9]/g)){
        console.log("HMM")
        e.originalTarget.value = e.originalTarget.value.slice(0,-1)
    }
}

function noSpaces(e){
    e.data == " "?e.originalTarget.value = e.originalTarget.value.slice(0,-1):{};
}

function upperCase(e){
    if(e.data==null){return};
    noSpaces(e);
    if((e.originalTarget.value).match(/[a-z]/g)){
        e.originalTarget.value = e.originalTarget.value.toUpperCase()
    }
}

function noSymbols(e){
    if((e.data).match(/[^A-Z]/g)){
        e.originalTarget.value = e.originalTarget.value.slice(0,-1)
    }
}

// Listeners for Mirroring Details
for(n of bolFields){
    n.addEventListener('input', fieldMirror)
}
for(n of vesselFields){
    n.addEventListener('input', fieldMirror)
}
for(n of contSizeFields){
    n.addEventListener('input', fieldMirror)
}
for(n of contNumFields){
    n.addEventListener('input', fieldMirror)
}

function fieldMirror(e){
    let fields = (()=>{
        switch (e.originalTarget.id) {
            case "CONT_NUM-I":
            case "CONT_NUM-W":
                return contNumFields
            case "CONT_SIZE-I":
            case "CONT_SIZE-W":
                return contSizeFields
            case "VESSEL-I":
            case "VESSEL-W":
                return vesselFields
            case "BOL-I":
            case "BOL-W":
                return bolFields        
            default:
                break;
        }
    })() 

    for(i of fields){
        if(i!=e.originalTarget){
            i.value = e.originalTarget.value;
            if(e.originalTarget.value != ""){
                e.originalTarget.labels[0].className.includes("false")? e.originalTarget.labels[0].classList.toggle('false'):{}
                i.labels[0].className.includes("false")? i.labels[0].classList.toggle('false'):{}   
            }else{
                e.originalTarget.labels[0].className.includes("false")?{}:e.originalTarget.labels[0].classList.toggle("false");
                i.labels[0].className.includes("false")?{}:i.labels[0].classList.toggle("false");
            }
        }
        
    }
}

// Err Handler
function ERR_HANDLER(msg){
    const errorMsg = document.getElementById('error-msg');
    const errorBanner = document.getElementById("error-banner");
    
    errorBanner.innerText = msg;
    errorBanner.style = `font-size: large;padding-top: 25px;`
    errorMsg.classList.contains('hidden')?document.getElementById('error-msg').classList.toggle("hidden"):{};
}

// Error Message Hidden
function hideErrorMsg(){
    document.getElementById('error-msg').classList.toggle("hidden");                
}

function toggleWaybill(){
    if(document.getElementById("waybill-main").hidden){
        document.getElementById("invoice-main").hidden = true;
        document.getElementById("waybill-main").hidden = false;
        document.getElementById("invoice-details").classList.toggle('active');
        document.getElementById("waybill-details").classList.toggle('active');
    }
}

function toggleInvoice(){
    if(document.getElementById("invoice-main").hidden){
        document.getElementById("waybill-main").hidden = true;
        document.getElementById("invoice-main").hidden = false;
        document.getElementById("invoice-details").classList.toggle('active');
        document.getElementById("waybill-details").classList.toggle('active');
    }
}

// Submit to DB -> End of the website
async function submit_db(){

    // GET DETAILS FROM THE FIELDS
    let payload_data_out = {}
    // OPTIMIZE THIS CODE, THIS IS TRASH OMG
    for(let i in payload_data){
        payload_data_out[i] = {}
        for(let j in payload_data[i]){
            if( i == "invoice"){
                let el = document.getElementById(j + "-I")
                if(j == "CHARGES"){
                    payload_data_out[i][j] = [];
                    for(let k = 0;k<payload_data[i][j].length;k++){
                        payload_data_out[i][j].push({});
                        for(let l in payload_data[i][j][k]){
                            let el_ch = document.getElementById(`${l}-${k}-I`)
                            payload_data_out[i][j][k][l] = el_ch.value;
                        }
                    }
                }else{
                    payload_data_out[i][j] = el.value;
                }
            }else{
                let el = document.getElementById(j + "-W")
                if(j == "SHIPMENTS"){
                    payload_data_out[i][j] = [];
                    for(let k = 0;k<payload_data[i][j].length;k++){
                        payload_data_out[i][j].push({});
                        for(let l in payload_data[i][j][k]){
                            let el_ch = document.getElementById(`${l}-${k}-W`)
                            payload_data_out[i][j][k][l] = el_ch.value;
                        }
                    }
                }else{
                    payload_data_out[i][j] = el.value;
                }
            }
        }
    }

    axios.post('/api/db-invoice-waybill', payload_data_out).then(res => {
        if(res.data == "OK"){
            window.location.href = "/search";
        }else{
            let err = res.data
            console.log(err.status, err.msg);
        }
    }).catch(err => {
        console.error(err);
    })
}

// Table Mechanisms
let invoiceTable = document.getElementById("charges-table").children[0];
let waybillTable = document.getElementById("shipments-table").children[0];
let chargesCounter = 4;
let shipmentsCounter = 0;

function addRow(e){
    if(options.length == 3){
        e.classList.toggle('max');
    }else if(options.length == 4){
        return
    }
    // Which table are we modifying?
    const table = e.id == "invoice-addrow-btn"?invoiceTable:waybillTable;

    let columns = table == invoiceTable?["size", "type", "desc", "uni", "rate", "amount", "amountusd"]:["pieces", "sm", "scac","gbl", "weight_lbs", "ttl_cf", "rdd", "net"];
    table == invoiceTable?chargesCounter++:shipmentsCounter++;
    const tr = document.createElement("tr");
    for(let n of columns){

        const td = document.createElement("td");
        
        td.className = `td-charge ${n}`;
        td.id = `${table == invoiceTable?"ch":"sh"}-${n}-${table == invoiceTable?chargesCounter:shipmentsCounter}`;

        // Select which type of fields to load depending on page
        if(table == invoiceTable){
            if(n == "amountusd"){
                const input = document.createElement('input');
                input.className = "charge-input right";
                input.type = "text";
                input.value = 0;
                td.addEventListener('input', amountusdUpdate);
                td.insertAdjacentElement("afterbegin", input);
            }else if(n == "desc"){
                const selectDesc = document.createElement('select');
                selectDesc.className = 'options';
                selectDesc.id = "ch-options-" + n;
                selectDesc.innerHTML = `<option style="text-align:center" value="null" selected disabled>---------</option><option value="FEE85">Container inspection fees and survey fees</option><option value="RAIL">Pre carriage haulage</option><option value="RAIL">On carriage haulage</option><option value="CUS16">Export Declaration Surcharge</option><option value="AMS">Advance Manifest Compliance Charge (AMS)</option><option value="RAIL">Inland (Rail) Charge</option>`;
                selectDesc.addEventListener('focusin', optionsUpdate);
                td.insertAdjacentElement('afterbegin',selectDesc);
            }else{
                td.innerHTML = (() => {
                    switch (n) {
                        case "rate":
                            return `<input class="charge-input right" type="text" disabled>`
                        case "amount":
                            return `<input class="charge-input right" type="text" disabled>`
                        case "uni":
                            return `<input class="charge-input" type="text" value="${uniContainer.value}" disabled>`
                        case "type":
                            return `<input class="charge-input" type="text" value="${typeContainer.value}" disabled>`
                        case "size":
                            return `<input class="charge-input" type="text" value="${contSize.value}" disabled>`;
                        case "desc":
                            return `<select class="options"><option style="text-align:center" value="null" selected disabled>---------</option><option value="FEE85">Container inspection fees and survey fees</option><option value="RAIL">Pre carriage haulage</option><option value="RAIL">On carriage haulage</option><option value="CUS16">Export Declaration Surcharge</option><option value="AMS">Advance Manifest Compliance Charge (AMS)</option><option value="RAIL">Inland (Rail) Charge</option></select>`
                        default:
                            return `<input id='${n}-${chargesCounter}' class="charge-input" type="text">`
                    }
                })()
            }
        }else{
            if(n == "rdd"){
                td.innerHTML = `<input class="charge-input" type="date">`
            }else if(n == "sm"){
                let smInput = document.createElement('input');
                smInput.className = "charge-input";
                smInput.addEventListener('input', (e)=>{
                    if(e.data==null){return};
                    if((e.originalTarget.value).match(/[a-z]/g)){
                        e.originalTarget.value = e.originalTarget.value.toUpperCase()
                    }
                    if((e.data).match(/[0-9]/g)){
                        e.originalTarget.value = e.originalTarget.value.slice(0,-1)
                    }
                });
                smInput.addEventListener('focusout',(e)=>{
                    e.originalTarget.value = e.originalTarget.value.trim();
                });
                td.insertAdjacentElement('afterbegin', smInput);
            }else{
                switch (n) {
                    case "pieces":
                        td.addEventListener('input', noSpaces);
                        break
                    case "scac":
                        td.addEventListener('input', (e)=>{
                            upperCase(e);
                            noSymbols(e);
                        });
                        break                        
                    case "gbl":                            
                        td.addEventListener('input', upperCase);
                        break
                    case "weight_lbs":                                
                        td.addEventListener('input', onlyNumbers);
                        break
                    case "ttl_cf":
                        td.addEventListener('input', onlyNumbers);
                        break
                    case "rdd":
                        td.innerHTML = `<input class="charge-input" type="date">`;
                        break;
                    case "net":
                        td.addEventListener('input', onlyNumbers);
                        break
                    default:
                        td.innerHTML = `<input class="charge-input" type="text">`;
                        break;
                }
                td.innerHTML = `<input class="charge-input" type="text">`;
            }
        }
        tr.appendChild(td);
    }
    table.appendChild(tr);
}

//! WORKING ON THIS ONE
function removeRow(e){
    
    const table = e.id == "invoice-addrow-btn"?invoiceTable:waybillTable;
    
    const addBtn = document.getElementById(table == invoiceTable?'invoice-addrow-btn':"waybill-addrow-btn");

    if(table == invoiceTable){
        if(chargesCounter <= 7){
            chargesCounter == 7?addBtn.classList.toggle('max'):{};
            table.children[table.children.length -1].remove()
            
            totalUpdate()
            chargesCounter--
        }else if(chargesCounter == 4){
            return
        }
    }else{
        if(shipmentsCounter == 0){
            return
        }else{
            table.children[table.children.length -1].remove()
            shipmentsCounter--
        }
    }

    
    
}