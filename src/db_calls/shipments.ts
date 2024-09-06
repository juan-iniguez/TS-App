
export let aplDB = {
  createShipment,
  checkShipmentInvoice,
  getInvoiceCount,
  insertDeWittInvoice,
}

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
                    resolve(data_payload);
                  })
                }
              }
            )
          }
        }
      )
    })
}

/**Check if the shipment has a valid 'DEWITT_INVOICES' entry 
 * 
 * Returns `exists` and `data` properties
 * 
 * Example:
 * ```js
 * checkShipment(db,MEMBER_NAME)
 * .then((res)=>{
 *    if(res.exists){... return res.data}
 * })
 * ```
 * @param db - SQLITE Database
 * @param MEMBER_NAME - Name of the customer/member of the shipment
 * @returns Resolved Promise
*/
export function checkShipmentInvoice(db:any, MEMBER_NAME:any){
    const response:Promise<Object> = new Promise((resolve,reject)=>{
        console.log(MEMBER_NAME)
        db.all('SELECT * FROM DEWITT_INVOICES WHERE MEMBER_NAME=?', MEMBER_NAME, (err:any,rows:any)=>{
          console.log(rows[0] == undefined)
          if(rows[0] == undefined){
            console.log("No It Doesnt exist")
            resolve({exists: false, data: rows})
          }else{
            console.log("Yes it exists")
            resolve({exists: true, data: rows})
          }
        })
    }) 
    return Promise.resolve(response);
}

/**
 * Get the total count of inv as an `int` this is to get the INV-##### number
 * 
 * @param db 
 * @returns `int` with number with total invoices in the DEWITT_INVOICES table 
 */
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

/**
 * Insert an entry in `DEWITT_INVOICES` table. 
 * This will register an invoice when created.
 * 
 * DATA MUST HAVE THE FOLLOWING:
 * 
 * ```js
 *  let example = {
 *   BOL: 'USG0260825',
 *   VESSEL: 'PRESIDENT KENNEDY',
 *   VOYAGE: '0DBHOW1PL',
 *   DISCHARGE_PORT: 'PITI, GUAM',
 *   LOAD_PORT: 'LOS ANGELES, CA',
 *   RECEIPT_PLACE: 'BALTIMORE, MD',
 *   CONT_SIZE: '40HC',
 *   CONT_NUM: 'CMAU7055123',
 *   SCAC: 'SSAV',
 *   MEMBER_NAME: 'PARKER, CRSYTAL',
 *   GBL: 'HHE677321',
 *   TTL_CF: 671,
 *   PIECES: '4/4',
 *   TOTAL: ,
 *   CHARGES: ,
 *   TSP_NAME: 'N/A', 
 *   ADDRESS_1: 'N/A', 
 *   ADDRESS_2: 'N/A', 
 *   BASED_ON: 0.35, 
 *   VOID:,
 *   RATES: {
 *     TOTAL: 9772,
 *     OCF: 3768,
 *     'THC USA': 755,
 *     AMS: 0,
 *     'Inland (Rail)': 3020,
 *     'Invasive Species Inspection Fee': 52,
 *     'Guam THC': 915,
 *     FAF: 1262
 *   },
 *   NET_RATES: {
 *     TOTAL: 3420.2,
 *     OCF: 1318.8,
 *     'THC USA': 264.25,
 *     AMS: 0,
 *     'Inland (Rail)': 1057,
 *     'Invasive Species Inspection Fee': 18.2,
 *     'Guam THC': 320.25,
 *     FAF: 441.7
 *   }
 * }
 * 
 * ```
 * 
 * @param db - SQLITE DATABASE
 * @param data - Data to add to the entry
 * @returns error or nothing when successful
 */
export function insertDeWittInvoice(db:any,data:any){
  return new Promise((resolve,reject)=>{
    db.all("INSERT INTO DEWITT_INVOICES (MEMBER_NAME, TARIFF, PAYMENT_TERMS, TSA_NUM, CHARGES, TOTAL, INVOICE_DATE, BOL, VESSEL, VOYAGE, DISCHARGE_PORT, LOAD_PORT, CONT_SIZE, CONT_NUM, RECEIPT_PLACE,SCAC, GBL, TTL_CF, PIECES, TSP_NAME, ADDRESS_1, ADDRESS_2, VOID, BASED_ON, INVOICE_NUM) VALUES ($MEMBER_NAME, $TARIFF, $PAYMENT_TERMS, $TSA_NUM, $CHARGES, $TOTAL, $INVOICE_DATE, $BOL,$VESSEL, $VOYAGE, $DISCHARGE_PORT, $LOAD_PORT, $CONT_SIZE, $CONT_NUM, $RECEIPT_PLACE,$SCAC, $GBL, $TTL_CF, $PIECES, $TSP_NAME, $ADDRESS_1, $ADDRESS_2, $VOID, $BASED_ON, $INVOICE_NUM)", data,(x:any, err:any)=>{
      if(err){
        console.log(err)
        reject(err)
      }
    })
  })
}