export let appUtils = {
    addLeadingZeros,
    json2csv,
    InvoiceApi2localformat,
    findRateYear,
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
 * 
 * This transforms the invoice data that came in from APL API call to a more
 * DB Friendly version. (cuts unnecessary properties)
 * 
 * @param inv_data 
 * @returns Invoice with DB friendly data
 */
function InvoiceApi2localformat(inv_data:any){
    // console.log(inv_data);
    try {        
        let invOutput:any = {};
        invOutput.BOL = inv_data.invoice.transportDocumentReference;
        invOutput.INVOICE_NUM = inv_data.invoice.invoiceNo;
        invOutput.CUSTOMER_NUM = inv_data.payment.payer.code;
        invOutput.INVOICE_DATE = inv_data.rateApplicationDate || inv_data.invoice.invoiceDate;
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

/**
 * 
 * This function was originally to get the `Quarter` and `Year` for which the **Bunker rate** and **Ocean Rates** will be based from.
 * However, the Bunker rate needs to be done separately since it changes so erratically.
 * 
 * @param date 
 * @returns YEAR
 */
function findRateYear(date:number):number{
    const invDate = new Date(date);
    // To find Rate Year and Quarter we must define the Quarters
    // Year will depend on the Quarter plus Year.
    // Since Rates start on June 1st and so on, on the first of every Quarter Month.

    let YEAR:number = invDate.getMonth()>=6 && invDate.getMonth()<=12?invDate.getFullYear():invDate.getFullYear()-1;

    return YEAR;

}