import { db } from '../db_init/db_init'
import { oauth } from '../auth/APL_oauth';
import axios from 'axios';

export const apl = {
    entryInv,
    entryWay,
    entryShipment,
    checkInv,
    getWaybillPDF,
    getInvoiceData,
}

/**
 * Insert an entry to the DB table `APL_INVOICES` for an APL invoice
 * @param data 
 */
function entryInv(data:any): void{
    db.run("INSERT INTO APL_INVOICES (BOL, INVOICE_NUM, CUSTOMER_NUM, VESSEL, VOYAGE, DISCHARGE_PORT, LOAD_PORT, RECEIPT_PLACE, DELIVERY_PLACE, CONT_SIZE, CONT_NUM, INVOICE_DATE, DATE_CREATED,TOTAL, CHARGES) VALUES ($BOL, $INVOICE_NUM, $CUSTOMER_NUM, $VESSEL, $VOYAGE, $DISCHARGE_PORT, $LOAD_PORT, $RECEIPT_PLACE, $DELIVERY_PLACE, $CONT_SIZE, $CONT_NUM, $INVOICE_DATE, $DATE_CREATED,$TOTAL, $CHARGES)", data,(response:any, err:any)=>{
        if(err){
            console.log(`APL_INVOICE: ${err}`)
        }else{
            // console.log(`${Date.now()} -- APL_INVOICE Entry Created! -- BOL: ${invoice.BOL} `);
        }
    });
}

/**
 * 
 * Insert entry for `APL_WAYBILLS` table
 * @param data 
 */
function entryWay(data:any): void{
    db.run("INSERT INTO APL_WAYBILLS (BOL,CODE,SERIAL_NUM,WEIGHT_LBS,CUBIC_FEET,ETD,ETA,SHIPMENTS,DATE_CREATED) VALUES ($BOL, $CODE, $SERIAL_NUM,$WEIGHT_LBS, $CUBIC_FEET, $ETD, $ETA, $SHIPMENTS, $DATE_CREATED)", data,(response_:any, err_:any)=>{
        if(err_){
            console.log("APL WAYBILL ERROR: " + err_);
        }else{
            // console.log(`${Date.now()} -- APL_WAYBILLS Entry Created! -- BOL: ${waybill.BOL} `);
        }
    });
    
}

/**
 * 
 * Create entry for `SHIPMENTS` table
 * 
 * @param data 
 */
function entryShipment(data:any): void{
    db.run("INSERT INTO SHIPMENTS (BOL, RDD, NET, WEIGHT_LBS, SCAC, MEMBER_NAME, GBL, TTL_CF, PIECES, DATE_CREATED) VALUES ($BOL, $RDD, $NET, $WEIGHT_LBS, $SCAC, $MEMBER_NAME, $GBL, $TTL_CF, $PIECES, $DATE_CREATED)", data, (res:any,err:any)=>{
        if(err){
            console.log(err);
        }else{
          // console.log(`${Date.now()} -- SHIPMENTS Entry Created! -- MEMBER_NAME:${shipments[i].SM}`);
        }
    })  
}

/**
 * Get results from `APL_INVOICES` table query
 * 
 * @param BOL 
 * @returns Promise with err or rows from SQL query
 */
function checkInv(BOL?:any, INVOICE_NUM?:any): Promise<any>{
    return new Promise((resolve,reject)=>{
        if(BOL != undefined && INVOICE_NUM == undefined){
            db.all("SELECT APL_INVOICES.BOL FROM APL_INVOICES INNER JOIN APL_WAYBILLS ON APL_INVOICES.BOL = APL_WAYBILLS.BOL WHERE APL_INVOICES.BOL=?", BOL,(err,rows:Array<any>)=>{
                if(err){
                    reject(err)
                }else{
                    resolve(rows)
                }
            });
        }else if(BOL == undefined && INVOICE_NUM != undefined){
            console.log("INVOICE NUM: ", INVOICE_NUM)
            db.all("SELECT BOL FROM APL_INVOICES WHERE INVOICE_NUM=?", INVOICE_NUM, (err,rows)=>{
                err?reject(err):resolve(rows);
            })

        }
    })
}


// ? Cache for Invoice Data (in Memory Cache, volatile)
let inMemoryCache = new Map();

async function setCacheToExpire(invoice_num:any,data:any){
    inMemoryCache.set(invoice_num,data)
    setTimeout(()=>{
        inMemoryCache.delete(invoice_num)
    },3600000)
}


/**
 * 
 * Get Waybill PDF from APL's API 
 * 
 * @param BOL 
 */
function getWaybillPDF(BOL:any){
    return new Promise((resolve,reject)=>{
        // * Check if it already exists in CACHE
        if(inMemoryCache.get(BOL)){
            resolve(inMemoryCache.get(BOL))
            return
        }
        oauth.getTokenInv('blcopy:load:be').then((token:any)=>{
            axios.get(`https://apis.cma-cgm.net/shipping/shippingdocument/blcopy/v1/document?blNumber=${BOL}`,{
                responseType: 'arraybuffer',
                headers:{
                    "Authorization": "Bearer " + token,
                    Accept: "application/pdf",
                }
            })
            .then(response=>{
                // * CACHE THE DATA
                let invData = response;
                setCacheToExpire(BOL,invData);
                resolve(invData);
            })
            .catch(err=>{
                reject(err.response.data);
            })
        })
    }) 
}

/**
 * 
 * Get Invoice data from APL API
 * 
 * @param invoice_num 
 */
function getInvoiceData(invoice_num:any){
    return new Promise((resolve,reject)=>{
        // * Check if it already exists in CACHE
        if(inMemoryCache.get(invoice_num)){
            resolve(inMemoryCache.get(invoice_num))
            return
        }
        oauth.getTokenInv('invoicepartnerdata:load:be').then((token:any)=>{
            axios.get(`https://apis.cma-cgm.net/shipping/invoicing/customer/data/v2/invoices/${invoice_num}/data`,{
                headers:{
                    "Authorization": "Bearer " + token,
                }
            })
            .then(response=>{
                // * CACHE THE DATA
                let invData = response.data;
                setCacheToExpire(invoice_num,invData);
                console.log("----------- DATA RECEIVED -----------")
                console.log(invData);
                resolve(invData);

            })
            .catch(err=>{
                reject(err.response.data)
            })
        })
    })
}