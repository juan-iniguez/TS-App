export let appUtils = {
    addLeadingZeros,
    json2csv,
    InvoiceApi2localformat,
}

/**
 * Add leading Zeros for an Invoice
 * @param amount 
 * @returns 
 */
function addLeadingZeros(amount:any){
    let x = "";
    for(let i=0;i<6-amount.toString().length;i++){
        x += "0";
    }
    return x+amount;
    }   

function json2csv(jsonData:any){

    // Convert JSON to CSV manually
    let csv = '';
    
    // Extract headers
    const headers = Object.keys(jsonData[0]);
    csv += headers.join(',') + '\n';
    
    // Extract values
    jsonData.forEach((obj:any) => {
        const values = [];
        // console.log(obj)
        for(let i in obj){
            switch (obj[i]) {
                case null:
                    values.push("N/A")
                    break;
                default:
                    if(typeof obj[i] == "string"){
                        values.push(`\"${obj[i]}\"`)
                    }else{
                        values.push(obj[i])
                    }
                    break;
            }
        }
        csv += values.join(',') + '\n';
    });
    return csv;
}

/**
 *   "invoice": {
    "BOL": "USG0277735",
    "INVOICE_NUM": "NAMA1219921",
    "CUSTOMER_NUM": "0003152148/001",
    "INVOICE_DATE": "26-JUL-2024",
    "VOYAGE": "0DBIYW1PL",
    "VESSEL": "PRESIDENT JQ ADAMS",
    "RECEIPT_PLACE": "-",
    "DISCHARGE_PORT": "PITI, GUAM",
    "LOAD_PORT": "LOS ANGELES, CA",
    "DELIVERY_PLACE": "-",
    "CONT_SIZE": "40HC",
    "CONT_NUM": "CMAU8908730",
    "CHARGES": [
      {
        "SIZE": "40HC",
        "TYPE": "C",
        "DESC": "BASIC FREIGHT",
        "BASED_ON": 1.0,
        "RATE_CURR": 3768.0,
        "AMOUNT": 3768.0,
        "AMOUNT_USD": 3768.0
      },
      {
        "SIZE": "40HC",
        "TYPE": "C",
        "DESC": "Bunker surcharge NOS",
        "BASED_ON": 1.0,
        "RATE_CURR": 1230.0,
        "AMOUNT": 1230.0,
        "AMOUNT_USD": 1230.0
      },
      {
        "SIZE": "40HC",
        "TYPE": "C",
        "DESC": "Terminal handl. ch",
        "BASED_ON": 1.0,
        "RATE_CURR": 915.0,
        "AMOUNT": 915.0,
        "AMOUNT_USD": 915.0
      },
      {
        "SIZE": "40HC",
        "TYPE": "C",
        "DESC": "Terminal handl ch origin",
        "BASED_ON": 1.0,
        "RATE_CURR": 755.0,
        "AMOUNT": 755.0,
        "AMOUNT_USD": 755.0
      },
      {
        "SIZE": "40HC",
        "TYPE": "C",
        "DESC": "Container inspection fees and survey fees",
        "BASED_ON": 1.0,
        "RATE_CURR": 52.0,
        "AMOUNT": 52.0,
        "AMOUNT_USD": 52.0
      }
    ],
    "TOTAL": 6720.0
 * 
 * 
 */

function InvoiceApi2localformat(inv_data:any){
    // console.log(inv_data);
    try {        
        let invOutput:any = {};
        invOutput.BOL = inv_data.invoice.transportDocumentReference;
        invOutput.INVOICE_NUM = inv_data.invoice.invoiceNo;
        invOutput.CUSTOMER_NUM = inv_data.payment.payer.code;
        invOutput.INVOICE_DATE = inv_data.invoice.invoiceDate;
        invOutput.VOYAGE = inv_data.invoicedCall.voyageRef;
        invOutput.VESSEL = inv_data.invoicedCall.vessel.name;
        if(inv_data.shipment?.placeOfReceipt?.name){console.log("NO!")}
        invOutput.RECEIPT_PLACE = inv_data.shipment?.placeOfReceipt?.name === undefined? "-": inv_data.shipment.placeOfReceipt.name;
        invOutput.DISCHARGE_PORT = inv_data.shipment?.portOfDischarge?.name === undefined? "-": inv_data.shipment.portOfDischarge.name ;
        invOutput.DELIVERY_PLACE = inv_data.shipment?.placeOfDelivery?.name || "-";
        invOutput.LOAD_PORT = inv_data.shipment?.portOfLoading?.name || "-";
        invOutput.CONT_SIZE = inv_data.shipment.equipments[0].equipmentGroupIsoCode;
        invOutput.CONT_NUM = inv_data.shipment.equipments[0].containerNumber;
        invOutput.TOTAL = inv_data.invoice.invoiceAmount;
        invOutput.CHARGES = [];

        for(let chr=0;chr < inv_data.charges.length;chr++){
            console.log(chr);
            let chargesOutput:any = {};
            
            chargesOutput.SIZE = inv_data.shipment.equipments[0].equipmentGroupIsoCode;
            chargesOutput.TYPE = "C";
            chargesOutput.DESC = inv_data.charges[chr].chargeDescription;
            chargesOutput.BASED_ON = inv_data.charges[chr].quantity
            chargesOutput.RATE_CURR = inv_data.charges[chr].unitPrice
            chargesOutput.AMOUNT = inv_data.charges[chr].chargeAmount;
            chargesOutput.AMOUNT_USD = inv_data.charges[chr].chargeAmountInvoicingCurrency;
            invOutput.CHARGES.push(chargesOutput);
        }
        return invOutput;
    } catch (error) {
        console.log(error)
        return error
    }
}