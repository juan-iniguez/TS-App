import { db } from '../db_init/db_init'
// SETTINGS FOR TSP AND RATES
export const localSettings = {
    insertTSP,
    insertRATES,
    getTSP,
    getRATES,
}

/**
 * Insert entry for `TSP` table
 * @param data
 */
function insertTSP(data:any): void{
    db.run("INSERT INTO TSP (SCAC, TSP_NAME, DISC_FROM_GUA, DISC_TO_GUA, ADDRESS_1, ADDRESS_2, DATE_CREATED, BILLING_EMAIL) VALUES ($SCAC, $TSP_NAME, $DISC_FROM_GUA, $DISC_TO_GUA, $ADDRESS_1, $ADDRESS_2, $DATE_CREATED, $BILLING_EMAIL)", data,(result:any, err:any)=>{
        if(err){
            console.error(err);
        }
    });
}

/**
 * Insert entry for `RATES` table
 * @param data
 */
function insertRATES(data:any): void{
    db.run("INSERT INTO RATES (RATE, ORIGIN, DESTINATION, CONT_SIZE, AMOUNT, DATE_CREATED) VALUES ($RATE, $ORIGIN, $DESTINATION, $CONT_SIZE, $AMOUNT, $DATE_CREATED)",data,(response:any, err:any)=>{
        if(err){
            console.log(err)
        }
    })
}

/**
 * 
 */
function getTSP(){
    return new Promise((resolve,reject)=>{
        db.all("SELECT SCAC,TSP_NAME,DISC_FROM_GUA,DISC_TO_GUA,ADDRESS_1,ADDRESS_2,BILLING_EMAIL FROM TSP",(err:any,rows:any)=>{
            if(err){
                console.error(err);
                reject(err);
            }
            resolve(rows);
        });
    }) 
}

/**
 * 
 */
function getRATES(){

    // Complicated
    // TODO: MAKE IT DO ALL THE OTHER THINGS
    return new Promise((resolve,reject)=>{
        db.all("SELECT * FROM RATES",(result:any, err:any)=>{
            if(err){
                console.error(err);
                reject(err);
            }
            resolve(result);
        });
    }) 
}
