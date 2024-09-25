let currentTab = "pendingshipments";
let tabs = ["pendingshipments","allshipments", "invoices", "tsp", "rates" ]
let searchBar = document.getElementById("search-bar");
let searchArg = document.getElementById("search-arg");


searchBar.addEventListener("keyup", search);

for(let i in tabs){
    document.getElementById(tabs[i] + "-tab").addEventListener("click", openTab)
}

// Get first 10 search results from Shipments
async function main(){
    if(document.URL.split('#')[1]){
        currentTab = document.URL.split('#')[1]
        // console.log(currentTab);
    }
    document.getElementById(currentTab+"-tab").classList.toggle("active");
    try {
        const getShipments = await axios.post("/api/search", {
            data: currentTab,
            search: "",
            arg: "",
        });
        populateTable(getShipments.data, currentTab);
    } catch (error) {
        console.log(error)
    }
}

function addLeadingZeros(amount){
    let x = "";
    for(let i=0;i<6-amount.toString().length;i++){
        x += "0";
    }
    return x+amount;
}

function populateTable(data, key){
    let tableMain = document.getElementById("table-main")
    // console.log("Populating Data:")
    // console.log(data, key);

    // Create Headers
    let headrow = document.createElement("tr");

    for(let i in data){
        // ROW ELEMENT
        let el = document.createElement("tr");
        switch (key) {
            case "allshipments":
                el.addEventListener("click",goTo);                
                break;
            case "pendingshipments":
                el.addEventListener("click",goTo);                
                break;
            case "invoices":
                el.addEventListener("click",goToInvoice);                
                break;
            default:
                el.addEventListener("click",goTo);
                break;
        }
        for(let j in data[i]){
            // Create Headers
            if(i == 0){
                let theader = document.createElement("th");
                theader.innerText = j;
                j == 'rowid'?{}:headrow.insertAdjacentElement("beforeend", theader);
            }
            // SET CONDITIONS FOR EACH TD FORMATTING
            let td = createTD(data[i][j])
            switch (j) {
                case "DATE_CREATED":
                case "INVOICE_DATE":
                    td.innerHTML = "";
                    td.innerText = (new Date(data[i][j])).toLocaleDateString('en-US');
                    el.insertAdjacentElement("beforeend", td);
                    break;
                case "AMOUNT":
                case "TOTAL" :
                    td.innerText = "";
                    td.innerText = data[i][j].toLocaleString('en-US', {style: 'currency', currency: 'USD'});
                    el.insertAdjacentElement("beforeend", td);
                    break;
                case "VOID":
                    td.innerHTML = "";
                    td.style = "text-align:center";
                    td.innerHTML = data[i][j] > 0 ? `<input style='margin:auto;' type='checkbox' checked disabled>`:`<input style='margin:auto;' type='checkbox' disabled>`;
                    el.insertAdjacentElement("beforeend", td);
                    break;
                case "INVOICE_NUM":
                    // console.log(data[i][j]);
                        if(!data[i][j]){
                            td.innerText = "N/A";
                            el.insertAdjacentElement("beforeend", td);
                        }else{
                            td.innerText = "NVC-" + addLeadingZeros(data[i][j]);
                            el.insertAdjacentElement("beforeend", td);
                        }
                    break;
                case "DISC_FROM_GUA":
                case "DISC_TO_GUA":
                    td.innerText = "";
                    td.innerText = data[i][j].toLocaleString('en-US', {style: 'percent'});
                    el.insertAdjacentElement("beforeend", td);
                    break;
                case "rowid":
                    break;
                default:
                    el.insertAdjacentElement("beforeend", td);
                    break;
            }
        }
        trID = data[i].rowid || data[i].INVOICE_NUM
        el.id = 'shipment-'+trID;
        if(data[i].INVOICE_NUM && key == "allshipments"){
            el.classList.toggle("green")
        }
        tableMain.insertAdjacentElement("afterbegin",headrow);
        tableMain.insertAdjacentElement("beforeend", el);
    }

}

function clearTable(){
    let tableMain = document.getElementById("table-main")
    tableMain.innerHTML = "";
}

function createTD(value){
    let el = document.createElement('td')
    el.innerText = value;
    return el;
}

function goTo(e){

    let headers = document.getElementsByTagName("th");
    let options = [];
    for(let i in headers){
        options.push(headers[i].innerText);
    }
    let bol = e.target.parentElement.children[options.indexOf("BOL")].innerText;
    let member_name = e.target.parentElement.children[options.indexOf("MEMBER_NAME")].innerText;
    let rowid = parseInt(e.target.parentElement.id.split('-')[1]);
    // console.log(rowid)

    window.location.href = `/api/shipments/${bol}/${member_name}/${rowid}`

}

function goToInvoice(e){

    let headers = document.getElementsByTagName("th");
    let options = [];
    for(let i in headers){
        options.push(headers[i].innerText);
    }
    let bol = e.target.parentElement.children[options.indexOf("BOL")].innerText;
    let member_name = e.target.parentElement.children[options.indexOf("MEMBER_NAME")].innerText;
    let rowid = parseInt(e.target.parentElement.id.split('-')[1]);
    // console.log(rowid)

    window.location.href = `/api/shipments/${rowid}`
}

function openTab(e){
    let key = e.target.id.split("-")[0]
    // console.log(e.target.id.split("-")[0]);
    window.history.pushState('', '', '#'+key);

    let action = (el)=>{
        if(!e.target.classList.contains("active")){
            document.getElementById(currentTab+"-tab").classList.toggle("active")
            e.target.classList.toggle("active");
            if(el == "allshipments" || el == "pendingshipments"){
                document.getElementById("shipments-selected").innerText = el=="allshipments"?"All Shipments":"Pending Shipments";
            }
        }
        currentTab = el;
        axios.post("/api/search", {
            data: currentTab,
            search: "",
            arg: "",
        }).then(data=>{
            // console.log("## DATA ##")
            // console.log(data);
            dropdownSet(data.data[0])
            populateTable(data.data, key);
        })        
    }

    let dropdownSet = (row)=>{
        // console.log(row);
        let argOptions = document.getElementById("search-arg");
        let keys = Object.keys(row);

        argOptions.innerHTML = "";
        for(let i in keys){
            argOptions.innerHTML += `<option value="${keys[i]}">${keys[i]}</option>`
        }
    }

    clearTable();
    switch (key) {
        case "allshipments":
            action(key);
            break;
        case "pendingshipments":
            action(key);
            break;
        case "invoices":
            action(key);
            break;
        case "tsp":
            action(key);
            break;
        case "rates":
            action(key);
            break;
        default:
            break;
    }

}

function search(e){
    let searchText = searchBar.value;
    let argVal = searchArg.value;

    axios.post("/api/search", {
        data: currentTab,
        search: searchText,
        arg: argVal,
    }).then((response)=>{
        // console.log(response);
        clearTable();
        populateTable(response.data);
    })

}

main();