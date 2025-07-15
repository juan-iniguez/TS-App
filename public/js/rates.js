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


function addNewRateFolder(){

}