import { resolve } from 'path';
import { db } from '../db_init/db_init'
import { rejects } from 'assert';
// SETTINGS FOR TSP AND RATES
export const localSettings = {
    insertTSP,
    insertRATES,
    getTSP,
    getRATES,
    getAllYearCyclesTSP,
    getAllYearCyclesRates,
    updateTSP,
    doesYearExistTSP,
}

function doesYearExistTSP(year:number):Promise<boolean>{
    return new Promise((resolve,rejects)=>{
    db.all("SELECT YEAR FROM TSP WHERE YEAR=?",year,(err,rows)=>{
            if(err){console.error(err);rejects(err)}
            if(rows.length==0) resolve(false)
            else resolve(true)
        })
    }) 
}

/**
 * Insert entry for `TSP` table
 * @param data
 */
function insertTSP(data:any): void{
    db.run("INSERT INTO TSP (SCAC, TSP_NAME, DISC_FROM_GUA, DISC_TO_GUA, ADDRESS_1, ADDRESS_2, DATE_CREATED, BILLING_EMAIL,CONTRACT_DATE,YEAR) VALUES ($SCAC, $TSP_NAME, $DISC_FROM_GUA, $DISC_TO_GUA, $ADDRESS_1, $ADDRESS_2, $DATE_CREATED, $BILLING_EMAIL, $CONTRACT_DATE, $YEAR)", data,(result:any, err:any)=>{
        console.log(result);
        console.error(err);
        if(err){
            console.error(err);
        }
    });
}

/**
 * 
 * @param data 
 */
function updateTSP(data:any):void{

    let checkDB={
        $YEAR: data["$YEAR"],
        $SCAC: data["$SCAC"],
    }
    // console.log(checkDB);
    db.all("SELECT SCAC FROM TSP WHERE SCAC=$SCAC AND YEAR=$YEAR",checkDB,(err:any,rows:any)=>{
        if(err){console.log(err);console.log('Error?')}
        if(rows.length > 0){
            db.run("UPDATE TSP SET TSP_NAME=$TSP_NAME,DISC_FROM_GUA=$DISC_FROM_GUA,DISC_TO_GUA=$DISC_TO_GUA,ADDRESS_1=$ADDRESS_1,ADDRESS_2=$ADDRESS_2, DATE_CREATED=$DATE_CREATED,BILLING_EMAIL=$BILLING_EMAIL,CONTRACT_DATE=$CONTRACT_DATE WHERE SCAC=$SCAC AND YEAR=$YEAR", data,(res:any,err:any)=>{
                if(err){console.error(err);}
            })
        }else{
            db.run("INSERT INTO TSP (SCAC,TSP_NAME,DISC_FROM_GUA,DISC_TO_GUA,ADDRESS_1,ADDRESS_2,DATE_CREATED,BILLING_EMAIL,CONTRACT_DATE,YEAR) VALUES ($SCAC,$TSP_NAME,$DISC_FROM_GUA,$DISC_TO_GUA,$ADDRESS_1,$ADDRESS_2,$DATE_CREATED,$BILLING_EMAIL,$CONTRACT_DATE,$YEAR)",data,(res:any,err:any)=>{
                if(err){console.error(err)};
            })
        }
    })
}


/**
 * Insert entry for `RATES` table
 * @param data
 */
function insertRATES(data:any):Promise<number>{
    return new Promise((resolve,reject)=>{
        db.run("INSERT INTO RATES (ORIGIN, DESTINATION, CONT_SIZE, OCF, THC_USA, Guam_THC, AMS, RAIL, ISIF, YEAR, DATE_CREATED) VALUES ($ORIGIN, $DESTINATION, $CONT_SIZE, $OCF, $THC_USA, $Guam_THC, $AMS, $RAIL, $ISIF, $YEAR, $DATE_CREATED)",data,(response:any, err:any)=>{
            if(err){
                console.error(err)
                reject({
                    msg: "Found an Error Inserting Rates",
                    err: err
                });
            }else{
                console.info(response)
                resolve(0);
            }
        })
    }) 
}

/**
 * 
 */
function getTSP(year:any){
    return new Promise((resolve,reject)=>{
        if(year){
            db.all("SELECT SCAC,TSP_NAME,DISC_FROM_GUA,DISC_TO_GUA,ADDRESS_1,ADDRESS_2,BILLING_EMAIL,CONTRACT_DATE,YEAR FROM TSP WHERE YEAR=?",year,(err:any,rows:any)=>{
                if(err){
                    console.error(err);
                    reject(err);
                }
                resolve(rows);
            });
        }else{
            db.all("SELECT SCAC,TSP_NAME,DISC_FROM_GUA,DISC_TO_GUA,ADDRESS_1,ADDRESS_2,BILLING_EMAIL,CONTRACT_DATE,YEAR FROM TSP",(err:any,rows:any)=>{
                if(err){
                    console.error(err);
                    reject(err);
                }
                resolve(rows);
            });
        }
    }) 
}

/**
 * 
 * Query individual rates from the DB `RATES`
 * 
 * Specify a Year to get that Year's rates or get ALL rates
 * 
 * @param year 
 * @returns Rates[objects]
 */
function getRATES(year:string):Promise<Array<object>>{
    // Complicated
    // TODO: MAKE IT DO ALL THE OTHER THINGS
    return new Promise((resolve:any,reject:any)=>{
        if(!year){
            db.all("SELECT * FROM RATES",(err:any, rows:any)=>{
                if(err){
                    console.error(err);
                    reject(err);
                }
                resolve(rows);
            });
        }else{
            db.all("SELECT * FROM RATES WHERE YEAR=?",year,(err:any, rows:any)=>{
                if(err){
                    console.error(err);
                    reject(err);
                }
                resolve(rows);
            });
        }
    })
}

function getAllYearCyclesTSP(){
    return new Promise((resolve,reject)=>{
        db.all('SELECT DISTINCT YEAR FROM TSP', (err,row:any)=>{
            if(err){reject(err);return;}
            let response = [];
            for(let i in row){
                response.push(row[i].YEAR);
            }
            return resolve(response);
        })
    })
}

/**
 * When called, it will output the years of all submitted rates in the system
 * 
 * This is mainly for populating the Rates folders section in `/rates`
 * 
 * @returns All distinct `YEAR` property on RATES
 */
function getAllYearCyclesRates(){
    return new Promise((resolve,reject)=>{
        db.all('SELECT DISTINCT YEAR FROM RATES', (err,rows:any)=>{
            console.log(rows);
            if(err){reject(err);return;}else{
                return resolve(rows);
            }
        })
    })
}
