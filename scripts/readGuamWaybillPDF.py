from pypdf import PdfReader
import sys
import json
import re

# Vars
debug_sw = 0
payload = {}

class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def stripChars(x):

    y = float(x.replace(",", "").replace("USD", "").replace("$", ""))
    return y

def stripChars_int(x):

    y = int(x.replace(",", "").replace("USD", "").replace("$", ""))
    return y

def readPDF_waybill(reader):

    payload_waybill = {}
    customer_data = []
    number_of_pages = len(reader.pages)
    
    has_start_data = False
    has_customer_data = False
    has_end_data = False
    
    
    # Text transform index

    # START SCANNING THE PAGES
    for page in range(number_of_pages):
        tti = 0
        text = reader.pages[page].extract_text()
        text_transform = text.split("\n")
        print("------------------------- \n")
        print(text)
        for s in text_transform:
            if "Shipped on Board " in s:
                payload_waybill['VESSEL'] = re.findall( r'\b\w+\s+\w+\b',s.split("Shipped on Board ")[1])[0]
                print(payload_waybill['VESSEL'])
                break

        # Get BOL and VESSEL
        if has_start_data == False:
            for s in text_transform:
                if "USG" in s:
                    payload_waybill['BOL'] = s
                if "Shipped on Board " in s:
                    print(s)
                    # payload_waybill['VESSEL'] = s
                    break

            # Get Shipper Information
            for i in text_transform:
                print(bcolors.FAIL + i + bcolors.ENDC)
                tti += 1
                try:
                    if "CONTAINER" in i:
                        payload_waybill['CONT_SIZE'] = i.split(" ")[i.split(" ").index("CONTAINER:") -1].split("x")[1]
                        gPrint(payload_waybill['CONT_SIZE']);
                    if "LVNS" in i:
                        payload_waybill['CODE'] = "LVNS"
                        payload_waybill['CONT_NUM'] = i.split(" ")[0]
                        # gPrint(payload_waybill['CONT_NUM'])
                    if "SN#" in i:
                        payload_waybill['SERIAL_NUM'] = i.split("  ")[0].split("SN# ")[1]
                        for s in i.split("  "):
                            try:
                                if "LBS" in s:
                                    payload_waybill['WEIGHT_LBS'] = stripChars(s.split("LBS")[0])
                                if "FTQ" in s:
                                    payload_waybill['CUBIC_FEET'] = stripChars(s.split("FTQ")[0])
                                    break
                            except ValueError:
                                print("ERR", ValueError)
                        # gPrint(payload_waybill['SERIAL_NUM'])
                        # gPrint(payload_waybill['WEIGHT_LBS'])
                        # gPrint(payload_waybill['CUBIC_FEET'])
                        has_start_data = True
                        break
                except ValueError:
                    print("ERR", ValueError)
            # print(tti)

        # Search for Customer Data start
        for n in range(0,11):
            if "SM:" in text_transform[n]:
                print(text_transform[n])
                customer_data_index = n
                break
            else :
                customer_data_index = 0
        
        while has_customer_data == False:
            temp_cust_data = {}
            # print(customer_data_index)
            # print(customer_data)
            if "SM:" in text_transform[customer_data_index]:
                if "Continued From Previous Sheet" in text_transform[customer_data_index]:
                    temp_cust_data["PIECES"] = text_transform[customer_data_index].split("Continued From Previous Sheet")[1].split("SM:")[0].strip()
                else:
                    temp_cust_data["PIECES"] = text_transform[customer_data_index].split("SM:")[0].strip()
                temp_cust_data["SM"] = text_transform[customer_data_index].split("SM:")[1].split("SCAC:")[0].strip().split("/")[0]
                try:
                    temp_cust_data["SCAC"] = text_transform[customer_data_index].split("(")[1].strip()[:-1]
                except:
                    customer_data_index += 1
                    temp_cust_data["SCAC"] = text_transform[customer_data_index].split("(")[1].strip()[:-1]
                customer_data_index += 1
                temp_cust_data["GBL"] = text_transform[customer_data_index].strip().split("GBL:")[1].strip().split(" ")[0]
                temp_cust_data["WEIGHT_LBS"] = stripChars(text_transform[customer_data_index].strip().split("LB")[0].split(" ")[-1])
                temp_cust_data["TTL_CF"] = stripChars(text_transform[customer_data_index].strip().split("GBL:")[1].split(" ")[2][:-2])
                customer_data_index += 1
                if "RDD" in text_transform[customer_data_index]:
                    temp_cust_data["RDD"] = text_transform[customer_data_index].strip().split(" ")[1]
                else:
                    temp_cust_data["RDD"] = "N/A"
                if "NET" in text_transform[customer_data_index]:
                    temp_cust_data["NET"] = stripChars_int(re.findall(r'\b\w+\b' , text_transform[customer_data_index])[1])
                else:
                    temp_cust_data["NET"] = "N/A"
                customer_data_index += 1
                customer_data.append(temp_cust_data)
                
            else:
                print("Else?")
                if "HS CODE:" in text_transform[customer_data_index]:
                    has_customer_data = True
                    print("TRUE")
                    break
                elif payload_waybill["BOL"] in text_transform[customer_data_index]:
                    break
                else:
                    customer_data_index += 1
        
        # END DATA
        if has_customer_data == True and has_end_data == False:
            print("In End Phase")
            while True:
                if "HS CODE" in text_transform[customer_data_index]:                
                    # print(f"HS CODE: {text_transform[customer_data_index].split('HS CODE:')[1].strip()}")
                    # payload_waybill['HS CODE'] = text_transform[customer_data_index].split('HS CODE:')[1].strip()
                    # print("HS CODE")
                    # print(payload_waybill)
                    # print(page)
                    print(text_transform[customer_data_index])
                    # print(text)
                    customer_data_index += 2
                if "ETD" in text_transform[customer_data_index]:
                    print(text_transform[customer_data_index])
                    # print(f"ETD: {text_transform[customer_data_index].split('ETD:')[1].split('USG')[0].strip()}")
                    payload_waybill['ETD'] = text_transform[customer_data_index].split('ETD:')[1].split('USG')[0].strip()
                    customer_data_index += 1
                if "ETA" in text_transform[customer_data_index]:
                    print(text_transform[customer_data_index])
                    # print(f"ETA: {text_transform[customer_data_index].split('ETA:')[1].split('USG')[0].strip()}")
                    payload_waybill['ETA'] = text_transform[customer_data_index].split('ETA:')[1].split('USG')[0].strip()
                    has_end_data=True
                    payload_waybill["SHIPMENTS"] = customer_data
                    payload['waybill'] = payload_waybill
                    # print("\n")
                    break
                else:
                    if "ETD" in payload_waybill and not 'ETA' in payload_waybill and customer_data_index == len(text_transform)-1:
                        print(page)
                        print(number_of_pages)
                        if page ==  number_of_pages-1:
                            has_end_data=True
                            payload_waybill["SHIPMENTS"] = customer_data
                            payload['waybill'] = payload_waybill
                            # print("\n")
                            break
                        else:
                            break
                    if "ETD" not in payload_waybill and customer_data_index == len(text_transform)-1:
                        break
                    customer_data_index += 1

    print(payload_waybill)

def gPrint(text):
    print(bcolors.OKGREEN + text + bcolors.ENDC);

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


