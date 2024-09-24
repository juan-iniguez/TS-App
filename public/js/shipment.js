let data_send = {
    BOL: document.getElementById("BOL").value,
    MEMBER_NAME: document.getElementById("MEMBER_NAME").value,
    id: document.URL.split('/'),
}

function createInvoice(){
    // Get Everything
    // Get Charges
    axios.get(`/api/create-dew-inv/${data_send.BOL}/${data_send.MEMBER_NAME}/${data_send.id[data_send.id.length - 1]}`).then(res=>{
        if(res.status == 200 ){
            window.open(`/api/create-dew-inv/${data_send.BOL}/${data_send.MEMBER_NAME}/${data_send.id[data_send.id.length - 1]}`, '_blank').focus();
            location.reload();
        }
    }).catch(err=>{
        console.log(err);
    })
}

let editMenu = document.getElementById("edit-menu") || null;
let editDD = document.getElementById("edit-dd") || null;
let invoiceNum = document.getElementById("INVOICE_NUM") || null;
invoiceNum?invoiceNum.innerText = "NVC-" + addLeadingZeros(parseInt(invoiceNum.ariaCurrent)):null;
if(editMenu){
    editMenu.addEventListener("mouseover",toggleMenu);
    editMenu.addEventListener("mouseout",toggleMenu);
}

function toggleMenu(){
    editDD.classList.toggle("show");
}

function addLeadingZeros(amount){
    let x = "";
    for(let i=0;i<6-amount.toString().length;i++){
        x += "0";
    }
    return x+amount;
}

let getPDF = () =>{
    console.time("Get Invoice")
    window.open(`/api/get-inv/${data_send.id[data_send.id.length -1]}`);
    console.timeEnd("Get Invoice")
}

function voidConfirmation(){
    let data = {
        INVOICE_NUM: invoiceNum.ariaCurrent,
        BOL: data_send.BOL,
        MEMBER_NAME: data_send.MEMBER_NAME,
    }
    let errContainer = document.getElementById("error-container");
    let errTitle = document.getElementById("error-title");
    let errDescription = document.getElementById("error-description");
    errContainer.hidden = false;
    errTitle.innerText = `VOIDING NVC-${addLeadingZeros(parseInt(data.INVOICE_NUM))}`
    errDescription.innerText = `Are you sure you want to void this invoice?`;
}

function cancelVoid(){
    let errContainer = document.getElementById("error-container");
    errContainer.hidden = true;
}

function voidInvoice(){
    let voidReason = document.getElementById("void-reason");
    let errorWarning = document.getElementById("error-warning")
    // Check if there is a reason for voiding
    if(voidReason.value.length < 1){
        console.log(voidReason.value.length)
        voidReason.classList.toggle("highlight-error");
        errorWarning.innerText = "Please provide a reason"
        return
    }

    axios.post('/api/inv/void',{
        INVOICE_NUM: invoiceNum.ariaCurrent,
        BOL: data_send.BOL,
        MEMBER_NAME: data_send.MEMBER_NAME,
        REASON: voidReason.value,
    }).then(res=>{
        if(res.status == 200){
            location.reload();
        }else{
            console.error(res)
        }
    }).catch(err=>{
        console.log(err);
    })
}

function newInvoice(){
    axios.get(`/api/create-dew-inv/${data_send.BOL}/${data_send.MEMBER_NAME}`).then(res=>{
        console.log(res);
        if(res.status == 200 ){
            window.open(`/api/create-dew-inv/${data_send.BOL}/${data_send.MEMBER_NAME}`, '_blank').focus();
            location.reload();
        }
    }).catch(err=>{
        console.log(err);
    })
}

function editInvoice(){
    let editStage = document.getElementById("edit-stage");
    let shipmentContainer = document.getElementById("shipment");
    shipmentContainer.classList.toggle("hidden");
    editStage.classList.toggle("hidden")
}
