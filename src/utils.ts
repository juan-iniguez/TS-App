export let appUtils = {
    addLeadingZeros,
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
