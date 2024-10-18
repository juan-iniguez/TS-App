export let appUtils = {
    addLeadingZeros,
    json2csv,
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