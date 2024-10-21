let cardTitle = document.getElementsByClassName('card-title');
let TSPYearsData;
let TSPYearsSelect=document.getElementById('tsp-year')
let tspExportYearCycle=document.getElementById('tsp-year-cycle');
let errorContainer = document.getElementById('error-container')
let errorMsg = document.getElementById("error-msg")

// Get TSP Years and set Select with options
axios.get('/api/tsp-get-year').then(res=>{
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

for(let i of cardTitle){
  console.log(i)
  i.addEventListener('click', openCard)
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
    console.log(res.status);
    // window.location.reload();
  })
  .catch(err=>{
    console.error(err);
  })
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

/*  
 * TODO: Import Rates by opening modal and selecting whether it is all rates, 
 * or just bunker rate. 
 * If All rates, select year and add the rates
 * If Bunker Rates only then select Quarter from Year and upload to that Years Quarter.
 * */
function importRates(){}
