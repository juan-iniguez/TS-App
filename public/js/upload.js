let apl_invoice = document.getElementById("apl-invoice");
let apl_waybill = document.getElementById("apl-waybill");
let months = ["JAN","FEB","MAR","APR","MAY", "JUN", "JUL","AUG","SEP","OCT","NOV","DEC"];
let payload_data = {}
let check_match = {
    'BOL': Boolean, 
    'VESSEL':Boolean,
    'VOYAGE': Boolean,
    'CONT_SIZE': Boolean,
    'CONT_NUM': Boolean,
};


async function submit() {
    let formData = new FormData();

    // console.log("LMAO")
    // console.log(apl_invoice);
    // console.log(apl_invoice.files[0]);

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
