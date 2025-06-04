# TODO FOR 08/06/24
### PHASE ONE MAKING AN INVOICE DONE!

# PHASE TWO
## API FOR APL???
- https://www.apl.com/products-services/ecommerce/edi-api-channels
!!!! DONE !!!!!


## Guam Outbound INV
- Credit? NO NEED
- Charge Export Declaration Surcharge = AMS (Make it work for the program)
!!!! DONE !!!!!


## APL-Invoices
- Bunker fix with Invoice BUnker and MAtch make note if not match
    + Additionally, Instead of making changes or taking the bunker charge face value, we need to state from WHICH rate the bunker charge was pulled. So we prompt the user to double check if the bunker charge is the right rate
- VOID
    + Rebill
    + Void with Date
    + Why voided (JSON OBJ?)
!!!! DONE !!!!!

# 12/11/24
## Settings - TSP Management
!!!! DONE !!!!!

## Settings - Rates Importing and Exporting
- Rates Importing and exporting options

## User Management - Create a way to manage users




## Supplemental Invoice
- Supplemental Series + Inv Number
- REASON FOR SUPP (JSON OBJ?)
- Supplemental A..B..C..D
- Concise Charges + Total difference 
- Keep track of Supplemental
!!!! DONE !!!!! NO SUPPLEMENTAL INVOICE WAS CREATED


## Login System
- Individual Log in System
!!!! DONE !!!!!


# PHASE THREE

## Discount Portion
- Contracts when do they expire
    + Contracts expire May 31st 2025
    + May 15th / May 31st
    + APL Feb 1st to May 31st


# TSP Agreement:
APL SENDS US THEIR CONTRACT = JAN-FEBRUARY

2024 - February to January
2025 - June to May?

OCEAN TRANSPORTATION AGREEMENT = JUNE 1st X Year - May 31st X+1 Year

# Discounts Processing
Every 2 months these discounts are being processed.
APL Sends a report of shipments named PAID EXCEPTION report that includes all the discounted money to be paid to the TSPs PER INVOICE #.

This is taken and matched to the LOCAL_INVOICES and calculated with TSP `DISCOUNT_FROM/TO_GUA` to split the amount that goes to DeWitt and the Amount that goes to the TSP

Import TSP based on Yearly "2024-2025" cycle and overwrite if needed to update TSPs.

# Rates

## Bunker Rates (Cycle)

Quarterly Cycle

January 1st - Q1
April 1st - Q2
July 1st - Q3
October 1st - Q4

Manual Enter instead of Upload
- Equipment Type = Dry
- Currency USD
- Types
  - 20'
  - 40'/40'H
  - 45'

Twice input, From and To GUAM

## All other Rates

Yearly Cycle

Effective June 1st to May 31st
\


# BUGS 03/07/25

- at Statement.<anonymous> (/home/administrator/Documents/TS-App/dist/db_call>
Mar 07 09:15:36 DWVM0003 bash[2368186]: TypeError: Cannot read properties of undefined (reading 'SCAC')
Mar 07 09:15:36 DWVM0003 bash[2368186]:                                                                                >
Mar 07 09:15:36 DWVM0003 bash[2368186]:                 db_init_1.db.all("SELECT TSP_NAME,ADDRESS_1,ADDRESS_2 FROM TSP >
Mar 07 09:15:36 DWVM0003 bash[2368186]: /home/administrator/Documents/TS-App/dist/db_calls/shipments.js:37

USG0291788 - DANIELS | TSIF
USG0291401 - EDEGER | NAVL no scac?
USG0294430 - SEWARD | 
USG0292465 - 
USG0292486

ISSUE; THERE IS A SPACE BEFORE THE "/USMC" NAME


-------------------------------
ALLL SAME
- GUAM NAMA1239096
- GUAM NAMA1239101
- GUAM NAMA1239102
- GUAM NAMA1240253
- TO GUAM NAMA1239098

---------------------------------

03/11/25
- INVOICES AND SHIPMENTS ARE NOT USING THE SAME RULES
- Check that the method used to invoke the shipments through invoices are the same and will not cause a overlapping error
- 



# BUGS 04/04/25

NAMA1242866
NAMA1242860
NAMA1243130
NAMA1244083
NAMA1244084
NAMA1243907