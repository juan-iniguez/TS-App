import fs from "fs";
import formidable from 'formidable';
const spawn = require("child_process").spawn;
import path from "path";
import multer from 'multer';
// !XLSX IS VULNERABLE!
import xlsx from 'xlsx';
// Local calls for tasks
import { aplDB } from '../../db_calls/shipments';
import { writePDF } from "../../pdf_calls/pdf";
import { apl } from '../../db_calls/apl';
import { localSettings } from '../../db_calls/settings';
import { searchDB } from '../../db_calls/search'
import { appUtils } from "../../utils";
import { verifyToken } from '../../auth/verifyToken';
import csvtojson from 'csvtojson'

// Multer configuration - for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

import express from "express";
const router = express.Router();

router.use(verifyToken)

// Main file upload POST route
router.post('/apl-inv-way',(req:any, res, next) => {

    if(!req.user){res.sendStatus(401).json({message: "Unauthorized"});next()}

    const form = formidable({ uploadDir: "public/files" });
    let file_addr: any[] = [];

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
        for (let i in incoming_pdf) {
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
        let pythonProcess = spawn('python3.11', ["scripts/readPDF.py", file_addr[0], file_addr[1], "-d"]);
        pythonProcess.stdout.on('data', function (data: Buffer) {
            // Get Debug Information from here
            fs.appendFileSync(path.join(__dirname + "../../../../logs/python/debug.txt"), `-------------------- ${ new Date().toLocaleDateString("en-US") } - ${incoming_pdf[0].originalFilename}: -------------------- \n\n` + data.toString() + "-------------------- END! -------------------- \n\n\n");
            console.log(data.toString());
        });
        pythonProcess.stderr.on('data', (err: any) => {
            console.error("ERROR: " + err.toString())
            console.warn("Python had an error, please check the script!!!");
            fs.appendFileSync(path.join(__dirname + "../../../../logs/python/logs.txt"), err.toString());
            if (err) { pythonERROR.status = true; pythonERROR.msg = err.toString() };
        })
        pythonProcess.stdout.on('end', (end: any) => {
            let result = JSON.parse(fs.readFileSync("public/files/data.json", 'utf8'));
            // console.log(result)
            if (!result.invoice || !result.waybill) {
                res.send({
                    reason: "One of your files could not be processed!",
                    status: 500,
                });
                console.error("No Invoice or Waybill found in files!!!");
                console.warn("This could be because the user didn't submit the appropriate Invoice or Waybill files");
                return;
            }

            // CHECK IF ENTRY IS ALREADY UPLOADED
            if (pythonERROR.status) {
                res.send({
                    reason: "There was an issue parsing the files, please contact your administrator. (Python Parsing Error)",
                    status: 500,
                });
            } else {
                // console.log(result.invoice.BOL)
                apl.checkInv(result.invoice.BOL)
                    .then((resolve) => {
                        if (resolve[0] == undefined) {
                            res.send({ status: "OK", all: result })
                        } else {
                            res.send({
                                reason: "Shipment Invoice or Waybill already exists.",
                                status: 200,
                            });
                            console.error("Shipment Invoice or Waybill already exists.")
                            console.warn('User tried uploading: ' + result.invoice.BOL + " --- Already Exists in the Database")
                        }
                    }).catch((reason) => {
                        res.send({
                            reason: reason.toString(),
                            status: 500,
                        });
                        console.error("Undefined Error: " + reason.toString());
                        console.warn("Revise Python file, this could be a parsing issue")
                    })
            }

        })
    });

})

/***** START A CRUD IMPLEMENTATION AND CONNECT TO DB *****/
// Upload Invoice and Waybill to DB
router.post('/db-invoice-waybill',(req:any, res,next) => {
    if(!req.user){res.sendStatus(401).json({message: "Unauthorized"});next()}

    let invoice = req.body.invoice;
    let waybill = req.body.waybill;
    let invoice_db_ready: any = {}
    let waybill_db_ready: any = {}
    let date_now = Date.now();

    // Create an Entry for APL_INVOICE
    for (let x in invoice) {
        if ("CHARGES" == x) {
            invoice_db_ready["$" + x] = JSON.stringify(invoice[x])
        } else {
            invoice_db_ready["$" + x] = invoice[x];
        }
    }
    invoice_db_ready["$DATE_CREATED"] = date_now;

    // Create an Entry for the Waybill
    for (let x in waybill) {
        if ("SHIPMENTS" == x) {
            waybill_db_ready["$" + x] = JSON.stringify(waybill[x])
        } else {
            if (x.includes("VESSEL") || x.includes("VOYAGE") || x.includes("CONT_SIZE") || x.includes("CONT_NUM")) {

            } else {
                waybill_db_ready["$" + x] = waybill[x];
            }
        }
    }
    waybill_db_ready["$DATE_CREATED"] = date_now;

    apl.entryInv(invoice_db_ready);
    apl.entryWay(waybill_db_ready);

    // Get SHIPMENTS INTO THE DB
    let shipments = waybill.SHIPMENTS;

    for (let i in shipments) {

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

        apl.entryShipment(shipment_payload);
    }
    res.send("OK");

})

// Upload TSP Information to DB
// router.post('/db-tsp', upload.single('file'), (req, res) => {

//     try {
//         const workbook = xlsx.read(req.file!.buffer, { type: 'buffer' });
//         const sheetName = workbook.SheetNames[0];
//         const sheet = workbook.Sheets[sheetName];

//         // ARRAY OF TSPS
//         /* SCAC | DISC_FROM_GUA | DISC_TO_GUA | TSP_NAME | ADDRESS_1 | ADDRESS_2 */
//         const jsonData = xlsx.utils.sheet_to_json(sheet);

//         for (let i in jsonData) {
//             let db_payload: any = {};
//             for (let j in jsonData[i]!) {
//                 let value: any = jsonData[i];
//                 db_payload[`$${j}`] = value[j];
//             }
//             db_payload["$DATE_CREATED"] = Date.now();
//             localSettings.insertTSP(db_payload);
//         }

//         res.json(jsonData);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to process the uploaded file' });
//     }

//     // console.log(req);

// })

// Upload TSP Information to DB
router.post('/upload-tsp',upload.any(), async (req:any, res) => {

    // console.log(req.files[0]);
    console.log(req.query.year);
    console.log(req.query.action);
    // res.send(200);
    // return;
    try {
        let csvBuffer:Buffer = req.files[0].buffer;

        csvtojson()
        .fromString(csvBuffer.toString())
        .then((jsonData)=>{
            // HERE IS THE CODE TO UPLOAD IT
            for (let i in jsonData) {
                let db_payload: any = {};
                for (let j in jsonData[i]!) {
                    let value: any = jsonData[i];
                    db_payload[`$${j}`] = value[j];
                }
                db_payload["$DATE_CREATED"] = Date.now();
                // console.log(db_payload);
                if(req.query.action == "update"){
                    db_payload["$YEAR"] = req.query.year;
                    localSettings.updateTSP(db_payload);
                }else if(req.query.action == "create"){
                    db_payload["$YEAR"] = `${req.query.year}-${parseInt(req.query.year)+1}`
                    localSettings.insertTSP(db_payload)
                }
                // console.log(db_payload);
                // This adds TSPs with timestamp. 
                // TODO: Add status of contract?
            }
            res.sendStatus(200);
        })



    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process the uploaded file' });
    }

})

// Upload APL Rates to DB
router.post('/db-rates', upload.single('file'), (req, res) => {
    let date_now = Date.now();
    try {
        const workbook = xlsx.read(req.file!.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = xlsx.utils.sheet_to_json(sheet);
        // console.log(jsonData);

        for (let i in jsonData) {
            let db_payload: any = [];
            let data: any = jsonData[i];

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

            for (let j in db_payload) {
                localSettings.insertRATES(db_payload[j]);
            }
        }

        res.json(jsonData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process the uploaded file' });
    }
})

// Create Local Ocean Invoice #####################################
router.get('/create-dew-inv/:BOL/:MEMBER_NAME/:rowid', async (req:any, res:any) => {

    // 1-17 Fields ORDER MATTERS
    // let fields_names = [
    //   "TSP_NAME",
    //   "SCAC",
    //   "ADDRESS_1",
    //   "ADDRESS_2",
    //   "VESSEL",
    //   "VOYAGE",
    //   "BOL",
    //   "CONT_NUM",
    //   "INVOICE_DATE",
    //   "CONT_SIZE",
    //   "RECEIPT_PLACE",
    //   "LOAD_PORT",
    //   "DISCHARGE_PORT",
    //   "MEMBER_NAME",
    //   "GBL",
    //   "PIECES",
    //   "TTL_CF",
    //   "INVOICE_NUM",
    //   "TSA_NUM",
    //   "PAYMENT_TERMS",
    //   "TARIFF",
    // ]

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

    let data_payload: any
    // Check if Invoice already exists
    aplDB.getShipmentInvoice(req.params.MEMBER_NAME, req.params.BOL, req.params.rowid)
        .then((response: any) => {
            if (response.exists == true) {
                res.redirect('/api/get-inv/' + response.data[0].INVOICE_NUM);
            } else {
                // Create Entry DB for LOCAL_INVOICES
                aplDB.getShipment(data_payload, req.params.MEMBER_NAME, req.params.BOL, req.params.rowid).then(async (data) => {
                    aplDB.getInvoiceCount().then(async (val: any) => {
                        writePDF.writeOceanInv(data, val, true).then((pdfUint8) => {
                            let pdfbuffer = Buffer.from(pdfUint8.buffer);
                            res.writeHead(200, {
                                'Content-Type': 'application/pdf',
                                'Content-Disposition': `attachment; filename=NVC-${appUtils.addLeadingZeros(val)}.pdf`,
                                'Content-Length': pdfbuffer.length
                            });
                            res.end(pdfbuffer);
                        })
                    })
                })
            }
        })
})

// Get Local Ocean Invoice #######################################
router.get('/get-inv/:invoice_num', (req, res) => {
    aplDB.getShipmentInvoice(undefined, undefined, undefined, req.params.invoice_num)
        .then((response: any) => {
            writePDF.writeOceanInv(response.data[0], response.data[0].INVOICE_NUM, false).then((pdfUint8) => {
                let pdfbuffer = Buffer.from(pdfUint8.buffer);
                res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename=NVC-${appUtils.addLeadingZeros(response.data[0].INVOICE_NUM)}.pdf`,
                    'Content-Length': pdfbuffer.length
                });
                res.end(pdfbuffer);
            })
        })


})

// Request Shipments
router.post('/search', async (req, res, next) => {
    // console.log(req.body.data);
    let data = req.body.data;
    let search = req.body.search;
    let arg = req.body.arg;

    // console.log(data,search,arg);

    switch (data) {
        case "pendingshipments":
            searchDB.getShipments(arg, search, data)
                .then((resolved) => {
                    // console.log(resolved)
                    res.send(resolved);
                })
                .catch((reject) => {
                    console.log(reject)
                })
            break;
        case "allshipments":
            searchDB.getShipments(arg, search, data)
                .then((resolved) => {
                    // console.log(resolved)
                    res.send(resolved);
                })
                .catch((reject) => {
                    console.log(reject)
                })
            break;
        case "invoices":
            searchDB.getLocalInvoices(arg, search)
                .then(resolved => {
                    res.send(resolved);
                })
                .catch(reject => {
                    console.log(reject)
                })
            break
        case "tsp":
            searchDB.getTSP(arg, search)
                .then(resolved => {
                    res.send(resolved);
                })
                .catch(reject => {
                    console.log(reject)
                })
            break
        case "rates":
            searchDB.getRATES(arg, search)
                .then(resolved => {
                    res.send(resolved);
                })
                .catch(reject => {
                    console.log(reject)
                })
            break
        default:
            res.sendStatus(500);
            break;
    }
})

// VOID a Local Invoice
router.post("/inv/void", (req, res) => {
    // console.log(req.body)
    aplDB.voidLocalInvoice(req.body.REASON, parseInt(req.body.INVOICE_NUM))
    res.send(200);
})

// Export a table with all rows in `TSP` for a specific YEAR 
router.get("/export-tsp", (req,res,next)=>{
    // console.log(req)
    localSettings.getTSP(req.query.year)
    .then(tsp=>{
        let csv = appUtils.json2csv(tsp);
        res.type('text/csv')
        res.attachment(`${req.query.year}_TSP-List.csv`).send(csv);
    })
    .catch(err=>{
        console.error(err);
        res.sendStatus(403);
    })
})

// Get a list of TSP `YEAR` available to export.
router.get('/tsp-get-year',(req,res,next)=>{
    localSettings.getAllYearCyclesTSP()
    .then(rows=>{
        res.send(rows);
    })
    .catch(err=>{
        console.error(err);
        res.sendStatus(403);
    })
})

// !! RATES 
router.get('/rates-get-year',(req,res,next)=>{
    localSettings.getAllYearCyclesRates()
    .then(rows=>{
        res.send(rows);
    })
    .catch(err=>{
        console.error(err);
        res.sendStatus(403);
    })
})

router.get('/export-rates', (req,res,next)=>{
    const year:any=req.query.year;
    const quarter:any=req.query.quarter || null;

    localSettings.getRATES(year,quarter)
    .then(rates=>{
        let csv = appUtils.json2csv(rates);
        res.type('text/csv')
        res.attachment(`${year}_${quarter||"Q1"}_Rates.csv`).send(csv);
    })
    .catch(err=>{
        console.error(err);
        res.sendStatus(403);
    })
})

router.post('/upload-rates',(req,res,next)=>{
    console.table(req.query);
    res.sendStatus(200);
})

module.exports = router;

