import fs from 'fs'
import { PDFDocument } from 'pdf-lib'
import { aplDB } from '../db_calls/shipments';
import { db } from '../db_init/db_init'
import { appUtils } from '../utils';
import { spawn } from 'child_process';
import { apl } from '../db_calls/apl';
import path from 'path';

export let writePDF = {
    writeOceanInv,
}

export let readPDF = {
    parseWaybill,
}

/**
 * 
 * Creates the Ocean Invoice from shipment. This is initiated on the front end from the shipment view.
 * This will recompile all data and insert a new record to the DB per invoice created.
 * 
 * @param data 
 * @param val 
 * @param initInv 
 * @returns PDF in bytes buffer
 */
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
        // console.log(db_payload);
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
        // console.log(dewInv_db_ready);
        aplDB.insertLocalInvoice(dewInv_db_ready).then((res)=>{
            // console.log(res);
        }).catch((reason)=>{
            // r
            console.log(reason);
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
        if(typeof(db_payload[fields_names[i]]) == typeof(0) && fields_names[i] != "INVOICE_NUM" && fields_names[i] != "INVOICE_DATE"){
            textField.setText(db_payload[fields_names[i]].toString());
        }else if(fields_names[i] == "INVOICE_NUM"){
            textField.setText("NVC-" + addLeadingZeros(db_payload[fields_names[i]].toString().split('').length) + db_payload[fields_names[i]] );
        }else if(fields_names[i] == "INVOICE_DATE"){
            textField.setText(new Date(db_payload[fields_names[i]]).toJSON().slice(0, 10));
        }else{
            textField.setText(db_payload[fields_names[i]]);
        }
        textField.enableReadOnly()
    }
    
    // CHARGES
    // Charges BASED ON
    form.getTextField("BASED_ON").setText(db_payload.BASED_ON.toString());

    form.getTextField("BASED_ON").acroField.Kids()?.asArray().forEach((e)=>{
        console.log(e.toString());
    })

    // RATE
    for(let i in db_payload.CHARGES.RATES){
        let key = i;
        if(key.includes(" ") && !key.includes("Inland (Rail)") && !key.includes("Invasive Species Inspection Fee")){key = key.replace(/ /g,"_")};
        if(key.includes("Inland (Rail)")){key = "RAIL"};
        if(key.includes("Invasive Species Inspection Fee")){key = "ISIF"};
        if(i == "TOTAL" || i == "YEAR"){continue};

        form.getTextField("RATES-" + key).setText(db_payload.CHARGES.RATES[i].toLocaleString('en-US', {style: 'currency', currency: 'USD'}));
        form.getTextField("RATES-" + key).enableReadOnly();
    }
    
    // NET_RATES
    for(let i in db_payload.CHARGES.NET_RATES){
        let key = i;
        if(key.includes(" ") && !key.includes("Inland (Rail)") && !key.includes("Invasive Species Inspection Fee")){key = key.replace(/ /g,"_")};
        if(key.includes("Inland (Rail)")){key = "RAIL"};
        if(key.includes("Invasive Species Inspection Fee")){key = "ISIF"};
        if(i == "TOTAL" || i == "YEAR"){continue}
        
        form.getTextField("NET_RATES-" + key).setText(db_payload.CHARGES.NET_RATES[i].toLocaleString('en-US', {style: 'currency', currency: 'USD'}));
        form.getTextField("NET_RATES-" + key).enableReadOnly();
    }
    
    form.getTextField("TOTAL").setText(db_payload.CHARGES.NET_RATES.TOTAL.toLocaleString('en-US', {style: 'currency', currency: 'USD'}));  
    form.getTextField("TOTAL").enableReadOnly();  

    if(db_payload.VOID > 0){
        db_payload.VOID_INFO = JSON.parse(db_payload.VOID_INFO);
        form.getTextField("VOID_REASON").setText(db_payload.VOID_INFO.reason);
        form.getTextField("VOID_DATE").setText(new Date(db_payload.VOID_INFO.date).toLocaleDateString("en-US"));
        form.getTextField("VOID_REASON").enableReadOnly();
        form.getTextField("VOID_DATE").enableReadOnly();
    }
    pdfDoc.setTitle("NVC-"+appUtils.addLeadingZeros(db_payload.INVOICE_NUM))
    const pdfBytes = await pdfDoc.save();
    return pdfBytes

}

function parseWaybill(waybillPDF:any, BOL:string, code: string){
    console.log(code,BOL);
    return new Promise((resolve,reject)=>{
        let waybill_dir = path.join(__dirname + `../../../cache/waybills/${BOL}`);
        fs.writeFileSync( waybill_dir+'.pdf',Buffer.from(waybillPDF.data))        
        // Now action the script with arguments
        let pythonERROR = {
            status: false,
            msg: String,
        };

        let pythonProcess = code == "GUPIT"? spawn('python3.11', ["scripts/readGuamWaybillPDF.py", waybill_dir+'.pdf' , "-d"]) :spawn('python3.11', ["scripts/readWaybillPDF.py", waybill_dir+'.pdf' , "-d"]);
        
        pythonProcess.stdout.on('data', function (data: Buffer) {
            // Get Debug Information from here
            fs.appendFileSync(path.join(__dirname + "../../../logs/python/debug.txt"), `-------------------- ${ new Date().toLocaleDateString("en-US") } - ${BOL}: -------------------- \n\n` + data.toString() + "-------------------- END! -------------------- \n\n\n");
            // console.log(data.toString());
        });
        pythonProcess.stderr.on('data', (err: any) => {
            console.error("ERROR: " + err.toString())
            console.warn("Python had an error, please check the script!!!");
            fs.appendFileSync(path.join(__dirname + "../../../logs/python/logs.txt"), `${new Date().toLocaleDateString("en-US")}\n${err.toString()}`);
            if (err) { pythonERROR.status = true; pythonERROR.msg = err.toString() };
        })
        pythonProcess.stdout.on('end', (end: any) => {
            // CHECK IF ENTRY IS ALREADY UPLOADED
            if (pythonERROR.status) {
                reject({
                    reason: "There was an issue parsing the files,\n please contact your administrator. (Python Parsing Error)",
                    status: 500,
                    description: pythonERROR.msg,
                });
            }else{
                let result = JSON.parse(fs.readFileSync(waybill_dir +'.json', 'utf8'));
                // console.log(result)
                if (!result.waybill) {
                    console.error("No Invoice or Waybill found in files!!!");
                    console.warn("This could be because the user didn't submit the appropriate Invoice or Waybill files");
                    reject({
                        reason: "One of your files could not be processed!",
                        status: 500,
                    });
                }
                apl.checkInv(result.waybill.BOL)
                .then((data_res) => {
                    if (data_res[0] == undefined) {
                        resolve({ status: "OK", all: result })
                    } else {
                        console.error("Shipment Invoice or Waybill already exists.")
                        console.warn('User tried uploading: ' + result.invoice.BOL + " --- Already Exists in the Database")
                        reject({
                            reason: "Shipment Invoice or Waybill already exists.",
                            status: 200,
                        });
                    }
                })
                .catch((reason) => {
                    console.error("Undefined Error: " + reason.toString());
                    console.warn("Revise Python file, this could be a parsing issue")
                    reject({
                        reason: reason.toString(),
                        status: 500,
                    });
                })
            }
        })
    })
}