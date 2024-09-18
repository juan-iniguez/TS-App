let data_send = {
    BOL: document.getElementById("BOL").value,
    MEMBER_NAME: document.getElementById("MEMBER_NAME").value,
}

function createInvoice(){
    // Get Everything
    // Get Charges
    axios.get(`/api/create-dew-inv/${data_send.BOL}/${data_send.MEMBER_NAME}`).then(res=>{
        if(res.status == 200 ){
            window.open(`/api/create-dew-inv/${data_send.BOL}/${data_send.MEMBER_NAME}`, '_blank').focus();
            location.reload();
        }
    }).catch(err=>{
        console.log(err);
    })
}

let editMenu = document.getElementById("edit-menu");
let editDD = document.getElementById("edit-dd");
editMenu.addEventListener("mouseover",toggleMenu);
editMenu.addEventListener("mouseout",toggleMenu);

function toggleMenu(){
    editDD.classList.toggle("show");
}

let invoiceNum = document.getElementById("INVOICE_NUM");

function addLeadingZeros(amount){
    let x = "";
    for(let i=0;i<6-amount.toString().length;i++){
        x += "0";
    }
    return x+amount;
};

invoiceNum.innerText = "NVC-" + addLeadingZeros(parseInt(invoiceNum.ariaCurrent));

let getPDF = () =>{
    window.open(`/api/create-dew-inv/${data_send.BOL}/${data_send.MEMBER_NAME}`);
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
    errContainer.hidden = false
    errTitle.innerText = `VOIDING NVC-${addLeadingZeros(parseInt(data.INVOICE_NUM))}`
    errDescription.innerText = `Are you sure you want to void this invoice?`
}

function cancelVoid(){
    let errContainer = document.getElementById("error-container");
    errContainer.hidden = true;
}

function voidInvoice(){
    axios.post('/api/inv/void',{
        INVOICE_NUM: invoiceNum.ariaCurrent,
        BOL: data_send.BOL,
        MEMBER_NAME: data_send.MEMBER_NAME,
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