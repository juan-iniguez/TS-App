import { db } from '../db_init/db_init'
// SETTINGS FOR TSP AND RATES
export const localSettings = {
    insertTSP,
    insertRATES,
    getTSP,
    getRATES,
    getAllYearCyclesTSP,
    getAllYearCyclesRates,
    updateTSP,
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
 */
function getRATES(year:string,quarter:string){
    // Complicated
    // TODO: MAKE IT DO ALL THE OTHER THINGS
    return new Promise((resolve,reject)=>{

        if(!year && !quarter){
            db.all("SELECT * FROM RATES",(err:any, rows:any)=>{
                if(err){
                    console.error(err);
                    reject(err);
                }
                resolve(rows);
            });
        }else if(year && !quarter){
            db.all("SELECT * FROM RATES WHERE YEAR=? AND QUARTER=?",[year,"Q1"],(err:any, rows:any)=>{
                if(err){
                    console.error(err);
                    reject(err);
                }
                resolve(rows);
            });
        }else{
            db.all("SELECT * FROM RATES WHERE YEAR=? AND QUARTER=?", [year,quarter],(err,rows)=>{
                if(err){console.error(err); reject(err)}
                resolve(rows);
            })
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

function getAllYearCyclesRates(){
    return new Promise((resolve,reject)=>{
        db.all('SELECT DISTINCT YEAR,QUARTER FROM RATES', (err,rows:any)=>{
            console.log(rows);
            if(err){reject(err);return;}
            return resolve(rows);
        })
    })
}