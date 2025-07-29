
import sqlite3 from 'sqlite3';
import { db } from '../db_init/db_init'
import chalk from 'chalk';
const localDiscountPercentage = .05;


export type mainReportQueryRes = {
  BOL?:string,
  APL_INVOICE_NUM?:string,
  LOCAL_INVOICE_NUM?:string,
  INVOICE_DATE?: number,
  GBL?: string,
  SCAC?: string,
  TSP_NAME?: string,
  MEMBER_NAME?: string,
  RECEIPT_PLACE?: string,
  LOAD_PORT?: string,
  DISCHARGE_PORT?: string,
  DELIVERY_PLACE?: string,
  CHARGES?: string,
  TSP_DISCOUNT?:number,

}

export type mainReportRes = {
  // Shipment Info
  BOL?:string,
  APL_INVOICE_NUM?:string,
  LOCAL_INVOICE_NUM?:string,
  INVOICE_DATE?: number,
  GBL?: string,
  SCAC?: string,
  TSP_NAME?: string,
  MEMBER_NAME?: string,
  RECEIPT_PLACE?: string,
  LOAD_PORT?: string,
  DISCHARGE_PORT?: string,
  DELIVERY_PLACE?: string,
  // Charges
  CHARGES?: string,
  OCF?: number,
  FAF?: number,
  THC_USA?: number,
  Guam_THC?: number,
  AMS?: number,
  RAIL?: number,
  ISIF?: number,
  TOTAL?: number,
  // TSP Details
  TSP_DISCOUNT?:number,
  TSP_DISCOUNT_AMOUNT?: number,
  LOCAL_DISCOUNT?: number,
  LOCAL_DISCOUNT_AMOUNT?: number,
  TOTAL_APL_DISCOUNT_AMOUNT?:number,
}

type chartDataset = {
    label?: string,
    data?: number[],
    borderWidth?: number,
    backgroundColor?: string,
    stack?: string,
}

type chartData = {
  type?: string,
  title?:string,
  labels?:Array<string>,
  datasets?:Array<chartDataset>,
}

// type chartData = {
//   labels?:Array<string>,
//   data?:Array<number>,
//   label?: string,
//   type?: string,
// }

type how = {
  labels?:Array<string>,
  datasets: [{
    label: "STUFF",
    data: [0],
    borderWidth: 1,
    backgroundColor: "red",
  }]
}


/**
 * Class to call DB for Reports
 */
export class reports {
  private db:sqlite3.Database;
  constructor(){
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
  getMainReport(startDate:number, endDate:number):Promise<mainReportRes[]>{
    
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
      LOCAL_INVOICES.INVOICE_DATE > ? AND LOCAL_INVOICES.INVOICE_DATE < ?;
    `;
    return new Promise((resolve,reject)=>{
      this.db.all(query,[startDate,endDate],(err:any,rows:Array<mainReportQueryRes>)=>{
        if(err) reject(err);
        else resolve(decompressCharges(rows));
      })
    })
  }

  //!! Last One because we need the CSV that APL produces for the company 
  getDiscountReport(){}

  /**
   * 
   * @param startDate 
   * @param endDate 
   * @returns 
   */
  getAccrualsReport(startDate:number, endDate:number, year:number):Promise<mainReportRes[]>{
    const query = `
    SELECT
      LOCAL_INVOICES.BOL,
      LOCAL_INVOICES.MEMBER_NAME,
      LOCAL_INVOICES.GBL,
      LOCAL_INVOICES.INVOICE_DATE,
      LOCAL_INVOICES.CHARGES,
      LOCAL_INVOICES.SCAC,
      TSP.YEAR,
      APL_INVOICES.LOAD_PORT,
      APL_INVOICES.DISCHARGE_PORT,
      CASE
        WHEN APL_INVOICES.DISCHARGE_PORT LIKE '%GUAM%' THEN 
          COALESCE(TSP.DISC_TO_GUA, 0)
        ELSE 
          COALESCE(TSP.DISC_FROM_GUA, 0)
      END AS TSP_DISCOUNT
    FROM
      LOCAL_INVOICES
    JOIN
      APL_INVOICES ON LOCAL_INVOICES.BOL = APL_INVOICES.BOL
    LEFT JOIN
      TSP ON LOCAL_INVOICES.SCAC = TSP.SCAC
    WHERE
      LOCAL_INVOICES.INVOICE_DATE > ? AND LOCAL_INVOICES.INVOICE_DATE < ?
      AND (TSP.YEAR = ? OR TSP.YEAR IS NULL);
    `;

    return new Promise((resolve, reject)=>{
      this.db.all(query,[startDate,endDate, year],(err,rows:mainReportQueryRes[])=>{
        if(err) reject(err);
        else{
          const rowsDecompressed = decompressCharges(rows);
          let endData:mainReportRes[] = [];
          for(let n of rowsDecompressed){
            let {FAF,THC_USA,Guam_THC,AMS,RAIL,ISIF,TOTAL,CHARGES,OCF,TSP_DISCOUNT, ...results}=n;
            let orderedFields:mainReportRes = {...results};
            orderedFields.OCF = OCF;
            orderedFields.TSP_DISCOUNT = TSP_DISCOUNT;
            orderedFields.TSP_DISCOUNT_AMOUNT = TSP_DISCOUNT! * OCF!;
            orderedFields.LOCAL_DISCOUNT = .37 - TSP_DISCOUNT!;
            orderedFields.LOCAL_DISCOUNT_AMOUNT = orderedFields.LOCAL_DISCOUNT! * OCF!;
            orderedFields.TOTAL_APL_DISCOUNT_AMOUNT = orderedFields.LOCAL_DISCOUNT_AMOUNT + orderedFields.TSP_DISCOUNT_AMOUNT;
            endData.push(orderedFields);
          }
          resolve(endData);
        }
      })
    })


  }
}

/**
 * Class to call chart data for Dashboard Online
 */
export class charts {
  constructor(){

  }

  /**
   * 
   * Get `chartData` data for monthly TSP and Local Discount from OCF values.
   * This is BAR data only.
   * 
   * @param firstOfMonth 
   * @param lastOfMonth 
   * @param year 
   * @returns ```js 
   * chartData : {data:[numbers], label:string, labels:[string],type:string}
   * ```
   */
  MonthlyDashboard(firstOfMonth?:number,lastOfMonth?:number, year?:number):Promise<chartData>{
    const today = new Date();
    const start = firstOfMonth || new Date(today.getFullYear(),today.getMonth(),1).getTime();
    const end = lastOfMonth || new Date(today.getFullYear(),today.getMonth()+1,0).getTime();
    const tspYear = year ||  today.getFullYear();
    const query =`
    SELECT 
      LOCAL_INVOICES.SCAC,
      LOCAL_INVOICES.CHARGES,
      LOCAL_INVOICES.MEMBER_NAME,
      -- Calculate TSP_DISCOUNT
      CASE
        WHEN APL_INVOICES.DISCHARGE_PORT LIKE '%GUAM%' THEN 
          COALESCE(TSP.DISC_TO_GUA, 0)
        ELSE 
          COALESCE(TSP.DISC_FROM_GUA, 0)
      END AS TSP_DISCOUNT,
      -- Use the calculated TSP_DISCOUNT to calculate LOCAL_DISCOUNT
      CASE
        WHEN APL_INVOICES.DISCHARGE_PORT LIKE '%GUAM%' THEN 
          0.37 - COALESCE(TSP.DISC_TO_GUA, 0)
        ELSE 
          0.37 - COALESCE(TSP.DISC_FROM_GUA, 0)
      END AS LOCAL_DISCOUNT
    FROM
      LOCAL_INVOICES
    JOIN
      APL_INVOICES ON LOCAL_INVOICES.BOL = APL_INVOICES.BOL
    LEFT JOIN
      TSP ON LOCAL_INVOICES.SCAC = TSP.SCAC
    WHERE
      LOCAL_INVOICES.INVOICE_DATE BETWEEN ? AND ?
      AND (TSP.YEAR = ? OR TSP.YEAR IS NULL)
    `
    return new Promise((resolve,reject)=>{
      db.all(query, [start,end,tspYear],(err,rows:mainReportQueryRes[])=>{
        console.table(rows)
        if(err){reject(err)
        }else{
          let process:mainReportRes[] = calculateDiscount(decompressCharges(rows));
          let chartData:chartData = {
            labels: [],
            datasets: 
            [
              {
                label: "Local Discount",
                data: [],
                borderWidth: 0,
                backgroundColor: '#ff9f40',
                stack:"LOCAL"
              },
              {
                label: "TSP Discount",
                data: [],
                borderWidth: 0,
                backgroundColor: '#36a2eb',
                stack: "TSP"
              },
              {
                label: "Basic Ocean Freight",
                data: [],
                borderWidth: 0,
                backgroundColor: '#ff6384',
                stack:"OCF"
              },
            ],
          }
          process.map((m)=>{
            if(!chartData.labels!.includes(m.SCAC!)){
              chartData.labels!.push(m.SCAC!);
            }
            const indexOfData:number = chartData.labels!.indexOf(m.SCAC!);
            if(chartData.datasets![0].data![indexOfData] == undefined){
              chartData.datasets![0].data![indexOfData] = m.LOCAL_DISCOUNT_AMOUNT!;
              chartData.datasets![1].data![indexOfData] = m.TSP_DISCOUNT_AMOUNT!;
              chartData.datasets![2].data![indexOfData] = m.OCF! - m.TOTAL_APL_DISCOUNT_AMOUNT!;
            }else{
              chartData.datasets![0].data![indexOfData] += m.LOCAL_DISCOUNT_AMOUNT!;
              chartData.datasets![1].data![indexOfData] += m.TSP_DISCOUNT_AMOUNT!;
              chartData.datasets![2].data![indexOfData] += m.OCF! - m.TOTAL_APL_DISCOUNT_AMOUNT!;
            };
          })
          chartData.title = "Monthly Revenue (TSP Discount/Company Discount)";
          chartData.type = 'bar';
          resolve(chartData)
        };
      })
    })
  }


  // !!! REPEATING CODE, USE A BETTER DESIGN PATTERN :(
  /**
   * 
   * Get `chartData` data for Monthly revenue. PIE CHART
   * 
   * Labels/Data:
   * - TSP Discount Total
   * - Local Company Discount Total
   * - APL Total OCF (Get 63% to compliment with the rest 37%)
   * 
   * @param firstOfMonth 
   * @param lastOfMonth 
   * @param year 
   * @returns ```js 
   * chartData : {data:[numbers], label:string, labels:[string],type:string}
   * ```
   */
  MonthlyDiscountPercentages(firstOfMonth?:number,lastOfMonth?:number, year?:number):Promise<chartData>{
    const today = new Date();
    const start = firstOfMonth || new Date(today.getFullYear(),today.getMonth(),1).getTime();
    const end = lastOfMonth || new Date(today.getFullYear(),today.getMonth()+1,0).getTime();
    const tspYear = year ||  today.getFullYear();
    const query =`
    SELECT 
      LOCAL_INVOICES.SCAC,
      LOCAL_INVOICES.CHARGES,
      LOCAL_INVOICES.MEMBER_NAME,
      -- Calculate TSP_DISCOUNT
      CASE
        WHEN APL_INVOICES.DISCHARGE_PORT LIKE '%GUAM%' THEN 
          COALESCE(TSP.DISC_TO_GUA, 0)
        ELSE 
          COALESCE(TSP.DISC_FROM_GUA, 0)
      END AS TSP_DISCOUNT,
      -- Use the calculated TSP_DISCOUNT to calculate LOCAL_DISCOUNT
      CASE
        WHEN APL_INVOICES.DISCHARGE_PORT LIKE '%GUAM%' THEN 
          0.37 - COALESCE(TSP.DISC_TO_GUA, 0)
        ELSE 
          0.37 - COALESCE(TSP.DISC_FROM_GUA, 0)
      END AS LOCAL_DISCOUNT
    FROM
      LOCAL_INVOICES
    JOIN
      APL_INVOICES ON LOCAL_INVOICES.BOL = APL_INVOICES.BOL
    LEFT JOIN
      TSP ON LOCAL_INVOICES.SCAC = TSP.SCAC
    WHERE
      LOCAL_INVOICES.INVOICE_DATE BETWEEN ? AND ?
      AND (TSP.YEAR = ? OR TSP.YEAR IS NULL)
    `
    return new Promise((resolve,reject)=>{
      db.all(query, [start,end,tspYear],(err,rows:mainReportQueryRes[])=>{
        // console.table(rows)
        if(err){reject(err)
        }else{
          let process:mainReportRes[] = calculateDiscount(decompressCharges(rows));
          console.log(process);
          let chartData:chartData = {
            labels: ["TSP DISCOUNT", "LOCAL DISCOUNT", "BASIC OCEAN FREIGHT"],
            datasets: [{
              data:[0,0,0]
            }],
          }
          process.map((m)=>{
            chartData.datasets![0].data![0] += m.TSP_DISCOUNT_AMOUNT!;
            chartData.datasets![0].data![1] += m.LOCAL_DISCOUNT_AMOUNT!;
            chartData.datasets![0].data![2] += m.OCF! - m.TOTAL_APL_DISCOUNT_AMOUNT!;
          })
          console.log(chartData.datasets);
          chartData.title = "Total Monthly Discount From OCF";
          chartData.type = 'pie';
          resolve(chartData)
        };
      })
    })
  }

}

/**
 * 
 * Parses JSON `Charges` Blob from Query and 
 * Calculates the charges and discounts
 * 
 * @param queryResponse 
 * @returns Charges with TSP/LOCAL Discounts
 */
function decompressCharges(queryResponse:Array<mainReportQueryRes>):mainReportRes[]{
  let rowsChargesDecompressed:mainReportRes[] = []
  // console.table(queryResponse);
  for(let n of queryResponse){
    let {CHARGES, ...newRow}:mainReportRes = n;
    const charges = JSON.parse(CHARGES!);
    newRow.OCF = charges.NET_RATES.OCF;
    newRow.FAF = charges.NET_RATES.FAF;
    newRow.THC_USA = charges.NET_RATES.THC_USA || charges.NET_RATES["THC USA"];
    newRow.Guam_THC = charges.NET_RATES.Guam_THC || charges.NET_RATES["Guam THC"];
    newRow.AMS = charges.NET_RATES.AMS;
    newRow.RAIL = charges.NET_RATES.RAIL!=undefined?charges.NET_RATES.RAIL:charges.NET_RATES["Inland (Rail)"];
    newRow.ISIF = charges.NET_RATES.ISIF!=undefined?charges.NET_RATES.ISIF:charges.NET_RATES["Invasive Species Inspection Fee"];
    newRow.TOTAL = charges.NET_RATES.TOTAL;
    rowsChargesDecompressed.push(newRow);
  }

  return rowsChargesDecompressed;
}

function calculateDiscount(rowsDecompressed:Array<mainReportRes>):mainReportRes[]{
  let endData:mainReportRes[] = [];
  for(let n of rowsDecompressed){
    let {FAF,THC_USA,Guam_THC,AMS,RAIL,ISIF,TOTAL,CHARGES,OCF,TSP_DISCOUNT, ...results}=n;
    let orderedFields:mainReportRes = {...results};
    orderedFields.OCF = OCF;
    orderedFields.TSP_DISCOUNT = TSP_DISCOUNT;
    orderedFields.TSP_DISCOUNT_AMOUNT = TSP_DISCOUNT! * OCF!;
    orderedFields.LOCAL_DISCOUNT = .37 - TSP_DISCOUNT!;
    orderedFields.LOCAL_DISCOUNT_AMOUNT = orderedFields.LOCAL_DISCOUNT! * OCF!;
    orderedFields.TOTAL_APL_DISCOUNT_AMOUNT = orderedFields.LOCAL_DISCOUNT_AMOUNT + orderedFields.TSP_DISCOUNT_AMOUNT;
    endData.push(orderedFields);
  }
  return endData;
}