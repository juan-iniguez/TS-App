
/** Essentials */
let errorContainer = document.getElementById('error-container')
let errorMsg = document.getElementById("error-msg")
let yearSelection = document.getElementById("year-selection-input");
let rateYearsSelectionContainer = document.getElementById('rate-years-selection');
let btnAddRateFolder = document.getElementById("btn-add-folder");
let btnCancel = document.getElementById('btn-cancel')
let btnConfirm = document.getElementById('btn-confirm')
let modalContainer = document.getElementById('rates-modal');
let tableData;

function errorHandling(msg){
  !errorContainer.classList.contains('active')?errorContainer.classList.toggle('active'):{};
  errorMsg.innerText = msg;
}

function hideErrorMsg(){
  errorContainer.classList.toggle('active');
}

function onlyNumbers(e){
    if(e.data==null){return};
    noSpaces(e);
    if((e.data).match(/[^0-9]/g)){
        console.log("HMM")
        e.target.value = e.target.value.slice(0,-1)
    }
}

function noSpaces(e){
    e.data == " "?e.target.value = e.target.value.slice(0,-1):{};
}

yearSelection.addEventListener('input', (e)=>{
  // Prevent default behavior and allow only numbers to be typed.
  var c = this.selectionStart,
      r = /[^0-9]/gi,
      v = yearSelection.value;
  if(r.test(v)) {
    yearSelection.value = v.replace(r, '');
    c--;
  }

  /* Insert Search Lookup? */




})

function stringToHex(str) {
  let hexString = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i); // Get the Unicode code point of the character
    const hexValue = charCode.toString(16); // Convert the code point to a hexadecimal string
    
    // Pad with a leading zero if the hex value is a single digit (e.g., 'A' instead of '0A')
    hexString += hexValue.padStart(2, '0'); 
  }
  return hexString;
}

btnAddRateFolder.addEventListener("click", addNewRateFolder);

btnConfirm.addEventListener('click', submitRates);

btnCancel.addEventListener('click', ()=>{
  window.location.replace('/rates');
})

/** Main Javascript */

axios.get(`/api/rates-get-year`).then(res=>{
  if(res.status == 200 ){
    // Debugging
    console.info("%cRate Years Currently in the system", "color:#9cff0c;font-size:2em;font-weight:bold")
    console.table(res.data)

    populateRateFolders(res.data)

  }
}).catch(err=>{
    console.log(err);
})

function populateRateFolders(data){
  class folder{
    constructor(year, quarter){
      this.className = "rates-folder";
      this.type = "a";
      this.year = year;
    }
    
    get createFolder(){
      const attYear= document.createAttribute("data-yearRate"),
      attQuarter = document.createAttribute("data-quarterRate");
      attYear.value = this.year;
      attQuarter.value = this.quarter;
      let el = document.createElement(this.type);
      el.className = this.className;
      el.innerHTML = `<p>${this.year}</p>`;
      el.addEventListener('click',selectRateFolder);
      el.setAttributeNode(attYear);
      el.setAttributeNode(attQuarter);
      // Color of folder is based on the year
      el.style = `filter: hue-rotate(${parseInt(stringToHex(this.year), 16)}deg)`
      return el;
    }

    year(year){
      this.year = year;
    }
  }

  for(n of data){
    const rateFolder = new folder(n.YEAR);
    btnAddRateFolder.insertAdjacentElement("afterend",rateFolder.createFolder);
  }
}

function selectRateFolder(){
  console.table({YearRate: this.attributes["data-yearrate"].value});
  setTimeout(()=>{    
    axios.get(`/api/rates-get/${this.attributes["data-yearrate"].value}`)
    .then(res=>{
      console.log(res);
      populateRateTable(res.data, 0);
    })
  },300);
}

const modalHeader = document.getElementById("modal-header"),
modalBody = document.getElementById("modal-body"),
modalFooter = document.getElementById("modal-footer");

// To transition between modal options
function toggleClearModal(){
  modalHeader.classList.toggle("clear")
  modalBody.classList.toggle("clear")
  modalFooter.classList.toggle("clear")
}

// To clear and delete modal
function toggleRemoveModal(){
  let rateModal = document.getElementById('rates-modal');
  rateModal.classList.toggle('clear');
  setTimeout(()=>{
    rateModal.remove();
    document.getElementsByClassName('focused')[0].classList.toggle('focused');
  },300)
}

// When you click the plus sign this will prompt the next modal 
// for adding new rates using a .CSV
function addNewRateFolder(){
  toggleClearModal();
  setTimeout(()=>{
    toggleClearModal()
    // Header
    modalHeader.innerHTML = `<h1>Add New Rates</h1>`
    modalBody.innerHTML = "";
    modalFooter.innerHTML= "";
    
    const instructions = document.createElement('p');
    instructions.innerText = "Please type the Year and select a Quarter. Then upload a .CSV file with the new rates."
    modalBody.appendChild(instructions);
    const form = document.createElement('div');
    form.innerHTML = `<div class="container-ratefile-input">
    <label id="label-input-rateyear" for="rate-year">Year</label>
    <input placeholder="XXXX" type="number" id="rate-year" maxlength="4">
    </div>
    <input id="input-rate-file" type="file" class="input-rate-file" accept=".csv">`;

    form.className = "container-form-ratefile"
    modalBody.appendChild(form);

    const btnPreview = document.createElement('a');
    btnPreview.className = 'btn-preview';
    btnPreview.innerText = "Preview"
    modalFooter.appendChild(btnPreview);
    btnPreview.addEventListener('click', checkRateFields);


    document.getElementById('rate-year').addEventListener('input',(e)=>{
      onlyNumbers(e)
      if(e.target.value.length == 5){
        e.target.value = e.target.value.slice(0,-1);
        return
      }
      if(e.target.value.length == 4){
        btnPreview.classList.toggle("enable");
      }
      if(e.target.value.length < 4 && btnPreview.classList.contains('enable')){
        btnPreview.classList.toggle("enable");
      }
    })
  },300)
}


function checkRateFields(){
  const year = document.getElementById('rate-year');
  const file = document.getElementById('input-rate-file');
  if(!this.classList.contains('enable')){
    console.log("Not ready");
    return
  };
  if(year.value.length == 4 && file.files.length == 1){
    try {
      csvCompatibilityCheck(year.value, file.files[0]);
    } catch (error) {
      console.error(error);
    }
  }else{
    if(year.value.length != 4){
      // ! CASE
    }else if(file.files.length != 1){
      // ! CASE
    }
  }
}

// This will send a POST request to check with the DB if the CSV and Year/Qtr
// are compatible.
function csvCompatibilityCheck(year, file){
  let formData = new FormData();
  formData.append("file", file);

  axios.post("/api/rates/csv-compatibility/" + year,formData,{
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  .then((res)=>{
    populateRateTable(res.data, 1);
    tableData = res.data;
  })
  .catch((err)=>{
    console.log(err);
  })
}


// When you click a folder this will populate the table with the rates
function populateRateTable(data, viewingState){

  const fields = ["ORIGIN", "DESTINATION", "CONT_SIZE", "OCF", "THC_USA", "Guam_THC", "AMS", "RAIL", "ISIF"]

  const rateTable = document.getElementById("rate-table")
  // populate rate table
  // if statement to switch between "Adding new rates" and
  // Viewing older rates.
  // bool `viewingState` is the variable that contains the switch between
  // Adding New Rates, or Viewing old rates. (1 or 0 respectively)
  class rateRow{
    constructor(data){
      this.ORIGIN = data.$ORIGIN || data.ORIGIN
      this.DESTINATION = data.$DESTINATION || data.DESTINATION
      this.CONT_SIZE = data.$CONT_SIZE || data.CONT_SIZE
      this.OCF = data.$OCF || data.OCF || 0


      this.THC_USA = data.$THC_USA || data.THC_USA || 0
      this.Guam_THC = data.$Guam_THC || data.Guam_THC || 0
      this.AMS = data.$AMS || data.AMS || 0
      this.RAIL = data.$RAIL || data.RAIL || 0
      this.ISIF = data.$ISIF || data.ISIF || 0
      this.YEAR = data.$YEAR || data.YEAR || 0
      this.DATE_CREATED = data.$DATE_CREATED || data.DATE_CREATED || 0
    }

    createRowElement(table){
      const row = document.createElement('tr');
      for(n of fields){
        let td = document.createElement('td')
        let input = document.createElement('input');
        td.appendChild(input)
        if(typeof this[n] == "number"){
          td.className = "cell rate-number"
          input.className = "rate-number";
          input.disabled = true;
          n == 'CONT_SIZE'?input.style = 'text-align:center':input.style = 'text-align:right';
          input.value = this[n].toLocaleString('en-US');
        }else{
          input.disabled = true;
          td.className = "cell rate-string"
          input.className = "rate-string";
          input.value = this[n];
        }
        row.appendChild(td);
      }
      table.appendChild(row)
    }
  }

  function createHeaderRow(table){
    const row = document.createElement('tr');
    for(n of fields){
      const td = document.createElement('th')
      td.innerText = n;
      td.className = "cell";
      row.appendChild(td);
    }
    table.appendChild(row);
  }

  createHeaderRow(rateTable);
  for(i of data){
    let testRow = new rateRow(i);
    testRow.createRowElement(rateTable);
  }

  toggleClearModal();
  toggleRemoveModal();
  if(viewingState){
    showBtnsConfirm(data[0].$YEAR, viewingState);
  }else{
    showBtnsConfirm(data[0].YEAR, viewingState);
    // What else to do if its just watching rates?
    // Show Editing Buttons?
    // Export buttons
  }
}

function showBtnsConfirm(year ,state){
  const confirmation = document.getElementById('container-confirmation');
  const subheader = document.getElementById('subheader-table');
  const confirmDiv = document.getElementById('btns-confirm');
  const updateDiv = document.getElementById('btns-update');
  subheader.innerText = `${year}-${year+1} Rate Cycle`
  confirmation.hidden = false;
  
  if(!state){
    confirmDiv.hidden = true;
    updateDiv.hidden = false;
  }  
}

// Final function to submit rates
function submitRates(){
  console.log("MOO")
  console.table(tableData)

  axios.post('/api/upload-rates',tableData)
  .then((res)=>{
    console.log(res);
    window.location.replace("/rates");
  })
  .catch(err=>{
    console.error(err);
  })
}