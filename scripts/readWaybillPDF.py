from pypdf import PdfReader
import sys
import json
import re

# Vars
debug_sw = 0
payload = {}

def stripChars(x):

    y = float(x.replace(",", "").replace("USD", "").replace("$", ""))
    return y

def stripChars_int(x):

    y = int(x.replace(",", "").replace("USD", "").replace("$", ""))
    return y

def readPDF_invoice(reader):
    payload_invoice = {}
    number_of_pages = len(reader.pages)
    page = reader.pages[0]
    text = page.extract_text(extraction_mode="layout", layout_mode_space_vertically=False)
    # ! ---- DEBUG PRINT ----
    if debug_sw == 1: 
        print("% INVOICE START %")
        print(text)
        print("% INVOICE END %")
    if "1UNI" in text:
        text_transform = text.replace("1UNI", "1 UNI").split("\n")   
    else:
        text_transform = text.split("\n")
    # Place of Receipt =
    # Place of Delivery =
    # 
    # 
    # Bill of Landing = 5
    # Customer# = 7
    # Date of Invoice = 8
    # Invoice# = 6
    # Vessel = 16
    # Place of Receip | Discharge Port = 17
    # Load Port | Place of Delivery = 18
    # Commodity code/Description/Package QTY = 24
    # Container# = 25
    # Charges = 27-31
    # Total = 34

    # print("Bill of Landing: " + text_transform[5].split("Booking Ref:")[1].split(" ")[1])
    payload_invoice['BOL'] = text_transform[5].split("Booking Ref:")[1].split(" ")[1]
    # print("Invoice #: " + text_transform[6].replace("ORIGINAL", "").replace(" ","").split("Customer:")[1])
    payload_invoice['INVOICE_NUM'] = text_transform[6].replace("ORIGINAL", "").replace(" ","").split("Customer:")[1]

    # print("Customer #: " + text_transform[7].replace(" ", ""))
    payload_invoice['CUSTOMER_NUM'] = text_transform[7].replace(" ", "")
    
    # print("Invoice Date: " + text_transform[8].split("Date: ")[1])
    payload_invoice['INVOICE_DATE'] = text_transform[8].split("Date: ")[1]
    
    # DYNAMIC INDEX FINDER
    invoice_index = 14

    while True :
        if "Voyage" in text_transform[invoice_index]:
            break
        else:
            invoice_index += 1

    # print(invoice_index)
    # print("Voyage: " + text_transform[invoice_index].replace("  "," ").split("Vessel:")[0].split("Voyage:")[1].strip())
    payload_invoice['VOYAGE'] = text_transform[invoice_index].replace("  "," ").split("Vessel:")[0].split("Voyage:")[1].strip()

    # print("Vessel: " + text_transform[16].replace("  "," ").split("Vessel:")[1].split("Call Date:")[0].strip())
    payload_invoice['VESSEL'] = text_transform[invoice_index].replace("  "," ").split("Vessel:")[1].split("Call Date:")[0].strip()
    invoice_index += 1

    # print("Place of Receipt: " + text_transform[17].split("Place of Receipt:")[1].strip().split("  ")[0])
    payload_invoice['RECEIPT_PLACE'] = text_transform[invoice_index].split("Place of Receipt:")[1].strip().split("  ")[0]

    # print("Discharge Port: " + text_transform[17].split("Discharge Port:")[1].strip())
    payload_invoice['DISCHARGE_PORT'] = text_transform[invoice_index].split("Discharge Port:")[1].strip()
    invoice_index += 1

    # print("Load Port: " + text_transform[18].split("Load Port:")[1].split("Place of Delivery:")[0].strip())
    payload_invoice['LOAD_PORT'] = text_transform[invoice_index].split("Load Port:")[1].split("Place of Delivery:")[0].strip()

    # print("Place of Delivery: " + text_transform[18].split("Place of Delivery:")[1].strip().split("  ")[0])
    payload_invoice['DELIVERY_PLACE'] = text_transform[invoice_index].split("Place of Delivery:")[1].strip().split("  ")[0]

    cc_desc_qty = []
    # Text Transform Index
    tti = 0

    for i in range(19, 28):
        # print(f"DEBUG: {text_transform[i]}")
        if "Commodity Code" in text_transform[i]:
            # print(f"DEBUG: {text_transform[i]}")
            tti = i+1
            # print(f"DEBUG: {text_transform[i]}")
            break

    for i in text_transform[tti].split("  "):
        if(i != ""):
            cc_desc_qty.append(i.strip())
    # print("Comodity Code: " + cc_desc_qty[0])
    # payload_invoice['COMODITY_CODE'] = cc_desc_qty[0]

    # print("Description: " + cc_desc_qty[1])
    # payload_invoice['DESCRIPTION'] = cc_desc_qty[1]

    # print("Container Size: " + cc_desc_qty[2])
    payload_invoice['CONT_SIZE'] = cc_desc_qty[2]
    tti += 1

    # print("Container Number: " + text_transform[25].strip().split("Container Number(s):")[1].strip())
    payload_invoice['CONT_NUM'] = text_transform[tti].strip().split("Container Number(s):")[1].strip()
    tti += 2

    all_charges = []

    # GOTTA MAKE SURE WE START WHEN WE START 
    # Align TTI with the start of the charges section so it starts when the "Size/type" line is present instead of hardcoded values
    for i in range(tti,45):
        charges = {}
        individual_chrg = []
        for j in text_transform[i].split("  "):
            if(j != ""):
                individual_chrg.append(j.strip())
        charges['SIZE'] = individual_chrg[0]
        charges['TYPE'] = individual_chrg[1]
        charges['DESC'] = individual_chrg[2]
        # Edge case where there is an extra space between the words
        if individual_chrg[3] == "destination":
            individual_chrg.pop(3)
        charges['BASED_ON'] = stripChars(individual_chrg[3].split("UNI")[0])
        charges['RATE_CURR'] = stripChars(individual_chrg[4])
        charges['AMOUNT'] = stripChars(individual_chrg[5])
        charges['AMOUNT_USD'] = stripChars(individual_chrg[6])
        all_charges.append(charges)
        tti += 1
        if "Currency Charge Totals" in text_transform[tti]:
            tti += 2
            break
        # print(charges)


    payload_invoice['CHARGES'] = all_charges
    # print("Total: " + text_transform[34].strip().split("Total")[1].strip())
    payload_invoice['TOTAL'] = stripChars(text_transform[tti].strip().split("Total")[1].strip())
    # print(payload_invoice)
    payload["invoice"] = payload_invoice
    # print("\n")

def readPDF_waybill(reader):
    payload_waybill = {}
    number_of_pages = len(reader.pages)
    # page = reader.pages[0]

    # FIRST GET ALL THE PDF INFO

    # START DATA
    # Vessel Name = 2
    # Container Size = 4
    # Container Number | Start Hint | Code? | Weight(Kgs) | CubicMeters = 5
    # Serial Number | Type | Weight(lbs) | CubicFeet = 6
    # 
    # CUSTOMER DATA
    #  "x of x SM: {Last name}, {First name} SCAC: ({SHIPPER})
    #  "GBL:{GBL CODE} {WEIGHT_LBS} {CUBIC_FEET}"
    #  "RDD: {DATE} NET: {NET_NUM}"
    #   CHECK AT THE END OF RDD if there is a USG number at the end to signal the end of that page.
    # 
    # END DATA
    #  "HS CODE: {HS_CODE}"
    #  "FREIGHT COLLECT"
    #  "ETD: {ETD}"
    #  "ETA: {ETA}"
    #  "TOTAL"
    # 

    # Switches
    has_start_data = False
    has_customer_data = False
    has_end_data = False
    customer_data = []

    for page in range(number_of_pages):
        print(f"Current Page:{page}")
        print(f"Number of Pages:{number_of_pages}")
        print(f"CD:{has_customer_data}")
        print(f"ED:{has_end_data}")
        print(f"SD:{has_start_data}")

        text = reader.pages[page].extract_text()
        # print("------------------------- \n")
        # print(text)
        text_transform = text.split("\n")

        payload_waybill['BOL'] = "USG" + text.split("USG")[1].split(" ")[0]
        if has_end_data == True :
            break
        # print(text)
        if has_start_data == False:
            # print("Vessel Name: " + text_transform[2].strip())
            payload_waybill['VESSEL'] = text_transform[2].strip()

            # print("Container Size: " + text_transform[4].split("CONTAINER:")[0].strip().split("x")[1])
            payload_waybill['CONT_SIZE'] = text_transform[4].split("CONTAINER:")[0].strip().split("x")[1]

            # Text transform index
            tti = 0

            for n in range(5,10):
                if "KGS" in text_transform[n]:
                    tti = n
            container_data = []
            for k in range(tti,tti+2):
                data_temp = []
                # print(k)
                for j in text_transform[k].split("  "):
                    if j != "" and j != " ":
                        data_temp.append(j.strip())
                        # print(j)
                container_data.append(data_temp)
            # print(container_data)
            # print("Container Number: " + container_data[0][0])
            payload_waybill['CONT_NUM'] = container_data[0][0]
            # print("Start Hint: " + container_data[0][1])
            # payload_waybill['HINT'] = container_data[0][0]
            # print("Code: " + container_data[0][2])
            payload_waybill['CODE'] = container_data[0][2]

            # print("Weight(KGS): " + container_data[0][3][:-3])
            # payload_waybill['WEIGHT_KGS'] = container_data[0][3][:-3]

            # print("Cubic Meters: " + container_data[0][4][:-3])
            # payload_waybill['CUBIC_MTS'] = container_data[0][4][:-3]

            # print("SN: " + container_data[1][0].split("SN#")[1].strip())
            payload_waybill['SERIAL_NUM'] = container_data[1][0].split("SN#")[1].strip()

            # print("Type: " + container_data[1][1])
            # payload_waybill['SERIAL_NUM'] = container_data[1][0].split("SN#")[1].strip()

            # print("Weight(LBS): " + container_data[1][2][:-3])
            payload_waybill['WEIGHT_LBS'] = stripChars(container_data[1][2][:-3])

            # print("Cubic Feet: " + container_data[1][3][:-3])
            payload_waybill['CUBIC_FEET'] = stripChars(container_data[1][3][:-3])

            has_start_data = True
        
        # START CUSTOMER DATA - index 4

        customer_data_index = 4

        # Search for Customer Data start
        for n in range(4,11):
            if "HS CODE" in text_transform[n]:
                break
            if "SM:" in text_transform[n]:
                print(text_transform[n])
                customer_data_index = n
                break
        
        temp_cust_data = {}
        while has_customer_data == False:
            print("CHECKING FOR SHIPMENTS")
            print(text_transform[customer_data_index])
            print(temp_cust_data)
            try:
                if "SM" in text_transform[customer_data_index] or "GBL" in text_transform[customer_data_index] or "RDD" in text_transform[customer_data_index] or "NET" in text_transform[customer_data_index] or "HS CODE" in text_transform[customer_data_index]:
                    print("CURRENT LINE: ")
                    print(text_transform[customer_data_index])
                    if "SM" in text_transform[customer_data_index]:
                        temp_cust_data["PIECES"] = text_transform[customer_data_index].split("SM:")[0].strip()
                        temp_cust_data["SM"] = text_transform[customer_data_index].split("SM:")[1].split("SCAC:")[0].strip()
                        temp_cust_data["SCAC"] = re.findall(r"SCAC:[(\s]?[a-zA-Z]{4}\s?[)]?", text_transform[customer_data_index])[0].split(":")[-1].strip("()").strip(" ")
                        print(temp_cust_data);
                        if payload_waybill["BOL"] in text_transform[customer_data_index]:
                            print(temp_cust_data)
                            print("Exception Rasied: FIRST LINE")
                            raise IndexError("Next Page")
                        customer_data_index += 1
                    print("CURRENT LINE: ")
                    print(text_transform[customer_data_index])
                    if "GBL" in text_transform[customer_data_index]:
                        temp_cust_data["GBL"] = text_transform[customer_data_index].strip().split("GBL:")[1].strip().split(" ")[0]
                        temp_cust_data["WEIGHT_LBS"] = stripChars(text_transform[customer_data_index].strip().split("LB")[0].split(" ")[-1])
                        temp_cust_data["TTL_CF"] = stripChars(text_transform[customer_data_index].strip().split("CF")[0].split(" ")[-1])
                        if payload_waybill["BOL"] in text_transform[customer_data_index]:
                            print(temp_cust_data)
                            print("Exception Rasied: SECOND LINE")
                            raise IndexError("Next Page")
                        customer_data_index += 1
                    if "RDD" in text_transform[customer_data_index] or "NET" in text_transform[customer_data_index]:
                        if "RDD" in text_transform[customer_data_index]:
                            temp_cust_data["RDD"] = text_transform[customer_data_index].strip().split(" ")[1]
                        else:
                            temp_cust_data["RDD"] = "N/A"
                        if "NET" in text_transform[customer_data_index]:
                            temp_cust_data["NET"] = stripChars(text_transform[customer_data_index].strip().split("NET:")[1].strip()) if "USG" not in text_transform[customer_data_index] else stripChars(text_transform[customer_data_index].split("NET:")[1].strip().split("  ")[0])
                            customer_data.append(temp_cust_data)
                            print(customer_data)
                            temp_cust_data={}
                        else:
                            temp_cust_data["NET"] = "N/A"
                            customer_data.append(temp_cust_data)
                            print(customer_data)
                            temp_cust_data={}
                        if payload_waybill["BOL"] in text_transform[customer_data_index]:
                            print(temp_cust_data)
                            print("Exception Rasied: THIRD LINE")
                            raise IndexError("Next Page")
                    if "HS CODE" in text_transform[customer_data_index]:
                        has_customer_data = True
                        print("Exception Rasied: HS CODE REACHED")
                        break
                    else:
                        customer_data_index += 1
                else:
                    customer_data_index += 1
            except IndexError:
                print("EXCEPTION HAS BEEN RAISED")
                text = reader.pages[page+1].extract_text()
                text_transform = text.split("\n")
                customer_data_index = 4
            print("END LOOP, INTO NEXT")

        # print(f"BROKE OUT OF LOOP! {i}")
        print("HAS CUSTOMER DATA: ")
        print(has_customer_data)
        print("\n")

        # END DATA
        if has_customer_data == True:
            while(True):
                print(text_transform[customer_data_index])
                if "HS CODE" in text_transform[customer_data_index]:                
                    customer_data_index += 1
                if "ETD" in text_transform[customer_data_index]:
                    payload_waybill['ETD'] = text_transform[customer_data_index].split('ETD:')[1].split('USG')[0].strip()
                    customer_data_index += 1
                if "ETA" in text_transform[customer_data_index]:
                    payload_waybill['ETA'] = text_transform[customer_data_index].split('ETA:')[1].split('USG')[0].strip()
                    has_end_data=True
                    payload_waybill["SHIPMENTS"] = customer_data
                    print(payload_waybill)
                    payload['waybill'] = payload_waybill
                    # print("\n")
                    break
                else:
                    customer_data_index += 1
                    if customer_data_index == len(text_transform)-1:
                        print(text_transform[customer_data_index])
                        break

def main(arg):
    # os.remove("public/files/data.json")
    # print(arg[3])
    waybill = arg[1]
    if arg[2] == "-d" or arg[2] == "--debug":
        debug_sw = 1

    pdfs_02 = PdfReader(waybill)
    readPDF_waybill(pdfs_02)

    # print(payload)
    with open(f"{arg[1].split('.pdf')[0]}.json", "w") as outfile: 
        json.dump(payload, outfile)

if __name__ == "__main__":
    main(sys.argv)