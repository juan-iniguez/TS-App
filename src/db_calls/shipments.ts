
/** Create shipment IF invoice is not yet created. 
 * 
 * This calls all the database queries to create a DeWitt Invoice
 * 
 * It does NOT create a DB entry for `DEWITT_INVOICES`
 * 
 * This stages the first step on creating `DEWITT_INVOICES` entry.   
 * 
 * Returns data_payload with all properties
 * */
export function createShipment(db:any, data_payload:any, MEMBER_NAME:any, BOL:any ,res:any){

    return new Promise((resolve,reject)=>{
        db.all("SELECT VESSEL,VOYAGE,DISCHARGE_PORT,LOAD_PORT,CONT_SIZE,CONT_NUM,SCAC,MEMBER_NAME,GBL,TTL_CF,PIECES,RECEIPT_PLACE,CUBIC_FEET,DELIVERY_PLACE  FROM APL_INVOICES INNER JOIN SHIPMENTS ON APL_INVOICES.BOL = SHIPMENTS.BOL INNER JOIN APL_WAYBILLS ON APL_INVOICES.BOL=APL_WAYBILLS.BOL WHERE SHIPMENTS.MEMBER_NAME=$MEMBER_NAME", MEMBER_NAME, (err:any,rows:any)=>{
            if(err){
              console.log(err)
            }else{
              // console.log(rows);
              data_payload = rows[0];
              db.all("SELECT TSP_NAME,ADDRESS_1,ADDRESS_2 FROM TSP WHERE SCAC=?", data_payload.SCAC,(err:any,rows1:any)=>{
                if(err){
                  console.log(err)
                }else{
                  // console.log(rows1)
                  if(!rows1[0]){
                    // SOMETIMES THERE WON'T BE A TSP BECAUSE THEY ARE OUT OF CONTRACT TSP's
                    // THIS WILL PROMPT THE USER TO FILL OUT THE DETAILS
                    data_payload.TSP_NAME = "N/A";
                    data_payload.ADDRESS_1 = "N/A";
                    data_payload.ADDRESS_2 = "N/A";
                  }else{
                    // console.log(rows);
                    data_payload.TSP_NAME = rows1[0].TSP_NAME;
                    data_payload.ADDRESS_1 = rows1[0].ADDRESS_1;
                    data_payload.ADDRESS_2 = rows1[0].ADDRESS_2;
                  }
                  data_payload.BOL = BOL;
        
                  let rate_query:any = {}
                  // $ORIGIN: String,
                  // $DESTINATION: String,
                  // $CONT_SIZE: String,
                  
                  rate_query["$CONT_SIZE"] = parseInt(data_payload.CONT_SIZE);
        
                  if(data_payload.RECEIPT_PLACE != "-"){
                    switch (data_payload.RECEIPT_PLACE) {
                      case "BALTIMORE, MD" :
                      case "CHARLESTON, SC":
                      case "JACKSONVILLE, FL":
                      case "NORFOLK, VA":
                      case "SABANNAH, GA":
                      rate_query["$ORIGIN"] = "USEC (Rail via Los Angeles, CA)";
                          break;
                      case "KANSAS CITY, KS":
                        rate_query["$ORIGIN"] = "Kansas City, KS (Rail via Los Angeles, CA)";
                        break
                      case "HOUSTON, TX":
                      case "NEW ORLEANS, LA":
                        rate_query["$ORIGIN"] = "Houston, TX/New Orleans, LA (Rail via Los Angeles, CA)";
                        break
                      case "HONOLULU, HI":
                        rate_query["$ORIGIN"] = "Honolulu, HI (via Los Angeles, CA)";
                        break    
                      default:
                        break;
                    }
                  }else{
                    switch (data_payload.LOAD_PORT) {
                      case "LOS ANGELES, CA":
                      case "LONG BEACH, CA":
                      case "OAKLAND, CA":
                      case "SEATLE, WA":
                      case "TACOMA, WA":
                        rate_query["$ORIGIN"] = "LA/OAK/SEA";
                        break;
                      case "PITI, GUAM":
                        rate_query["$ORIGIN"] = "GUAM";
                        break;
                      default:
                        break;
                    }
                  }  
                  // console.log("### Delivery Place: " + data_payload.DELIVERY_PLACE);
                  if(data_payload.DELIVERY_PLACE != "-"){
                    switch (data_payload.DELIVERY_PLACE) {
                      case "BALTIMORE, MD" :
                      case "CHARLESTON, SC":
                      case "JACKSONVILLE, FL":
                      case "NORFOLK, VA":
                      case "SABANNAH, GA":
                        rate_query["$DESTINATION"] = "USEC (Rail via Los Angeles, CA)";
                        break;
                      case "KANSAS CITY, KS":
                        rate_query["$DESTINATION"] = "Kansas City, KS (Rail via Los Angeles, CA)";
                        break
                      case "HOUSTON, TX":
                      case "NEW ORLEANS, LA":
                        rate_query["$DESTINATION"] = "Houston, TX/New Orleans, LA (Rail via Los Angeles, CA)";
                        break
                      case "HONOLULU, HI":
                        rate_query["$DESTINATION"] = "Honolulu, HI (via Los Angeles, CA)";
                        break      
                      default:
                        break;
                    }
                  }else{
                    switch (data_payload.DISCHARGE_PORT) {
                      case "LOS ANGELES, CA":
                      case "LONG BEACH, CA":
                      case "OAKLAND, CA":
                      case "SEATLE, WA":
                      case "TACOMA, WA":
                        rate_query["$DESTINATION"] = "LA/OAK/SEA";
                        break;
                      case "PITI, GUAM":
                        rate_query["$DESTINATION"] = "Guam";
                        break;
                      default:
                        break;
                    }
                  }
        
                  // console.log(rate_query);
        
                  // Get the BASED_ON rate
                  data_payload.BASED_ON = parseFloat((data_payload.TTL_CF / data_payload.CUBIC_FEET).toFixed(5));
        
                  db.all("SELECT RATE,AMOUNT FROM RATES WHERE ORIGIN=$ORIGIN AND DESTINATION=$DESTINATION AND CONT_SIZE=$CONT_SIZE", rate_query,(err:any,rows2:any)=>{
                    // console.log(rows2);
                    data_payload.RATES = {};
                    data_payload.RATES.TOTAL = 0;
        
                    data_payload.NET_RATES = {};
                    data_payload.NET_RATES.TOTAL = 0;
        
                    for(let j in rows2){
                      data_payload.RATES[rows2[j].RATE] = rows2[j].AMOUNT;
                      data_payload.RATES.TOTAL += rows2[j].AMOUNT;
        
                      data_payload.NET_RATES[rows2[j].RATE] = rows2[j].AMOUNT * data_payload.BASED_ON;
                      data_payload.NET_RATES.TOTAL += rows2[j].AMOUNT * data_payload.BASED_ON;
                    }
                    // console.log(data_payload);
                    resolve(data_payload);
                  })
                }
              })
            }
          })
          // console.log(data_payload)        
    })
}

/**Check if the shipment has a valid 'DEWITT_INVOICES' entry 
 * 
 * Returns `exists` and `data` properties
*/
export function checkShipment(db:any, MEMBER_NAME:any){
    
    const response = new Promise((resolve,reject)=>{
        db.all('SELECT * FROM DEWITT_INVOICES WHERE MEMBER_NAME=?', MEMBER_NAME, (err:any,rows:any)=>{
            // console.log("#### ERROR: " + err);
            if(rows[0] == undefined || rows == undefined ){
                resolve({exists: false, data: rows})
            }else{
                resolve({exists: true, data: rows})
            }
        })
    }) 

    return Promise.resolve(response);
}

export function getInvoiceCount(db:any){
    return new Promise((resolve,reject)=>{
        db.all("SELECT INVOICE_NUM FROM DEWITT_INVOICES ORDER BY INVOICE_NUM DESC LIMIT 1", (err:any, rows:any)=>{
            if(err){
                resolve(err);
            }else{
                rows.length == 0?resolve(1):resolve(rows[0].INVOICE_NUM + 1);
            }
        })
    }) 
}