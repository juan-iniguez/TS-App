export let appUtils = {
    addLeadingZeros,
    json2csv,
    InvoiceApi2localformat,
    findRateYear,
    renameForCSV
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

    let YEAR:number = invDate.getMonth()+1>=6 && invDate.getMonth()+1<=12?invDate.getFullYear():invDate.getFullYear()-1;

    return YEAR;

}

export type queryToCSV = {
    "Bill of Lading #"?:string,
    "APL Invoice"?:string,
    "Shipment Invoice"?:string,
    "Date Invoice Created"?: string,
    "GBL #"?: string,
    "TSP SCAC"?: string,
    "TSP Name"?: string,
    "Shipper Name"?: string,
    "Origin Name"?: string,
    "Load Port Name"?: string,
    "Discharge Port Name"?: string,
    "Destination Name"?: string,
    
    "Basic Ocean Freight"?: number,
    "Bunker Surcharge NOS"?: number,
    "Origin Terminal Handling"?: number,
    "Destination Terminal Handing"?: number,
    "Advance Manifest Compliance (AMS)"?: number,
    "Inland (Rail) Charge"?: number,
    "Container Inspection Fee & Survey Fee"?: number,
    "Total"?: number,
    "TSP Year Cycle"?:number
    "TSP % RATE"?:number,
    "TSP DISCOUNT"?:number,
    "Our %"?: number,
    "Our DISCOUNT"?: number,
    "Total APL Discount"?: number,
}

function renameForCSV(o:any):queryToCSV{
    let newRow:queryToCSV = {};
    // console.log(o);
    for(let n in o){
        switch (n) {
            case "BOL":
                newRow["Bill of Lading #"]=o[n]
                break;
            case "APL_INVOICE_NUM":
                newRow["APL Invoice"]=o[n]
                break;
            case "LOCAL_INVOICE_NUM":
                newRow["Shipment Invoice"]=o[n]
                break;
            case "INVOICE_DATE":
                newRow["Date Invoice Created"]= new Date(o[n]).toLocaleDateString('en-US');
                break;
            case "GBL":
                newRow["GBL #"]=o[n]
                break;
            case "SCAC":
                newRow["TSP SCAC"]=o[n]
                break;
            case "TSP_NAME":
                newRow["TSP Name"]=o[n]
                break;
            case "MEMBER_NAME":
                newRow["Shipper Name"]=o[n]
                break;
            case "RECEIPT_PLACE":
                newRow["Origin Name"]=o[n]
                break
            case "LOAD_PORT":
                newRow["Load Port Name"]=o[n]
                break;
            case "DISCHARGE_PORT":
                newRow["Discharge Port Name"]=o[n]
                break;
            case "DELIVERY_PLACE":
                newRow["Destination Name"]=o[n]
                break;
            case "OCF":
                newRow["Basic Ocean Freight"]=parseFloat(o[n].toFixed(2))
                break;
            case "FAF":
                newRow["Bunker Surcharge NOS"]=parseFloat(o[n].toFixed(2))
                break;
            case "THC_USA":
                newRow["Origin Terminal Handling"]=parseFloat(o[n].toFixed(2))
                break;
            case "Guam_THC":
                newRow["Destination Terminal Handing"]=parseFloat(o[n].toFixed(2))
                break;
            case "AMS":
                newRow["Advance Manifest Compliance (AMS)"]=parseFloat(o[n].toFixed(2))
                break;
            case "RAIL":
                newRow["Inland (Rail) Charge"]=parseFloat(o[n].toFixed(2))
                break;
            case "ISIF":
                newRow["Container Inspection Fee & Survey Fee"]=parseFloat(o[n].toFixed(2))
                break;
            case "TOTAL":
                newRow["Total"]=parseFloat(o[n].toFixed(2))
                break;
            case "YEAR":
                newRow["TSP Year Cycle"]=o[n];
            case "TSP_DISCOUNT":
                newRow["TSP % RATE"]=o[n];
                break
            case "TSP_DISCOUNT_AMOUNT":    
                newRow["TSP DISCOUNT"]=parseFloat(o[n].toFixed(2));
                break
            case "LOCAL_DISCOUNT":
                newRow["Our %"]=o[n];
                break
            case "LOCAL_DISCOUNT_AMOUNT":
                newRow["Our DISCOUNT"]=parseFloat(o[n].toFixed(2));
                break
            case "TOTAL_APL_DISCOUNT_AMOUNT":
                newRow["Total APL Discount"]=parseFloat(o[n].toFixed(2));
                break
            default:
                break;
        }
    }
    return newRow;
}