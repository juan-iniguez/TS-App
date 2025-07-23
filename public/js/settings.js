let cardTitle = document.getElementsByClassName('card-title');
let TSPYearsData;
let TSPYearsSelect=document.getElementById('tsp-year')
let tspExportYearCycle=document.getElementById('tsp-year-cycle');
let errorContainer = document.getElementById('error-container')
let errorMsg = document.getElementById("error-msg")

// * TSP SETTINGS START *
// Get TSP Years and set Select with options
axios.get('/api/tsp-get-year')
.then(res=>{
  TSPYearsData = res.data;
  for(let i of TSPYearsData){
    const option = document.createElement("option");
    const option_export = document.createElement("option");
    option.value = i;
    option.innerText = i;
    option_export.value = i;
    option_export.innerText = i;

    TSPYearsSelect.insertAdjacentElement('beforeend',option);
    tspExportYearCycle.insertAdjacentElement('beforeend', option_export);
  }
  const option_break = document.createElement("option");
  TSPYearsSelect.insertAdjacentElement('beforeend',option_break)
  option_break.innerText = "-------------";
  option_break.disabled=true;
  const option_new = document.createElement("option");
  option_new.innerText = `Add ${parseInt(TSPYearsData[TSPYearsData.length-1].split('-')[0])+1} Year Cycle...`;
  option_new.value = parseInt(TSPYearsData[TSPYearsData.length-1].split('-')[0])+1;
  option_new.addEventListener('click', TSPInsertNewYear);
  option_new.style = 'cursor:pointer;'
  TSPYearsSelect.insertAdjacentElement('beforeend',option_new);
  document.getElementById('current-tsp-year').innerText = (parseInt(TSPYearsData[TSPYearsData.length-1].split('-')[0])+1)+"-"+(parseInt(TSPYearsData[TSPYearsData.length-1].split('-')[0])+2);
})

for(let i of cardTitle){
  i.addEventListener('click', openCard)
}

function TSPInsertNewYear(e){
  const selectYearContainer = document.getElementById("select-year-container");
  const newYearContainer = document.getElementById('new-year-container');
  const modalTitleImportTSP = document.getElementById('modal-title-importTSP');
  selectYearContainer.hidden = true;
  newYearContainer.hidden = false;
  modalTitleImportTSP.innerText = "Add New " + this.value + " TSP List"
  // console.log(this);
  // console.log(e);
}

function openCard (e) {
  console.log(e)
  console.log(this.children[1])
  this.children[1].classList.toggle("open");
  let options = document.getElementById("options-" + this.id.split("card-")[1])
  options.classList.toggle("open");
}

// TODO: Get the CSV from ServerSide of all TSPs in the system
function exportTSP(){
  if(tspExportYearCycle.value == "Choose..."){errorHandling("Please select a year to Export a TSP list");return};
  window.open('/api/export-tsp?year='+tspExportYearCycle.value, '_blank').focus();
}

function errorHandling(msg){
  !errorContainer.classList.contains('active')?errorContainer.classList.toggle('active'):{};
  errorMsg.innerText = msg;
}

function hideErrorMsg(){
  errorContainer.classList.toggle('active');

}

function uploadTSP(){
  let action = "create"
  let formData = new FormData();
  let file = document.getElementById('tsp-upload-input');
  // console.log(file.files[0])
  formData.append("file", file.files[0]);
  // console.log(formData)
  if(file.files.length == 0){
    errorHandling("No Files have been inserted")
    return
  }else if(TSPYearsSelect.value=="Choose..."){
    errorHandling("Please select a Year")
    return    
  }
  
  const sel_year = document.getElementById('tsp-year').value;
  if(sel_year.includes('-')){action = 'update'}
  axios.post('/api/upload-tsp?year='+sel_year+"&action="+action,formData,{
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  .then(res=>{
    // console.log(res.status);
    successMsg("Successfully Uploaded TSP list! ✅");
    setTimeout(()=>{
      window.location.reload();
    },2000)
  })
  .catch(err=>{
    console.error(err);
  })
}

function successMsg(msg){
  !errorContainer.classList.contains('active')?errorContainer.classList.toggle('active'):{};
  errorContainer.classList.toggle("success");
  errorMsg.innerText = msg;
}

function resetModalImportTSP(){
  let selectYearContainer=document.getElementById("select-year-container");
  let newYearContainer=document.getElementById('new-year-container');
  let tspUploadInput=document.getElementById("tsp-upload-input");
  if(selectYearContainer.hidden == true){selectYearContainer.hidden = false};
  if(newYearContainer.hidden == false){newYearContainer.hidden = true};
  TSPYearsSelect.value="Choose..."
  tspUploadInput.value="";
}

function resetModalExportTSP(){
  tspExportYearCycle.value="Choose..."
}

// * RATES *

// let rateImportYear=document.getElementById('rate-year');
let exportRatesYearCycle=document.getElementById('rates-year-cycle');
let exportRatesYear=document.getElementById('export-rates-year');
let exportRatesQuarterly=document.getElementById('export-rates-quarterly');
let yearsRates = [];
let qRates = {};

let importRatesYearCycle=document.getElementById('i-rates-year-cycle');
let importRatesYear=document.getElementById('i-rates-year');
let importRatesQuarterly=document.getElementById("i-rates-quarterly");

function optionsGen(innerText,value,el){
  let option = document.createElement('option');
  option.innerText = innerText;
  option.value = value;
  el.insertAdjacentElement('beforeend', option);
  return option;
}

axios.get('/api/rates-get-year')
.then(res=>{
  // console.log(res.data);
  for(let i of res.data){
    let value = `${i.YEAR} ${i.QUARTER}`;

    // * Set up Export Rates Year Cycles * 
    if(!yearsRates.includes(i.YEAR)){
      yearsRates.push(i.YEAR);
      optionsGen(i.YEAR,i.YEAR,exportRatesYearCycle);
      qRates[i.YEAR]=[]
      // * Setup up Quarterly Export fields 
      optionsGen(i.YEAR,i.YEAR,exportRatesYear).addEventListener('click',selectQuarterlyYear);
    }
    qRates[i.YEAR].push(i.QUARTER); // Get Quarters from each year


    // * Set up Import Rates Year Cycles *
    optionsGen(i.YEAR,i.YEAR,importRatesYearCycle);
    
  }
  // New Rates Yearly import
  let options_break = document.createElement("option");
  options_break.innerText = "------------";
  options_break.disabled = true;
  importRatesYearCycle.insertAdjacentElement('beforeend',options_break);
  let options_new = document.createElement("option");
  options_new.innerText = `Add New Yearly Rates ${parseInt(res.data[res.data.length-1]["YEAR"].split('-')[0])+1}-${parseInt(res.data[res.data.length-1]["YEAR"].split('-')[0])+2}...`;
  importRatesYearCycle.insertAdjacentElement('beforeend',options_new);

})
.catch(err=>{
  console.error(err);
})

/*  
 * TODO: Import Rates by opening modal and selecting whether it is all rates, 
 * or just bunker rate. 
 * If All rates, select year and add the rates
 * If Bunker Rates only then select Quarter from Year and upload to that Years Quarter.
 * */

function selectQuarterlyYear(e){
  exportRatesQuarterly.innerHTML = ""
  let selectedOption = this.value;
  for(let i of qRates[selectedOption]){
    optionsGen(i,i,exportRatesQuarterly);
  }
}

function importRates(){

  let action = "create"
  let formData = new FormData();
  let quarter = document.getElementById("rates-quarter-input")
  let file = document.getElementById('rates-upload-input');
  formData.append("file", file.files[0]);
  if(file.files.length == 0){
    errorHandling("No Files have been inserted")
    return
  }

  // POST for uploading rates based on Year cycle and Quarter
  axios.post('/api/upload-rates?year='+sel_year+"&action="+action+"&quarter="+quarter,formData,{
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  .then(res=>{
    console.log(res.status);
  })
  .catch(err=>{
    console.error(err);
  })
};

function exportRates(){
  
  const year=exportRatesYearCycle.value;
  const quarter=document.getElementById('export-rates-quarterly').value;
  const currentTab=document.getElementsByClassName('nav-link active')[0].id.split('-')[0];

  console.log(currentTab);

  if(currentTab=='yearly'){
    if(exportRatesYearCycle.value == "Choose..."){errorHandling("Please select a year to export Yearly Rates");return};
    
    window.open('/api/export-rates?year='+year, '_blank').focus();    
  }else{
    if(exportRatesYear.value == "Choose..." || exportRatesQuarterly.value == "Choose..."){errorHandling("Please select a year and quarter to export Rates");return};
    
    window.open('/api/export-rates?year='+exportRatesYear.value+'&quarter='+quarter, '_blank').focus();
  }
}

function resetModalExportRates(){
  exportRatesYearCycle.value = "Choose...";
  exportRatesQuarterly.innerHTML = "<option disabled selected>Choose Year First...</option>";
  exportRatesYear.value = "Choose..."
}

resetModalExportRates()

function resetModalImportRates(){}




