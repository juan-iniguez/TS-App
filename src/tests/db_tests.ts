import chalk from 'chalk';
import { db } from '../db_init/db_init'

export class tests {
  mainDB = {
    duplicates: this.duplicates,
  }

  private duplicates(column:string, table:string):Promise<any>{
    const testDuplicatesQuery = `
    SELECT ${column}, COUNT(*) as count
    FROM ${table}
    GROUP BY ${column}
    HAVING COUNT(*) > 1 AND ${column} NOT NULL
    `;
    // console.log(chalk.cyanBright(`Testing ${table} for ${column} Duplicates 🎯`))
    return new Promise((resolve,reject)=>{
      db.all(testDuplicatesQuery, analyzeDuplicates)
      function analyzeDuplicates(err:any,rows:[]){
        if(err){
          console.error(err);
          reject(err);
          return
        }
        
        if(rows.length > 0){
          let duplicates:any[] = [];
          for(let n of rows){
            console.log(n);
            duplicates.push(n);
          }
          console.log(chalk.greenBright(`Test ${table} for ${column} Duplicates: FAILED ❌`))
          reject(duplicates);
        }else{
          resolve('');
          console.log(chalk.greenBright(`Test ${table} for ${column} Duplicates: PASSED ✅`))
        }
      }
    }) 
  }



}