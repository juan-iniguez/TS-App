/** Essentials */
let errorContainer = document.getElementById('error-container')
let errorMsg = document.getElementById("error-msg")
let yearSelection = document.getElementById("year-selection-input");
let rateYearsSelectionContainer = document.getElementById('rate-years-selection');
let btnAddRateFolder = document.getElementById("btn-add-folder");
let modalContainer = document.getElementById('rates-modal');

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
      this.quarter = quarter;
    }
    
    get createFolder(){
      const attYear= document.createAttribute("data-yearRate"),
      attQuarter = document.createAttribute("data-quarterRate");
      attYear.value = this.year;
      attQuarter.value = this.quarter;
      let el = document.createElement(this.type);
      el.className = this.className;
      el.innerHTML = `<p>${this.year}</p><p>${this.quarter}</p>`;
      el.addEventListener('click',selectRateFolder);
      el.setAttributeNode(attYear);
      el.setAttributeNode(attQuarter);
      // Color of folder is based on the year
      el.style = `filter: hue-rotate(${parseInt(stringToHex(this.year), 16)}deg)`
      return el;
    }

    yearAndQuarter(year,quarter){
      this.year = year;
      this.quarter = quarter;
    }
  }

  for(n of data){
    console.log(n);
    const rateFolder = new folder(n.YEAR, n.QUARTER);
    btnAddRateFolder.insertAdjacentElement("afterend",rateFolder.createFolder);
  }
}

function selectRateFolder(){
  console.table({YearRate: this.attributes["data-yearrate"].value,QuarterRate:this.attributes["data-quarterrate"].value});
  // console.log(this.attributes["data-quarterrate"].value);
  modalContainer.classList.toggle('clear');
  setTimeout(()=>{
    modalContainer.remove()
    populateRateTable()
  },300);
}

const modalHeader = document.getElementById("modal-header"),
modalBody = document.getElementById("modal-body"),
modalFooter = document.getElementById("modal-footer");

function toggleClearModal(){
  modalHeader.classList.toggle("clear")
  modalBody.classList.toggle("clear")
  modalFooter.classList.toggle("clear")
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
    <input placeholder="XXXX" type="number" id="rate-year" maxlength="4"><select id="input-quarter">
    <option value="Q1">Q1</option>
    <option value="Q2">Q2</option>
    <option value="Q3">Q3</option>
    <option value="Q4">Q4</option>
    </select>
    <p id="rate-name" class="rate-name"></p>
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
      }
      if(e.target.value.length == 4){
        updateRateName();
      }
    })
    document.getElementById('input-quarter').addEventListener('input',(e)=>{
      if(document.getElementById('rate-year').value.length == 4){
        updateRateName();
      }
    })
  },300)
}

// Update the text in the rate name preview
function updateRateName(){
  const year = document.getElementById('rate-year').value;
  const inputQuarter = document.getElementById('input-quarter').value
  const rateName = document.getElementById('rate-name');
  rateName.innerText = `${year}-${parseInt(year)+1} ${inputQuarter}`
  if(!rateName.classList.contains('display') && year.length > 0){
    rateName.classList.toggle('display')
  }
}

function checkRateFields(){
  const year = document.getElementById('rate-year');
  const quarter = document.getElementById('input-quarter');
  const file = document.getElementById('input-rate-file');
  if(year.value.length == 4 && quarter.value != null && file.files.length == 1){
    try {
      csvCompatibilityCheck(year.value, quarter.value, file.files[0]);
      // populateRateTable();
    } catch (error) {
      console.error(error);
    }
  }else{
    if(year.value.length != 4){
      // ! CASE
    }else if(quarter.value == null){
      // ! CASE
    }else if(file.files.length != 1){
      // ! CASE
    }
  }
}

// This will send a POST request to check with the DB if the CSV and Year/Qtr
// are compatible.
function csvCompatibilityCheck(year, quarter, file){
  axios.post("/api/rates/csv-compatibility", {
    year: `${year}-${parseInt(year)+1}`,
    quarter: quarter,
    file: file,
  })
  .then((res)=>{
    console.log(res);
  })
  .catch((err)=>{
    console.log(err);
  })
}

// When you click a folder this will populate the table with the rates
function populateRateTable(){

  // populate rate table

  // if statement to switch between "Adding new rates" and
  // Viewing older rates.


}
