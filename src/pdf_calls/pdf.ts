import fs from 'fs'
import { PDFDocument } from 'pdf-lib'
import { aplDB } from '../db_calls/shipments';
import { db } from '../db_init/db_init'

export let writePDF = {
    writeOceanInv
}

async function writeOceanInv(data:any, val:any, initInv:boolean){
    const pdfDoc = !data.VOID?await PDFDocument.load(fs.readFileSync('resources/TSPInvoice.pdf')):await PDFDocument.load(fs.readFileSync('resources/TSPInvoiceVoid.pdf'));
    const form = pdfDoc.getForm()
    let data_payload = data;
    let db_payload;
    let settings = JSON.parse(fs.readFileSync('public/files/settings.json', "utf8"));
    let fields_names = [
        "TSP_NAME",
        "SCAC",
        "ADDRESS_1",
        "ADDRESS_2",
        "VESSEL",
        "VOYAGE",
        "BOL",
        "CONT_NUM",
        "INVOICE_DATE",
        "CONT_SIZE",
        "RECEIPT_PLACE",
        "LOAD_PORT",
        "DISCHARGE_PORT",
        "MEMBER_NAME",
        "GBL",
        "PIECES",
        "TTL_CF",
        "INVOICE_NUM",
        "TSA_NUM",
        "PAYMENT_TERMS",
        "TARIFF",
    ]

    if(initInv){
        data_payload.INVOICE_DATE = new Date();
        data_payload.PAYMENT_TERMS = settings.PAYMENT_TERMS[0];
        data_payload.TSA_NUM = settings.TSA_NUM;
        data_payload.TARIFF = settings.TARIFF;
        data_payload.INVOICE_NUM = val;
        data_payload.VOID = null;
    
        db_payload = {...data_payload};
        delete db_payload["DELIVERY_PLACE"];
        delete db_payload["CUBIC_FEET"];
        delete db_payload["RATES"]
        delete db_payload["NET_RATES"]
        db_payload.CHARGES = {RATES: data_payload.RATES,NET_RATES: data_payload.NET_RATES}
        db_payload.TOTAL = data_payload.NET_RATES.TOTAL;  
    }else{
        db_payload = data;
        console.log(db_payload);
    }

    let dewInv_db_ready:any = {}
    
    // If its the first time then do this
    if(initInv){
        for(let x in db_payload){
            if("CHARGES" == x){
                dewInv_db_ready["$" + x] = JSON.stringify(db_payload[x])
            }else{
            dewInv_db_ready["$" + x] = db_payload[x];
            }
        }
        aplDB.insertLocalInvoice(dewInv_db_ready).then((res)=>{
            console.log(res);
        }).catch((reason)=>{
            // r
        })
    }else{
        db_payload.CHARGES = JSON.parse(db_payload.CHARGES);
    }


    function addLeadingZeros(amount:any){
        let x = "";
        for(let i=0;i<6-amount;i++){
            x += "0";
        }
        return x;
    }

    for(let i in fields_names){
        // Set the text value
        let textField = form.getTextField(fields_names[i]);
        if(typeof(db_payload[fields_names[i]]) == typeof(0) && fields_names[i] != "INVOICE_NUM"){
            textField.setText(db_payload[fields_names[i]].toString());
        }else if(fields_names[i] == "INVOICE_NUM"){
            textField.setText("NVC-" + addLeadingZeros(db_payload[fields_names[i]].toString().split('').length) + db_payload[fields_names[i]] );
        }else if(fields_names[i] == "INVOICE_DATE"){
            textField.setText(new Date(db_payload[fields_names[i]]).toJSON().slice(0, 10));
        }else{
            textField.setText(db_payload[fields_names[i]]);
        }
    }
    
    // CHARGES
    // Charges BASED ON
    form.getTextField("BASED_ON").setText(db_payload.BASED_ON.toString());

    // RATE
    for(let i in db_payload.CHARGES.RATES){
        if(i == "TOTAL"){continue}
        form.getTextField("RATES-" + i).setText(db_payload.CHARGES.RATES[i].toLocaleString('en-US', {style: 'currency', currency: 'USD'}));
    }
    
    // NET_RATES
    for(let i in db_payload.CHARGES.NET_RATES){
        if(i == "TOTAL"){continue}
        form.getTextField("NET_RATES-" + i).setText(db_payload.CHARGES.NET_RATES[i].toLocaleString('en-US', {style: 'currency', currency: 'USD'}));
    }
    
    form.getTextField("TOTAL").setText(db_payload.CHARGES.NET_RATES.TOTAL.toLocaleString('en-US', {style: 'currency', currency: 'USD'}));  

    if(db_payload.VOID > 0){
        db_payload.VOID_INFO = JSON.parse(db_payload.VOID_INFO);
        form.getTextField("VOID_REASON").setText(db_payload.VOID_INFO.reason);
        form.getTextField("VOID_DATE").setText(new Date(db_payload.VOID_INFO.date).toLocaleDateString("en-US"));
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes
    // fs.writeFileSync('resources/TSP Invoice.pdf',pdfBytes);
    // res.sendStatus(200);

}