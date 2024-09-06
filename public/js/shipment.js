function createDInvoice(){
    // Get Everything
    // Get Charges

    axios.post("/api/create-dew-inv", data_send).then(res=>{
        if(res.status == 200 ){
            window.open("/api/get-dew-inv-pdf", '_blank').focus();
            location.reload();
        }
    }).catch(err=>{
        console.log(err);
    })
}

let data_send = {
    BOL: document.getElementById("BOL").value,
    MEMBER_NAME: document.getElementById("MEMBER_NAME").value,
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
    
}


// MEMBER_NAME, *
// TARIFF, *
// PAYMENT_TERMS, *
// TSA_NUM, *
// CHARGES, *
// TOTAL, *
// INVOICE_DATE, *
// BOL, *
// VESSEL, *
// VOYAGE, *
// DISCHARGE_PORT, *
// LOAD_PORT, *
// CONT_SIZE, *
// CONT_NUM, *
// RECEIPT_PLACE,*
// SCAC, *
// GBL, *
// TTL_CF, *
// PIECES, *
// TSP_NAME, *
// ADDRESS_1, *
// ADDRESS_2, *
// VOID, *
// BASED_ON, *
// INVOICE_NUM *

// BOL | TARIFF | PAYMENT_TERMS | TSA_NUM | CHARGES | VOID | TOTAL | INVOICE_DATE | MEMBER_NAME | VESSEL | VOYAGE | DISCHARGE_PORT | LOAD_PORT | CONT_SIZE | CONT_NUM | SCAC | GBL | TTL_CF | PIECES | TSP_NAME | ADDRESS_1 | ADDRESS_2 | RECEIPT_PLACE | INVOICE_NUM | BASED_ON