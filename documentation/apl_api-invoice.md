# Invoice APL API

> APL's Documentation
> 
>https://api-portal.cma-cgm.com/products/api/shipping.invoicing.customer.data.v2

Endpoint:

`https://apis.cma-cgm.net/shipping/invoicing/customer/data/v2`

Invoice specific method:

GET - `/invoices/{invoiceNo}/data`

AUTH SCOPE: `invoicepartnerdata:load:be`

Example (JSON):

```json
{
  "charges": [
      {
          "containerNumbers": [
              "TLLU4337737"
          ],
          "chargeCode": "FRT00",
          "chargeDescription": "BASIC FREIGHT",
          "unitPrice": 3768,
          "calculationBasis": "UNI",
          "quantity": 1,
          "chargeAmount": 3768,
          "chargeCurrency": "USD",
          "invoicingCurrency": "USD",
          "currencyExchangeRate": 1,
          "exchangeRateDescription": "1 USD = 1.000000 USD",
          "chargeAmountInvoicingCurrency": 3768.00,
          "taxCode": "00",
          "taxDescription": "Zero rated"
      },
      {
          "containerNumbers": [
              "TLLU4337737"
          ],
          "chargeCode": "BAF03",
          "chargeDescription": "Bunker surcharge NOS",
          "unitPrice": 1265,
          "calculationBasis": "UNI",
          "quantity": 1,
          "chargeAmount": 1265,
          "chargeCurrency": "USD",
          "invoicingCurrency": "USD",
          "currencyExchangeRate": 1,
          "exchangeRateDescription": "1 USD = 1.000000 USD",
          "chargeAmountInvoicingCurrency": 1265.00,
          "taxCode": "00",
          "taxDescription": "Zero rated"
      },
      {
          "containerNumbers": [
              "TLLU4337737"
          ],
          "chargeCode": "THC34",
          "chargeDescription": "Terminal handl. ch  destination",
          "unitPrice": 915,
          "calculationBasis": "UNI",
          "quantity": 1,
          "chargeAmount": 915,
          "chargeCurrency": "USD",
          "invoicingCurrency": "USD",
          "currencyExchangeRate": 1,
          "exchangeRateDescription": "1 USD = 1.000000 USD",
          "chargeAmountInvoicingCurrency": 915.00,
          "taxCode": "00",
          "taxDescription": "Zero rated"
      },
      {
          "containerNumbers": [
              "TLLU4337737"
          ],
          "chargeCode": "THC58",
          "chargeDescription": "Terminal handl ch origin",
          "unitPrice": 755,
          "calculationBasis": "UNI",
          "quantity": 1,
          "chargeAmount": 755,
          "chargeCurrency": "USD",
          "invoicingCurrency": "USD",
          "currencyExchangeRate": 1,
          "exchangeRateDescription": "1 USD = 1.000000 USD",
          "chargeAmountInvoicingCurrency": 755.00,
          "taxCode": "00",
          "taxDescription": "Zero rated"
      },
      {
          "containerNumbers": [
              "TLLU4337737"
          ],
          "chargeCode": "FEE85",
          "chargeDescription": "Container inspection fees and survey fees",
          "unitPrice": 52,
          "calculationBasis": "UNI",
          "quantity": 1,
          "chargeAmount": 52,
          "chargeCurrency": "USD",
          "invoicingCurrency": "USD",
          "currencyExchangeRate": 1,
          "exchangeRateDescription": "1 USD = 1.000000 USD",
          "chargeAmountInvoicingCurrency": 52.00,
          "taxCode": "00",
          "taxDescription": "Zero rated"
      }
  ],
  "invoice": {
      "invoiceNo": "NAMA1229699",
      "transportDocumentReference": "USG0285979",
      "invoiceType": "Invoice",
      "transportationPhase": "Import",
      "invoiceDomain": "Freight",
      "invoiceDate": "2024-10-22",
      "invoiceDueDate": "2024-11-21",
      "invoiceAmount": 6755,
      "currencyCode": "USD",
      "references": []
  },
  "payment": {
      "payer": {
          "code": "XXXXXX",
          "name": "XXXXXX",
          "address1": "XXXX",
          "address2": "XXX",
          "postCode": "XXX",
          "city": "XX",
          "country": "XX"
      },
      "paymentInstructions": "SWIFT CODE: CITIUS33 ABA NUMBER: XXXXXX",
      "paymentAccount": {
          "accountId": "XXXX",
          "bankInformation": {
              "name": "CITIBANK",
              "address1": "388 GREENWICH STREET",
              "postCode": "10013",
              "city": "NEW YORK",
              "country": "UNITED STATES"
          },
          "accountName": "Beneficiary - American President Lines, LLC",
          "accountNumber": "XXXX",
          "acountIban": "XXXXX"
      },
      "paymentStatus": "Unpaid",
      "payableTo": {
          "name": "AMERICAN PRESIDENT LINES LLC",
          "address1": "555 MARRIOTT DRIVE SUITE 800",
          "postCode": "37214",
          "city": "NASHVILLE",
          "country": "US"
      }
  },
  "issuer": {
      "name": "AMERICAN PRESIDENT LINES LLC",
      "address1": "1515 NORTH COURTHOUSE ROAD",
      "address2": "SUITE 700",
      "postCode": "22201",
      "city": "ARLINGTON",
      "country": "US",
      "taxNumber": "940434900"
  },
  "invoicedCall": {
      "vessel": {
          "name": "PRESIDENT BUSH",
          "imo": "9938353",
          "vesselCode": "PRBUH"
      },
      "voyageRef": "0DBJMW1PL",
      "callDate": "2024-10-26"
  },
  "totalChargesAmount": 6755,
  "taxAmount": 0,
  "taxCalculationDetails": [
      {
          "taxCode": "00",
          "taxDescription": "Zero rated",
          "taxableAmount": 6755,
          "taxAmount": 0
      }
  ],
  "agreementReference": "23-9028",
  "shipment": {
      "shippingCompany": "0015",
      "portOfLoading": {
          "code": "USLAX",
          "name": "LOS ANGELES, CA",
          "departureDate": "2024-10-13T18:12:00-07:00",
          "departureVoyageReference": "0DBJMW1PL",
          "vesselImo": "9938353"
      },
      "portOfDischarge": {
          "code": "GUPIT",
          "name": "PITI, GUAM",
          "arrivalDate": "2024-11-04T07:06:00+10:00"
      },
      "exportTransport": {
          "haulageMode": "Merchant",
          "movementType": "Port",
          "shippingType": "FCL"
      },
      "importTransport": {
          "haulageMode": "Merchant",
          "movementType": "Port",
          "shippingType": "FCL"
      },
      "freightPayableAt": {
          "name": "US GOVERNMENT FREIGHT, TN",
          "internalCode": "USYYY"
      },
      "freightPaymentMode": "Collect",
      "equipments": [
          {
              "equipmentGroupIsoCode": "40HC",
              "containerNumber": "TLLU4337737",
              "goodsDetails": [
                  {
                      "commodity": "980000",
                      "commodityDescription": "Personal and household effects."
                  }
              ]
          }
      ]
  },
  "mentions": [
      {
          "category": "Late Payment",
          "mention": " PLEASE SEE ANY SPECIAL PAYMENT NOTES AT THE BOTTOM OF THIS PAGE Payment shall be made for full amount on or prior to due date, free of charges, without any deduction nor discount for advance payment. All bank charges are for the account of the payer-remitter."
      },
      {
          "category": "Legal",
          "mention": " To the best of our knowledge, you serve as the ultimate owner of the cargo, which is the reason you're receiving this invoice. If you are not the ultimate owner of the cargo, you must advise nasddsmdisputes@apl.com within 48 hours of receipt of the invoice the name and contact details (including email and postal address) of the party who serves as ultimate recipient so that we may invoiced accordingly. Dispute Resolution Guidance: https://www.apl.com/news/2276/detention-and-demurrage APL's D&D Tariff is published under APLU100, 200,& 300. Service Contract D&D terms & conditions are in Term 101, the boilerplate, and/or customer's specified section. Disputes must be sent to nasddsmdisputes@apl.com within 30 days of invoice date. Carrier will make its best efforts to resolve a dispute within 30 days."
      },
      {
          "category": "Local Payment"
      }
  ]
}
```

END