
import sqlite3 from 'sqlite3';
import { db } from '../db_init/db_init'

/**
 * Class to call DB for Reports
 */
export class reports {
  private db:sqlite3.Database;
  constructor(db:sqlite3.Database, startDate:number, endDate:number){
    this.db = db;
  }

  /**
   * 
   * Get all fields to create the "MAIN REPORT" for the Excel file
   * 
   * @param startDate 
   * @param endDate 
   * @returns All fields needed for MAIN REPORT - object[]
   */
  getMainReport(startDate:number, endDate:number):Promise<object[]>{
    const query = `
    SELECT
      LOCAL_INVOICES.BOL,
      APL_INVOICES.INVOICE_NUM AS APL_INVOICE_NUM,
      LOCAL_INVOICES.INVOICE_NUM AS LOCAL_INVOICE_NUM,
      LOCAL_INVOICES.INVOICE_DATE,
      LOCAL_INVOICES.GBL,
      LOCAL_INVOICES.SCAC,
      LOCAL_INVOICES.TSP_NAME,
      LOCAL_INVOICES.MEMBER_NAME,
      APL_INVOICES.RECEIPT_PLACE,
      APL_INVOICES.LOAD_PORT,
      APL_INVOICES.DISCHARGE_PORT,
      APL_INVOICES.DELIVERY_PLACE,
      LOCAL_INVOICES.CHARGES
    FROM
      LOCAL_INVOICES
    JOIN
      APL_INVOICES ON LOCAL_INVOICES.BOL = APL_INVOICES.BOL
    WHERE
      LOCAL_INVOICE.INVOICE_DATE > ? AND LOCAL_INVOICE.INVOICE_DATE < ?;
    `;
    return new Promise((resolve,reject)=>{
      this.db.all(query,[startDate,endDate],(err:any,rows:object[])=>{
        if(err) reject(err);
        else resolve(rows)
      })
    })
  }

  getDiscountReport(){}

  getAccrualsReport(){}
}