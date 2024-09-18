import { db } from '../db_init/db_init'

export const searchDB = {
    getShipments,
    getLocalInvoices,
    getTSP,
    getRATES,
}

function getShipments(arg:any,search:any): Promise<any>{
    return new Promise((resolve,reject)=>{
        if(search == "" && arg == ""){
            db.all("Select BOL, MEMBER_NAME,SCAC,GBL,TTL_CF,PIECES, DATE_CREATED from SHIPMENTS ORDER BY DATE_CREATED DESC LIMIT 50",(err, rows)=>{
                err?reject(err):resolve(rows);
            });
        }else{
            db.all(`Select BOL, MEMBER_NAME,SCAC,GBL,TTL_CF,PIECES, DATE_CREATED from SHIPMENTS WHERE ${arg} LIKE ? ORDER BY DATE_CREATED DESC LIMIT 50`,[search],(err, rows)=>{
                err?reject(err):resolve(rows);
            });
        }
    })  
}
function getLocalInvoices(arg:any,search:any): Promise<any>{
    return new Promise((resolve,reject)=>{
        if(search == "" && arg == ""){
            db.all("Select INVOICE_NUM, MEMBER_NAME, BOL, INVOICE_DATE, TOTAL, VOID  from LOCAL_INVOICES ORDER BY INVOICE_DATE DESC LIMIT 50",(err, rows)=>{
                err?reject(err):resolve(rows);
            });
        }else{
            search = '%'+search+'%';
            db.all(`Select INVOICE_NUM, MEMBER_NAME, BOL, INVOICE_DATE, TOTAL, VOID  from LOCAL_INVOICES WHERE ${arg} LIKE ? ORDER BY INVOICE_DATE DESC LIMIT 50`,[search],(err, rows)=>{
                err?reject(err):resolve(rows);
            });
        }
    })
}
function getTSP(arg:any,search:any): Promise<any>{
    return new Promise((resolve,reject)=>{
        if(search == "" && arg == ""){
            db.all("Select SCAC,TSP_NAME,DISC_FROM_GUA, DISC_TO_GUA  from TSP ORDER BY DATE_CREATED DESC LIMIT 50",(err, rows)=>{
                err?reject(err):resolve(rows);
            });
        }else{
            search = '%'+search+'%';
            db.all(`Select SCAC,TSP_NAME,DISC_FROM_GUA, DISC_TO_GUA  from TSP WHERE ${arg} LIKE ? ORDER BY DATE_CREATED DESC LIMIT 50`,[search],(err, rows)=>{
                err?reject(err):resolve(rows);
            });
        }
    })
}
function getRATES(arg:any, search:any): Promise<any>{
    return new Promise((resolve,reject)=>{
        if(search == "" && arg == ""){
            db.all("Select RATE,ORIGIN,DESTINATION,CONT_SIZE,AMOUNT,DATE_CREATED  from RATES ORDER BY DATE_CREATED DESC LIMIT 50",(err, rows)=>{
              // console.log(rows);
                err?reject(err):resolve(rows);
            });
        }else{
            search = '%'+search+'%';
            db.all(`Select RATE,ORIGIN,DESTINATION,CONT_SIZE,AMOUNT,DATE_CREATED  from RATES WHERE ${arg} LIKE ? ORDER BY DATE_CREATED DESC LIMIT 50`,[search],(err, rows)=>{
              // console.log(rows);
                err?reject(err):resolve(rows);
            });
        }
    })
}
