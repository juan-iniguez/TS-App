// src/index.js
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import bodyParser, { json } from 'body-parser';
import fs from "fs";
import formidable from 'formidable';
import sqlite3 from 'sqlite3';
// import { parse } from "csv-parse";
import multer from 'multer';
// !XLSX IS VULNERABLE!
import xlsx from 'xlsx';
import { PDFDocument } from 'pdf-lib'

import {createShipment, checkShipment, getInvoiceCount, insertDeWittInvoice} from './db_calls/shipments';
// import { JSONParser } from "formidable/parsers";

const spawn = require("child_process").spawn;

// Open DB Connection
let db = new sqlite3.Database('db/apl.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to APL SQlite database.');
});

// DotENV setup for environment variables
dotenv.config();

// Multer configuration - for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Set Express App
const app: Express = express();
const port = process.env.PORT || 3000;

// app extensions and settings
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(bodyParser.json()) // Parses json, multi-part (file), url-encoded

// START API FOR APL INVOICE INTAKE

// Home page
app.get("/", (req: Request, res: Response) => {
    res.render('pages/index');
});

// APL Invoice and Waybill upload page
app.get("/upload", (req:Request,res:Response)=>{
  res.render("pages/upload");
})

// Settings
app.get("/settings", (req:Request,res:Response)=>{
  res.render("pages/settings");
})

// Page for searching db tables
app.get("/search", (req:Request,res:Response)=>{
  res.render("pages/search");
})

// SHIPMENTS
// Main page for showing the shipment information
app.get("/api/shipments/:bol/:member_name",(req,res)=>{
  
  let data_payload:any = {}
  let settings = JSON.parse(fs.readFileSync('public/files/settings.json', "utf8"));

  checkShipment(db,req.params.member_name).then((data:any)=>{
    if(data.exists){
      let data_payload = data.data[0];
      data_payload.CHARGES = JSON.parse(data_payload.CHARGES);
      data_payload.RATES = data_payload.CHARGES.RATES;
      data_payload.NET_RATES = data_payload.CHARGES.NET_RATES;
      delete data_payload.CHARGES;      

      // SHOW INVOICE THAT IS ALREADY PRESENT
      res.render("pages/shipment", {data:data_payload});

    }else{
      createShipment(db,data_payload,req.params.member_name, req.params.bol,res).then(data=>{
        data_payload = data;
        data_payload.INVOICE_DATE = "N/A";
        data_payload.PAYMENT_TERMS = settings.PAYMENT_TERMS[0];
        data_payload.TSA_NUM = settings.TSA_NUM;
        data_payload.TARIFF = settings.TARIFF;
        res.render("pages/shipment", {data:data_payload});
      })
    }
  })
})

// Main file upload POST route
app.post('/api/apl-inv-way', (req,res, next)=>{
  const form = formidable({uploadDir: "public/files"});
  // console.log(form);
  let file_addr:any[] = [];
  
  // Parsing IS ASYNCHRONOUS, PLEASE PUT ALL CODE INSIDE PROMISE
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.log("Error parsing the files");
      return res.status(400).json({
        status: "Fail",
        message: "There was an error parsing the files",
        error: err,
      });
    }
    const incoming_pdf = files.files!;
    
    // Get both files from the formData and save them to the Folder
    for(let i in incoming_pdf){
      fs.writeFileSync(path.join("public/pdf/" + incoming_pdf[i].originalFilename!), fs.readFileSync(incoming_pdf[i].filepath));
      fs.rmSync(incoming_pdf[i].filepath)
      file_addr.push("public/pdf/" + incoming_pdf[i].originalFilename!);
      // console.table(file_addr)
    }
    
    // Now action the script with arguments
    let pythonERROR = {
      status: false,
      msg: String,
    };    
    let pythonProcess = spawn('python3.12',["scripts/readPDF.py", file_addr[0], file_addr[1]]);
    let json_data
    pythonProcess.stdout.on('data', function(data:Buffer) {
      // console.log(data.toString());
    });
    pythonProcess.stderr.on('data', (err:any)=>{
      // console.log(err.toString());
      if(err){pythonERROR.status = true; pythonERROR.msg = err.toString()};
    })
    pythonProcess.stdout.on('end', (end:any)=>{

      let result = JSON.parse(fs.readFileSync("public/files/data.json", 'utf8'));

      if(!result.invoice || !result.waybill){
        res.send({
          reason: "One of your files could not be processed!",
          status: 500,
        });
        return;
      }

      // CHECK IF ENTRY IS ALREADY UPLOADED

      if(pythonERROR.status){
        res.send({
          reason: pythonERROR.msg,
          status: 500,
        });
      }else{
        // console.log(result)
        db.all("SELECT APL_INVOICES.BOL FROM APL_INVOICES INNER JOIN APL_WAYBILLS ON APL_INVOICES.BOL = APL_WAYBILLS.BOL WHERE APL_INVOICES.BOL=?", result.invoice.BOL,(err,rows)=>{
          if(err){
            console.log(err);
            res.send({
              reason: err.toString(),
              status: 500,
            });
          }else{
            if(rows[0]){
              res.send({
                reason: "Shipment Invoice or Waybill already exists.",
                status: 200,
              });
            }else{
              // console.log(rows);
              res.send({status: "OK",all: JSON.parse(fs.readFileSync("public/files/data.json", 'utf8'))})  
            }
          }
        });
      }

    })
  });

})

/***** START A CRUD IMPLEMENTATION AND CONNECT TO DB *****/

// Upload Invoice and Waybill
app.post('/api/db-invoice-waybill', (req,res)=>{

  let data = req.body;
  let invoice = req.body.invoice;
  let waybill = req.body.waybill;

  /**
   * DB IMPLEMENTATION EXAMPLE
   */

  // db.serialize(() => {
  //   db.each(`SELECT PlaylistId as id,
  //                   Name as name
  //            FROM playlists`, (err:any, row:any) => {
  //     if (err) {
  //       console.error(err.message);
  //     }
  //     console.log(row.id + "\t" + row.name);
  //   });
  // });
  
  let invoice_db_ready:any = {}
  let waybill_db_ready:any = {}
  let date_now = Date.now();

  // Create an Entry for APL_INVOICE

  for(let x in invoice){
    if("CHARGES" == x){
      invoice_db_ready["$" + x] = JSON.stringify(invoice[x])
    }else{
      invoice_db_ready["$" + x] = invoice[x];
    }
  }
  invoice_db_ready["$DATE_CREATED"] = date_now;
  
  // Create an Entry for the Waybill

  for(let x in waybill){
    if("SHIPMENTS" == x){
      waybill_db_ready["$" + x] = JSON.stringify(waybill[x])
    }else{
      if(x.includes("VESSEL") || x.includes("VOYAGE") || x.includes("CONT_SIZE") || x.includes("CONT_NUM")){
      
      }else{
        waybill_db_ready["$" + x] = waybill[x];
      }
    }
  }
  waybill_db_ready["$DATE_CREATED"] = date_now;


  db.run("INSERT INTO APL_INVOICES (BOL, INVOICE_NUM, CUSTOMER_NUM, VESSEL, VOYAGE, DISCHARGE_PORT, LOAD_PORT, RECEIPT_PLACE, DELIVERY_PLACE, CONT_SIZE, CONT_NUM, INVOICE_DATE, DATE_CREATED,TOTAL, CHARGES) VALUES ($BOL, $INVOICE_NUM, $CUSTOMER_NUM, $VESSEL, $VOYAGE, $DISCHARGE_PORT, $LOAD_PORT, $RECEIPT_PLACE, $DELIVERY_PLACE, $CONT_SIZE, $CONT_NUM, $INVOICE_DATE, $DATE_CREATED,$TOTAL, $CHARGES)", invoice_db_ready,(response:any, err:any)=>{
    if(err){
      console.log(`APL_INVOICE: ${err}`)
    }else{
      // console.log(`${Date.now()} -- APL_INVOICE Entry Created! -- BOL: ${invoice.BOL} `);
    }
  });

  db.run("INSERT INTO APL_WAYBILLS (BOL,CODE,SERIAL_NUM,WEIGHT_LBS,CUBIC_FEET,ETD,ETA,SHIPMENTS,DATE_CREATED) VALUES ($BOL, $CODE, $SERIAL_NUM,$WEIGHT_LBS, $CUBIC_FEET, $ETD, $ETA, $SHIPMENTS, $DATE_CREATED)", waybill_db_ready,(response_:any, err_:any)=>{
    if(err_){
      console.log("APL WAYBILL ERROR: " + err_);
    }else{
      // console.log(`${Date.now()} -- APL_WAYBILLS Entry Created! -- BOL: ${waybill.BOL} `);
    }
  });

  // Get SHIPMENTS INTO THE DB

  let shipments = waybill.SHIPMENTS;

  for(let i in shipments){
    // console.log(i);
    
    let shipment_payload = {
      $BOL: invoice.BOL,
      $RDD: shipments[i].RDD,
      $NET: shipments[i].NET,
      $WEIGHT_LBS: shipments[i].WEIGHT_LBS,
      $SCAC: shipments[i].SCAC,
      $MEMBER_NAME: shipments[i].SM,
      $GBL: shipments[i].GBL,
      $TTL_CF: shipments[i].TTL_CF,
      $PIECES: shipments[i].PIECES,
      $DATE_CREATED: date_now,
    }

    db.run("INSERT INTO SHIPMENTS (BOL, RDD, NET, WEIGHT_LBS, SCAC, MEMBER_NAME, GBL, TTL_CF, PIECES, DATE_CREATED) VALUES ($BOL, $RDD, $NET, $WEIGHT_LBS, $SCAC, $MEMBER_NAME, $GBL, $TTL_CF, $PIECES, $DATE_CREATED)", shipment_payload, (res:any,err:any)=>{
      if(err){
        console.log(err);
      }else{
        // console.log(`${Date.now()} -- SHIPMENTS Entry Created! -- MEMBER_NAME:${shipments[i].SM}`);
      }
    })
  }

  // console.log(shipments);



  // db.close((err) => {
  //   if (err) {
  //     console.error(err.message);
  //   }
  //   console.log('Close the database connection.');
  // });


  res.send("OK");

})

// Upload TSP Information
app.post('/api/db-tsp', upload.single('file'),(req,res)=>{

  try {
    const workbook = xlsx.read(req.file!.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // ARRAY OF TSPS
    /* SCAC | DISC_FROM_GUA | DISC_TO_GUA | TSP_NAME | ADDRESS_1 | ADDRESS_2 */
    const jsonData = xlsx.utils.sheet_to_json(sheet);
    
    for(let i in jsonData){
      let db_payload:any = {} ;
      for(let j in jsonData[i]!){
        let value:any = jsonData[i];
        db_payload[`$${j}`] = value[j];
      }
      db_payload["$DATE_CREATED"] = Date.now();
      // console.log(db_payload);
      db.run("INSERT INTO TSP (SCAC, TSP_NAME, DISC_FROM_GUA, DISC_TO_GUA, ADDRESS_1, ADDRESS_2, DATE_CREATED, BILLING_EMAIL) VALUES ($SCAC, $TSP_NAME, $DISC_FROM_GUA, $DISC_TO_GUA, $ADDRESS_1, $ADDRESS_2, $DATE_CREATED, $BILLING_EMAIL)", db_payload,(result:any, err:any)=>{
        if(err){
          console.error(err);
        }else{
          // console.log(result);
        }
      });
    }

    res.json(jsonData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the uploaded file' });
  }
  
  // console.log(req);

})

// Upload APL Rates
app.post('/api/db-rates', upload.single('file'),(req,res)=>{
  let date_now = Date.now();
  try {
    const workbook = xlsx.read(req.file!.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const jsonData = xlsx.utils.sheet_to_json(sheet);
    // console.log(jsonData);

    for(let i in jsonData){
      let db_payload:any = [];
      let data:any = jsonData[i];

      // OCF Rate
      db_payload.push({
        $RATE: "OCF", 
        $ORIGIN: data.Origin,
        $DESTINATION: data.Destination, 
        $CONT_SIZE: data.Container, 
        $AMOUNT: data.OCF,
        $DATE_CREATED: date_now,
      })

      // THC USA
      db_payload.push({
        $RATE: "THC USA", 
        $ORIGIN: data.Origin,
        $DESTINATION: data.Destination, 
        $CONT_SIZE: data.Container, 
        $AMOUNT: data["THC USA"],
        $DATE_CREATED: date_now,
      })

      // Guam THC
      db_payload.push({
        $RATE: "Guam THC", 
        $ORIGIN: data.Origin,
        $DESTINATION: data.Destination, 
        $CONT_SIZE: data.Container, 
        $AMOUNT: data["Guam THC"],
        $DATE_CREATED: date_now,
      })

      // FAF
      db_payload.push({
        $RATE: "FAF", 
        $ORIGIN: data.Origin,
        $DESTINATION: data.Destination, 
        $CONT_SIZE: data.Container, 
        $AMOUNT: data.FAF,
        $DATE_CREATED: date_now,
      })

      // AMS
      db_payload.push({
        $RATE: "AMS", 
        $ORIGIN: data.Origin,
        $DESTINATION: data.Destination, 
        $CONT_SIZE: data.Container, 
        $AMOUNT: data.AMS,
        $DATE_CREATED: date_now,
      })

      // Inland (Rail)
      db_payload.push({
        $RATE: "Inland (Rail)", 
        $ORIGIN: data.Origin,
        $DESTINATION: data.Destination, 
        $CONT_SIZE: data.Container, 
        $AMOUNT: data["Inland (Rail)"],
        $DATE_CREATED: date_now,
      })

      // Invasive Species Inspection Fee
      db_payload.push({
        $RATE: "Invasive Species Inspection Fee", 
        $ORIGIN: data.Origin,
        $DESTINATION: data.Destination, 
        $CONT_SIZE: data.Container, 
        $AMOUNT: data["Invasive Species Inspection Fee"],
        $DATE_CREATED: date_now,
      })

      for(let j in db_payload){
        db.run("INSERT INTO RATES (RATE, ORIGIN, DESTINATION, CONT_SIZE, AMOUNT, DATE_CREATED) VALUES ($RATE, $ORIGIN, $DESTINATION, $CONT_SIZE, $AMOUNT, $DATE_CREATED)",db_payload[j],(response:any, err:any)=>{
          if(err){
            console.log(err)
          }else{
            // console.log(response)
          };
        })
      }
    }

    res.json(jsonData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the uploaded file' });
  }
})

// Create DeWitt Ocean Invoice #####################################
app.post('/api/create-dew-inv', async (req:Request,res:Response)=>{
  
  checkShipment(db, req.body.member_name).then((data:any)=>{
    if(data.exists){

    }else{

    }
  })

  // PDF Modification
  const pdfDoc = await PDFDocument.load(fs.readFileSync('resources/TSP Invoice.pdf'));
  const form = pdfDoc.getForm()
  const fields = form.getFields() 

  // 1-17 Fields ORDER MATTERS
  let fields_names = [
    "TSP_NAME",
    "SCAC",
    "ADDRESS_1",
    "ADDRESS_2",
    "VESSEL",
    "VOYAGE",
    "BOL",
    "CONT_NUM",
    "INVOICE_DATE",
    "CONT_SIZE",
    "RECEIPT_PLACE",
    "LOAD_PORT",
    "DISCHARGE_PORT",
    "MEMBER_NAME",
    "GBL",
    "PIECES",
    "TTL_CF",
    "INVOICE_NUM",
    "TSA_NUM",
    "PAYMENT_TERMS",
    "TARIFF",
  ]

  // 18-38 Charges ORDER MATTERS
  // BASED_ON_UNIT | RATE | LINE TOTAL
  /* DESC
  Basic Ocean Freight Charge,
  Origin Terminal Handling Charge,
  Destination Terminal Handing Charge,
  Bunker Surchage NOS,
  Advance Manifest Compliance Charge (AMS),
  Inland (Rail) Charge,
  Container Inspection Fee & Survey Fee
  */ 

  // 39 total
  // GET ALL INFORMATION FOR SHIPMENT:

  let data_payload:any
  let settings = JSON.parse(fs.readFileSync('public/files/settings.json', "utf8"));
  let db_payload:any;

  // Create Entry DB for DEWITT_INVOICES
  createShipment(db,data_payload,req.body.MEMBER_NAME, req.body.BOL ,res).then(async (data)=>{
    getInvoiceCount(db).then(async (val:any )=>{
      data_payload = data;
      data_payload.INVOICE_DATE = new Date();
      data_payload.PAYMENT_TERMS = settings.PAYMENT_TERMS[0];
      data_payload.TSA_NUM = settings.TSA_NUM;
      data_payload.TARIFF = settings.TARIFF;
      data_payload.INVOICE_NUM = val;
      data_payload.VOID = null;
  
      db_payload = {...data_payload};
      delete db_payload["DELIVERY_PLACE"];
      delete db_payload["CUBIC_FEET"];
      delete db_payload["RATES"]
      delete db_payload["NET_RATES"]
      db_payload.CHARGES = {RATES: data_payload.RATES,NET_RATES: data_payload.NET_RATES}
      db_payload.TOTAL = data_payload.NET_RATES.TOTAL;
      // console.log("DATA")
      // console.log(data_payload);
      // console.log("DB")
      // console.log(db_payload);
  
  
      // let example = {
      //   BOL: 'USG0260825',
      //   VESSEL: 'PRESIDENT KENNEDY',
      //   VOYAGE: '0DBHOW1PL',
      //   DISCHARGE_PORT: 'PITI, GUAM',
      //   LOAD_PORT: 'LOS ANGELES, CA',
      //   RECEIPT_PLACE: 'BALTIMORE, MD',
      //   CONT_SIZE: '40HC',
      //   CONT_NUM: 'CMAU7055123',
      //   SCAC: 'SSAV',
      //   MEMBER_NAME: 'PARKER, CRSYTAL',
      //   GBL: 'HHE677321',
      //   TTL_CF: 671,
      //   PIECES: '4/4',
      //   TOTAL:
      //   CHARGES:
      //   TSP_NAME: 'N/A', 
      //   ADDRESS_1: 'N/A', 
      //   ADDRESS_2: 'N/A', 
      //   BASED_ON: 0.35, 
      //   DELIVERY_PLACE: '-', ********************************
      //   CUBIC_FEET: 1926, ********************************
      //   RATES: {
      //     TOTAL: 9772,
      //     OCF: 3768,
      //     'THC USA': 755,
      //     AMS: 0,
      //     'Inland (Rail)': 3020,
      //     'Invasive Species Inspection Fee': 52,
      //     'Guam THC': 915,
      //     FAF: 1262
      //   },
      //   NET_RATES: {
      //     TOTAL: 3420.2,
      //     OCF: 1318.8,
      //     'THC USA': 264.25,
      //     AMS: 0,
      //     'Inland (Rail)': 1057,
      //     'Invasive Species Inspection Fee': 18.2,
      //     'Guam THC': 320.25,
      //     FAF: 441.7
      //   }
      // }
  
      let dewInv_db_ready:any = {}
  
      for(let x in db_payload){
        if("CHARGES" == x){
          dewInv_db_ready["$" + x] = JSON.stringify(db_payload[x])
        }else{
          dewInv_db_ready["$" + x] = db_payload[x];
        }
      }
  
      insertDeWittInvoice(db,dewInv_db_ready).then((res)=>{
        console.log(res);
      }).catch((reason)=>{
        // r
      })
  
      function addLeadingZeros(amount:any){
        let x = "";
        for(let i=0;i<6-amount;i++){
          x += "0";
        }
        return x;
      }

      for(let i in fields_names){
        // Set the text value
        let textField = form.getTextField(fields_names[i]);
        if(typeof(data_payload[fields_names[i]]) == typeof(0) && fields_names[i] != "INVOICE_NUM"){
          textField.setText(data_payload[fields_names[i]].toString());
        }else if(fields_names[i] == "INVOICE_NUM"){
          textField.setText("NVC-" + addLeadingZeros(data_payload[fields_names[i]].toString().split('').length) + data_payload[fields_names[i]] );
        }else if(fields_names[i] == "INVOICE_DATE"){
          textField.setText(new Date(data_payload[fields_names[i]]).toJSON().slice(0, 10));
        }else{
          textField.setText(data_payload[fields_names[i]]);
        }
      }
      
      // CHARGES
      // Charges BASED ON
      form.getTextField("BASED_ON").setText(data_payload.BASED_ON.toString());
  
      // RATE
      for(let i in data_payload.RATES){
        if(i == "TOTAL"){continue}
        // console.log("RATES-" + i)
        form.getTextField("RATES-" + i).setText(data_payload.RATES[i].toLocaleString('en-US', {style: 'currency', currency: 'USD'}));
      }
      
      // NET_RATES
      for(let i in data_payload.NET_RATES){
        if(i == "TOTAL"){continue}
        form.getTextField("NET_RATES-" + i).setText(data_payload.NET_RATES[i].toLocaleString('en-US', {style: 'currency', currency: 'USD'}));
      }
      
      form.getTextField("TOTAL").setText(data_payload.NET_RATES.TOTAL.toLocaleString('en-US', {style: 'currency', currency: 'USD'}));  
  
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync('resources/TSP Invoice.pdf',pdfBytes);
      res.sendStatus(200);
    })
  })
})

// Download pdf
app.get("/api/get-dew-inv-pdf", (req,res)=>{
  // console.log("SENT!")
  res.sendFile(__dirname.split("/src")[0] + '/resources/TSP Invoice.pdf');
})

// Request Shipments
app.post('/api/search', async (req,res,next)=>{
  // console.log(req.body.data);
  let data = req.body.data;
  let search = req.body.search;
  let arg = req.body.arg;

  
  switch (data) {
    case "shipments":
      if(search == "" && arg == ""){
        db.all("Select BOL, MEMBER_NAME,SCAC,GBL,TTL_CF,PIECES, DATE_CREATED from SHIPMENTS ORDER BY DATE_CREATED DESC LIMIT 50",(err, rows)=>{
          res.send(rows);
        });
      }else{
        search = '%'+search+'%';
        db.all(`Select BOL, MEMBER_NAME,SCAC,GBL,TTL_CF,PIECES, DATE_CREATED from SHIPMENTS WHERE ${arg} LIKE ? ORDER BY DATE_CREATED DESC LIMIT 50`,[search],(err, rows)=>{
          res.send(rows);
        });        
      }
      break;
    case "invoices":
      if(search == "" && arg == ""){
        db.all("Select INVOICE_NUM, MEMBER_NAME, BOL, INVOICE_DATE, TOTAL, VOID  from DEWITT_INVOICES ORDER BY INVOICE_DATE DESC LIMIT 50",(err, rows)=>{
          // console.log(rows);
          res.send(rows);
        });
      }else{
        search = '%'+search+'%';
        db.all(`Select INVOICE_NUM, MEMBER_NAME, BOL, INVOICE_DATE, TOTAL, VOID  from DEWITT_INVOICES WHERE ${arg} LIKE ? ORDER BY INVOICE_DATE DESC LIMIT 50`,[search],(err, rows)=>{
          // console.log(rows);
          res.send(rows);
        });
      }
      break
    case "tsp":
      if(search == "" && arg == ""){
        db.all("Select SCAC,TSP_NAME,DISC_FROM_GUA, DISC_TO_GUA  from TSP ORDER BY DATE_CREATED DESC LIMIT 50",(err, rows)=>{
          // console.log(rows);
          res.send(rows);
        });
      }else{
        search = '%'+search+'%';
        db.all(`Select SCAC,TSP_NAME,DISC_FROM_GUA, DISC_TO_GUA  from TSP WHERE ${arg} LIKE ? ORDER BY DATE_CREATED DESC LIMIT 50`,[search],(err, rows)=>{
          // console.log(rows);
          res.send(rows);
        });
      }
      break
    case "rates":
      if(search == "" && arg == ""){
        db.all("Select RATE,ORIGIN,DESTINATION,CONT_SIZE,AMOUNT,DATE_CREATED  from RATES ORDER BY DATE_CREATED DESC LIMIT 50",(err, rows)=>{
          // console.log(rows);
          res.send(rows);
        });
      }else{
        search = '%'+search+'%';
        db.all(`Select RATE,ORIGIN,DESTINATION,CONT_SIZE,AMOUNT,DATE_CREATED  from RATES WHERE ${arg} LIKE ? ORDER BY DATE_CREATED DESC LIMIT 50`,[search],(err, rows)=>{
          // console.log(rows);
          res.send(rows);
        });
      }
      break
    default:
      res.sendStatus(500);
      break;
  }
})

var reload = require("reload")

// app.listen(port, () => {
//   console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
// });

// Reload code here
reload(app).then(function () {
  // reloadReturned is documented in the returns API in the README

  // Reload started, start web server
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
  });
}).catch(function (err:any) {
  console.error('Reload could not start, could not start server/sample app', err)
})