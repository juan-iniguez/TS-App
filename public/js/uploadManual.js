
let formLabels = document.getElementsByClassName('form-label');
let tabs = document.getElementsByClassName("nav-link");
let invoice_number = window.location.href.split('/').pop();





let months = ["JAN","FEB","MAR","APR","MAY", "JUN", "JUL","AUG","SEP","OCT","NOV","DEC"];
let payload_data = {}
let check_match = {
    'BOL': Boolean, 
    'VESSEL':Boolean,
    'VOYAGE': Boolean,
    'CONT_SIZE': Boolean,
    'CONT_NUM': Boolean,
};

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
let chargesCounter = 0;


function addRow(e){
    // Which table are we modifying?
    const table = e.id == "invoice-addrow-btn"?invoiceTable:waybillTable;

    let columns = ["size", "type", "desc", "uni", "rate", "amount", "amountusd"];
    chargesCounter++
    const tr = document.createElement("tr");
    for(let n of columns){
        const td = document.createElement("td");
        td.className = "td-charge";
        td.id = `ch-${n}-${chargesCounter}`
        td.innerHTML = `<input id='${n}-${chargesCounter}' class="charge-input" type="text">`;
        tr.appendChild(td);
    }
    table.appendChild(tr);

} 