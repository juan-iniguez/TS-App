let data_send = {
    BOL: document.getElementById("BOL").value,
    MEMBER_NAME: document.getElementById("MEMBER_NAME").value,
}

function createDInvoice(){
    // Get Everything
    // Get Charges

    axios.get(`/api/create-dew-inv/${data_send.BOL}/${data_send.MEMBER_NAME}`).then(res=>{
        if(res.status == 200 ){
            window.open("/api/get-dew-inv-pdf", '_blank').focus();
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
    axios.get(`/api/create-dew-inv/${data_send.BOL}/${data_send.MEMBER_NAME}`)
}

