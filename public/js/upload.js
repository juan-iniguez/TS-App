let apl_invoice = document.getElementById("apl-invoice");
apl_invoice.addEventListener('change', previewPDF);
let apl_waybill = document.getElementById("apl-waybill");
apl_waybill.addEventListener('change', previewPDF);
let apl_invoicePreview = document.getElementById("apl-invoice-preview");
let apl_waybillPreview = document.getElementById("apl-waybill-preview");
let formLabels = document.getElementsByClassName('form-label');
let tabs = document.getElementsByClassName("nav-link");

apl_invoice.value = '';
apl_waybill.value = '';

console.log(formLabels)
for(let el of formLabels){
    el.addEventListener('dragleave' || 'dragend', (e)=>{
        e = e || event;
        e.target.style = '';
        e.preventDefault();
    })
    el.addEventListener('dragover',(e)=>{
        e = e || event;
        console.log('Mouse drag:')
        console.log(e.dataTransfer.items[0])
        e.target.style = 'background-color:#8080804f';
        e.target.innerText = ":)"
        e.preventDefault();
    },false)
    el.addEventListener('drop',(e)=>{
        e = e || event;
        e.preventDefault();
        // e.target.hidden=true;
        // Add Files from Drop to Input
        e.target.parentElement.control.files = e.dataTransfer.files
        e.target.parentElement.control.dispatchEvent(new Event("change"))
    },false)
}

for(let el of tabs){
    el.addEventListener("click", (e)=>{
        let container = document.getElementById('upload-container-'+e.target.id.split('-')[1]);
        if(container.classList.contains('hidden')){
            if(el.id == 'apl-invoice-tab'){
                document.getElementById('apl-waybill-tab').classList.toggle('active')
                document.getElementById('upload-container-waybill').classList.toggle('hidden')
                document.getElementById('upload-container-waybill').hidden=true;
            }else{
                document.getElementById('apl-invoice-tab').classList.toggle('active')
                document.getElementById('upload-container-invoice').classList.toggle('hidden')
                document.getElementById('upload-container-invoice').hidden=true;
            }
            container.hidden=false
            container.classList.toggle('hidden');
            el.classList.toggle('active');
        }
        console.log(document.getElementById(e.target.id.slice(0,e.target.id.length-4)+''))
        console.log(e.target.id.slice(0,e.target.id.length-4))

    })
}

let months = ["JAN","FEB","MAR","APR","MAY", "JUN", "JUL","AUG","SEP","OCT","NOV","DEC"];
let payload_data = {}
let check_match = {
    'BOL': Boolean, 
    'VESSEL':Boolean,
    'VOYAGE': Boolean,
    'CONT_SIZE': Boolean,
    'CONT_NUM': Boolean,
};

function previewPDF(e){
    const preview = document.getElementById(e.target.id + "-preview");
    const file = e.target.files[0];
    const reader = new FileReader();
    const landingPadArray = document.getElementsByClassName('form-label');

    for(let i of landingPadArray){
        e.target.id == i.htmlFor?i.hidden=true:{};
    }

    reader.addEventListener("load", ()=>{
        console.log(reader.result);
        preview.src = reader.result;
        preview.title = e.target.files[0].name;
        preview.height = '500px'

        checkInputFiles(e.target.id);

    }, false);

    if(file) {
        reader.readAsDataURL(file);
    }

}

function checkInputFiles(type){
    let tabsContainers = document.getElementById("tabs-buttons-container");
    if(tabsContainers.hidden){
        tabsContainers.hidden=false;
    }
    document.getElementById(type+"-tab").innerText = document.getElementById(type).files.length > 0? "Invoice ✅": console.log("Error no files");
    if(apl_invoice.files.length == 1 && apl_waybill.files.length == 1){
        console.log("ready")
        document.getElementById("next-btn").hidden = true;
        document.getElementById("upload-btn").hidden = false;
    }
}

async function submit() {
    let formData = new FormData();

    apl_invoice.files[0].arrayBuffer

    formData.append("files", apl_invoice.files[0]);
    formData.append("files", apl_waybill.files[0]);

    axios.post('/api/apl-inv-way', formData, {
        'Content-Type': 'multipart/form-data'
    }).then(res => {
        if(res.data.status == "OK"){
            // THIS IS TEMPORARY
            payload_data = res.data.all;
            console.log(res.data);
            confirmDetails(res.data.all)
        }else{
            document.getElementById("error-banner").innerText = `Error Uploading your file:
            Status:${res.data.status} - ${res.data.reason}`
            document.getElementById('error-msg').hidden = false;
            console.info(res.data);
        }
    }).catch(err => {
        console.error(err);
    })
}

function confirmDetails(data){
    // Hide the upload section
    document.getElementById("upload-main").hidden = true;
    document.getElementById("invoice-main-container").hidden = false;
    document.getElementById("invoice-main").hidden = false;

    let charges_table = document.getElementById("charges-table");
    let shipments_table = document.getElementById("shipments-table");
    // Unhide the confirm invoice details
    // Populate the details with JSON call back
    let keys_invoice = Object.keys(data.invoice);
    let keys_waybill = Object.keys(data.waybill);

    for(i in keys_invoice){
        let el = document.getElementById(keys_invoice[i] + '-I');
        if (keys_invoice[i] == "CHARGES")  break;
        if (keys_invoice[i] == "INVOICE_DATE"){
            let date = data.invoice[keys_invoice[i]].split("-");
            let new_date = new Date(parseInt(date[2]), months.indexOf(date[1]), parseInt(date[0]))
            // console.log(new_date.getTime())
            el.type = "date"
            el.valueAsNumber = new_date.getTime()
        }else{
            el.value = data.invoice[keys_invoice[i]];
        }
        
        if(data.waybill[keys_invoice[i]]){
            if(data.invoice[keys_invoice[i]] == data.waybill[keys_invoice[i]]){
                check_match[keys_invoice[i]] = true;
                el.labels[0].classList.toggle('match');
            }else{
                check_match[keys_invoice[i]] = false;
                el.labels[0].classList.toggle('err');
            }
        }
    }

    let fields = Object.keys(data.invoice.CHARGES[0]);
    for(let i in data.invoice.CHARGES){
        // console.log(data.invoice.CHARGES[i]);
        let new_tr = document.createElement('tr');
        for(j in fields){
            let new_td = document.createElement('td');
            let new_input = document.createElement('input');
            new_input.id = `${fields[j]}-${i}-I`;
            console.log(Number.isFinite(data.invoice.CHARGES[i][fields[j]]),typeof(data.invoice.CHARGES[i][fields[j]]))
            if( Number.isFinite(data.invoice.CHARGES[i][fields[j]]) ){
                new_input.className = "input-table text-right";
                new_input.value = data.invoice.CHARGES[i][fields[j]].toFixed(2);
            }else{
                new_input.className = "input-table text-left";
                new_input.value = data.invoice.CHARGES[i][fields[j]];
            }
            fields[j]=="TYPE"||fields[j]=="BASED_ON"?new_input.classList.toggle('sm'):null;
            fields[j]=="DESC"?new_input.classList.toggle('lg'):null;
            new_td.insertAdjacentElement("afterbegin",new_input);
            new_tr.insertAdjacentElement("beforeend", new_td);
        }
        charges_table.insertAdjacentElement("beforeend", new_tr);
    }

    document.getElementById('TOTAL-I').value = data.invoice.TOTAL;


    // Populate the waybill details in the background
    for(let i in keys_waybill){
        let el = document.getElementById(keys_waybill[i] + '-W');
        if (keys_waybill[i] == "SHIPMENTS")  break;

        if (keys_waybill[i] == "ETD" || keys_waybill[i] == "ETA" ){
            let date = data.waybill[keys_waybill[i]].split("-");
            let new_date = new Date(parseInt(date[2]), months.indexOf(date[1]), parseInt(date[0]))
            // console.log(new_date.getTime())
            el.type = "date"
            el.valueAsNumber = new_date.getTime()
        }else{
            el.value = data.waybill[keys_waybill[i]]
        }



        if(check_match[keys_waybill[i]] != undefined){
            if(check_match[keys_waybill[i]]){
                el.labels[0].classList.toggle('match');
            }else{
                el.labels[0].classList.toggle('err');
            }
        }
    }

    let fields_waybill = Object.keys(data.waybill.SHIPMENTS[0]);
    for(let i in data.waybill.SHIPMENTS){
        let new_tr = document.createElement('tr');
        for(j in fields_waybill){
            let new_td = document.createElement('td');
            let new_input = document.createElement('input');
            new_input.id = `${fields_waybill[j]}-${i}-W`;
            if( Number.isInteger(data.waybill.SHIPMENTS[i][fields_waybill[j]]) ){
                new_input.className = "input-table text-right";
                new_input.value = data.waybill.SHIPMENTS[i][fields_waybill[j]].toFixed(2);
            }else if(fields_waybill[j] == "RDD"){
                if(data.waybill.SHIPMENTS[i][fields_waybill[j]] == "N/A"){
                    new_input.type = "text";
                    new_input.value = "N/A";
                    new_input.disabled = true;
                    new_input.className = 'input-table text-left';
                }else{
                    // console.log(data.waybill.SHIPMENTS[i][fields_waybill[j]]);
                    if(data.waybill.SHIPMENTS[i][fields_waybill[j]].includes("-")){
                        let date = data.waybill.SHIPMENTS[i][fields_waybill[j]].split("-");
                        let new_date = new Date(parseInt(date[2]), months.indexOf(date[1]), parseInt(date[0]))
                        // console.log(new_date.getTime())
                        new_input.type = "date";
                        new_input.valueAsNumber = new_date.getTime();
                        new_input.className = 'input-table text-left';
                    }else{
                        let date = data.waybill.SHIPMENTS[i][fields_waybill[j]].split("/");
                        let new_date = new Date(date[2], date[0]-1, date[1]);
                        new_input.type = "date";
                        new_input.valueAsNumber = new_date.getTime();
                        new_input.className = 'input-table text-left';
                    }
                }
            }else{
                new_input.className = "input-table text-left";
                new_input.value = data.waybill.SHIPMENTS[i][fields_waybill[j]];
            }

            fields_waybill[j] == "SCAC" || fields_waybill[j] == "PIECES"  ? new_input.classList.toggle('sm'): null; 
            new_td.insertAdjacentElement("afterbegin",new_input);
            new_tr.insertAdjacentElement("beforeend", new_td);
        }
        shipments_table.insertAdjacentElement("beforeend", new_tr);
    }

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

function goTab(e){
    console.log(e)
}