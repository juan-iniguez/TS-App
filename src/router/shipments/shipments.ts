import fs from "fs";
import express from "express";
import { aplDB } from '../../db_calls/shipments';
const router = express.Router();

// SHIPMENTS
// Main page for showing the shipment information
router.get("/:bol/:member_name/:rowid", (req, res) => {

    let data_payload: any = {}
    let settings = JSON.parse(fs.readFileSync('public/files/settings.json', "utf8"));

    aplDB.getShipmentInvoice(req.params.member_name, req.params.bol, req.params.rowid)
        .then((data: any) => {
            if (data.exists) {
                let data_payload = data.data[0];
                // SHOW INVOICE THAT IS ALREADY PRESENT
                res.redirect(`/shipments/${data_payload.INVOICE_NUM}`)
            } else {
                aplDB.getShipment(data_payload, req.params.member_name, req.params.bol, req.params.rowid).then((data: any) => {
                    data_payload = data;
                    data_payload.INVOICE_DATE = "N/A";
                    data_payload.PAYMENT_TERMS = settings.PAYMENT_TERMS[0];
                    data_payload.TSA_NUM = settings.TSA_NUM;
                    data_payload.TARIFF = settings.TARIFF;
                    res.render("pages/shipment", { data: data_payload });
                })
            }
        })
})

// Shipment information for already created invoices
router.get("/:invoice_num", (req, res) => {
    aplDB.getShipmentInvoice(undefined, undefined, undefined, req.params.invoice_num)
        .then((data: any) => {
            let data_payload = data.data[0];
            data_payload.INVOICE_DATE = new Date(data_payload.INVOICE_DATE).toLocaleDateString("en-US");
            data_payload.CHARGES = JSON.parse(data_payload.CHARGES);
            data_payload.RATES = data_payload.CHARGES.RATES;
            data_payload.NET_RATES = data_payload.CHARGES.NET_RATES;
            data_payload.VOID_INFO = JSON.parse(data_payload.VOID_INFO)
            delete data_payload.CHARGES;
            res.render("pages/shipment", { data: data_payload });
        })
})

module.exports = router;
