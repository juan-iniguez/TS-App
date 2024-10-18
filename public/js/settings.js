let cardTitle = document.getElementsByClassName('card-title');

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
  window.open('/api/export-tsp', '_blank').focus();
}

let errorContainer = document.getElementById('error-container')
let errorMsg = document.getElementById("error-msg")
function errorHandling(msg){
  !errorContainer.classList.contains('active')?errorContainer.classList.toggle('active'):{};
  errorMsg.innerText = msg;
}

function hideErrorMsg(){
  errorContainer.classList.toggle('active');

}

function uploadTSP(){
  let formData = new FormData();
  let file = document.getElementById('tsp-upload-input');
  // console.log(file.files[0])
  formData.append("file", file.files[0]);
  // console.log(formData)
  if(file.files.length == 0){
    errorHandling("No Files have been inserted")
    return
  }
  
  axios.post('/api/upload-tsp', formData,{
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
}

/*  
 * TODO: Import Rates by opening modal and selecting whether it is all rates, 
 * or just bunker rate. 
 * If All rates, select year and add the rates
 * If Bunker Rates only then select Quarter from Year and upload to that Years Quarter.
 * */
function importRates(){}
