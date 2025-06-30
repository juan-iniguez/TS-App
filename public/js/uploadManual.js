
let formLabels = document.getElementsByClassName('form-label');
let tabs = document.getElementsByClassName("nav-link");
let invoice_number = window.location.href.split('/').pop();
let contSize = document.getElementById('CONT_SIZE-I');
let typeContainer = document.getElementById('ch-type-0').children[0];
let uniContainer = document.getElementById('ch-based_on-0').children[0];
let amountUSDContainers = document.getElementsByClassName('amount_usd');
let options = document.getElementsByClassName('options');
let piecesContainer = document.getElementById('sh-pieces-0').children[0];
let memberNameContainer = document.getElementById('sh-sm-0').children[0];
let scacContainer = document.getElementById('sh-scac-0').children[0];
let gblContainer = document.getElementById('sh-gbl-0').children[0];
let weightLBSContainer = document.getElementById('sh-weight_lbs-0').children[0];
let ttlCFContainer = document.getElementById('sh-ttl_cf-0').children[0];
let rddContainer = document.getElementById('sh-rdd-0').children[0];
let netContainer = document.getElementById('sh-net-0').children[0];
let totalWeigthLBS = document.getElementById('WEIGHT_LBS-W');
let totalCubicFeet = document.getElementById('CUBIC_FEET-W');

let bolFields = document.getElementsByClassName('bol');
let contNumFields = document.getElementsByClassName('cont-num');
let contSizeFields = document.getElementsByClassName('cont-size');
let vesselFields = document.getElementsByClassName('vessel')
let ERR_ = false;

let months = ["JAN","FEB","MAR","APR","MAY", "JUN", "JUL","AUG","SEP","OCT","NOV","DEC"];
let fieldNames = {
    invoice:["BOL","INVOICE_NUM", "CUSTOMER_NUM", "INVOICE_DATE","VOYAGE", "RECEIPT_PLACE", "DELIVERY_PLACE", "VESSEL","DISCHARGE_PORT", "LOAD_PORT", "CONT_SIZE","CONT_NUM"],
    waybill:["BOL","VESSEL","CONT_SIZE","CONT_NUM","CODE","WEIGHT_LBS", "ETD", "SERIAL_NUM","CUBIC_FEET","ETA"],
}

let numberFields = ["AMOUNT", "AMOUNT_USD","BASED_ON","RATE_CURR", "WEIGHT_LBS","CUBIC_FEET","TTL_CF","NET"]

let invoiceTable = document.getElementById("charges-table").children[0];
let waybillTable = document.getElementById("shipments-table").children[0];
let chargesCounter = 4;
let shipmentsCounter = 0;




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
    if((e.target.value).match(/[A-z]/g)){
        e.target.value = e.target.value.slice(0,-1)
    }
    let uniContainers = document.getElementsByClassName('based_on');
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

    let rateCurrency = document.getElementById("ch-rate_curr-"+this.id.slice(-1)).children[0];
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
            n.children[0].value = e.target.value;
        }
    }
}

// Listeners Waybill
piecesContainer.addEventListener('input', noSpaces);
memberNameContainer.addEventListener('input', (e)=>{
    if(e.data==null){return};
    if((e.target.value).match(/[a-z]/g)){
        e.target.value = e.target.value.toUpperCase()
    }

    if((e.data).match(/[0-9]/g)){
        e.target.value = e.target.value.slice(0,-1)
    }
});
memberNameContainer.addEventListener('focusout',(e)=>{
    e.target.value = e.target.value.trim();
});
scacContainer.addEventListener('input', (e)=>{
    upperCase(e);
    noSymbols(e);
});
gblContainer.addEventListener('input', upperCase);
weightLBSContainer.addEventListener('input', onlyNumbers);
ttlCFContainer.addEventListener('input', onlyNumbers);
netContainer.addEventListener('input', onlyNumbers);

totalWeigthLBS.addEventListener('input', onlyNumbers);
totalCubicFeet.addEventListener('input', onlyNumbers);

function onlyNumbers(e){
    if(e.data==null){return};
    noSpaces(e);
    if((e.data).match(/[^0-9]/g)){
        console.log("HMM")
        e.target.value = e.target.value.slice(0,-1)
    }
}

function noSpaces(e){
    e.data == " "?e.target.value = e.target.value.slice(0,-1):{};
}

function upperCase(e){
    if(e.data==null){return};
    noSpaces(e);
    if((e.target.value).match(/[a-z]/g)){
        e.target.value = e.target.value.toUpperCase()
    }
}

function noSymbols(e){
    if((e.data).match(/[^A-z ]/g)){
        e.target.value = e.target.value.slice(0,-1)
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
    console.log(e)
    let fields = ((e)=>{
        switch (e.target.id) {
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
    })(e) 

    for(i of fields){
        if(i!=e.target){
            i.value = e.target.value;
            if(e.target.value != ""){
                e.target.labels[0].className.includes("false")? e.target.labels[0].classList.toggle('false'):{}
                i.labels[0].className.includes("false")? i.labels[0].classList.toggle('false'):{}   
            }else{
                e.target.labels[0].className.includes("false")?{}:e.target.labels[0].classList.toggle("false");
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

function ERR_FIELD(e){
    e.target.classList.toggle("ERR_FIELD");
    e.target.removeEventListener('focusin', ERR_FIELD);
    ERR_ = false;

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
    let payload_data = {invoice:{},waybill:{}}

    // GET DETAILS FROM THE FIELDS
    // List detail fields here
    // Start with Invoice
    for(n of fieldNames.invoice){
        const inputValue = document.getElementById(n + "-I");
        if(ERR_){
            // Error Message
            break
        }        
        if(inputValue.value == "" && !inputValue.disabled){
            inputValue.classList.toggle("ERR_FIELD")
            inputValue.addEventListener("focusin", ERR_FIELD);
            ERR_ = true;
            console.error("ERROR! : " + inputValue.classList)
            console.log(inputValue.children[0])
            break
        }

        payload_data.invoice[n] = inputValue.type == "date"?new Date(inputValue.value).getTime() :inputValue.value;
    }
    
    // Waybill
    for(n of fieldNames.waybill){
        const inputValue = document.getElementById(n + "-W");
        if(ERR_){
            // Error Message
            break
        }        
        if(inputValue.value == "" && !inputValue.disabled){
            inputValue.classList.toggle("ERR_FIELD")
            inputValue.addEventListener("focusin", ERR_FIELD);
            ERR_ = true;
            console.error("ERROR! : " + inputValue.classList)
            console.log(inputValue.children[0])
            break
        }
        payload_data.waybill[n] = inputValue.type == "date"?new Date(inputValue.value).getTime() :inputValue.value;
    }

    if(ERR_){
        console.log("Returned Before Charges");
        return};
    // Charges and Shipments
    payload_data.invoice["CHARGES"] = [];
    payload_data.waybill["SHIPMENTS"] = [];
    // Charges
    for(n of [invoiceTable,waybillTable]){
        // Iterating over Invoice Table
        if(n == invoiceTable){
            // Get all rows of charges
            for(i of n.children){
                if(i.id != ""){
                    let charge = {};
                    // Get Charges from Row
                    for(j of i.children){
                        if(ERR_){
                            // ERR MESSAGE
                            return
                        }
                        if(j.tagName != "TH"){
                            // ? CHECK FOR EMPTY INPUT
                            console.log(j.children[0].value);
                            if(j.children[0].value == "" && !j.children[0].disabled || j.children[0].value == "null"){
                                j.children[0].classList.toggle("ERR_FIELD")
                                j.children[0].addEventListener("focusin", ERR_FIELD);
                                ERR_ == true;
                                console.error("ERROR! : " + j.children[0].classList)
                                console.log(j.children[0])
                                return
                            }
                            // Check for Number inputs
                            if(numberFields.includes(j.classList[1].toUpperCase())){
                                charge[j.classList[1].toUpperCase()] = parseFloat(j.children[0].value);
                            }else{
                                charge[j.classList[1].toUpperCase()] = j.children[0].value;
                            }
                        }
                    }
                    payload_data.invoice["CHARGES"].push(charge);
                }
            }
        }else{
            // Get Row of Shipments
            for(i of n.children){
                if(i.id == "header-shipment"){continue};
                let shipment = {};
                // Get Shipments from Row
                for(j of i.children){
                    if(j.tagName == "TH"){continue};
                    // !! Check for Empty Input

                    if(j.children[0].value == "" && !j.children[0].disabled || j.children[0]. value == "null"){
                        j.children[0].classList.toggle("ERR_FIELD")
                        j.children[0].addEventListener("focusin", ERR_FIELD);
                        ERR_ == true;
                        console.error("ERROR! : " + j.children[0].classList)
                        console.log(j.children[0])
                        return
                    }

                    if(numberFields.includes(j.classList[1].toUpperCase())){
                        shipment[j.classList[1].toUpperCase()] = parseFloat(j.children[0].value)
                    }else{
                        shipment[j.classList[1].toUpperCase()] = j.children[0].type == "date"? new Date(j.children[0].value).getTime():j.children[0].value;
                    }
                }
                payload_data.waybill["SHIPMENTS"].push(shipment);
            }
        }
        console.log(payload_data);
    };

    axios.post('/api/db-invoice-waybill', payload_data).then(res => {
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
function addRow(e){
    if(options.length == 3){
        e.classList.toggle('max');
    }else if(options.length == 4){
        return
    }
    // Which table are we modifying?
    const table = e.id == "invoice-addrow-btn"?invoiceTable:waybillTable;

    let columns = table == invoiceTable?["size", "type", "desc", "based_on", "rate_curr", "amount", "amount_usd"]:["pieces", "sm", "scac","gbl", "weight_lbs", "ttl_cf", "rdd", "net"];
    table == invoiceTable?chargesCounter++:shipmentsCounter++;
    const tr = document.createElement("tr");
    for(let n of columns){

        const td = document.createElement("td");
        
        td.className = `td-charge ${n}`;
        td.id = `${table == invoiceTable?"ch":"sh"}-${n}-${table == invoiceTable?chargesCounter:shipmentsCounter}`;

        // Select which type of fields to load depending on page
        if(table == invoiceTable){
            tr.id = "EXTRA"
            if(n == "amount_usd"){
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
                        case "rate_curr":
                            return `<input class="charge-input right" type="text" disabled>`
                        case "amount":
                            return `<input class="charge-input right" type="text" disabled>`
                        case "based_on":
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
                    if((e.target.value).match(/[a-z]/g)){
                        e.target.value = e.target.value.toUpperCase()
                    }
                    if((e.data).match(/[0-9]/g)){
                        e.target.value = e.target.value.slice(0,-1)
                    }
                });
                smInput.addEventListener('focusout',(e)=>{
                    e.target.value = e.target.value.trim();
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

function removeRow(e){
    
    const table = e.id == "invoice-removerow-btn"?invoiceTable:waybillTable;
    
    const addBtn = document.getElementById(table == invoiceTable?'invoice-addrow-btn':"waybill-addrow-btn");

    if(table == invoiceTable){
        if(chargesCounter == 4){
            return
        }else if(chargesCounter <= 7){
            chargesCounter == 7?addBtn.classList.toggle('max'):{};
            table.children[table.children.length -1].remove()
            
            totalUpdate()
            chargesCounter--
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


