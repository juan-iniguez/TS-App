/** Essentials */
let errorContainer = document.getElementById('error-container')
let errorMsg = document.getElementById("error-msg")
let yearSelection = document.getElementById("year-selection");

function errorHandling(msg){
  !errorContainer.classList.contains('active')?errorContainer.classList.toggle('active'):{};
  errorMsg.innerText = msg;
}

function hideErrorMsg(){
  errorContainer.classList.toggle('active');
}

yearSelection.addEventListener('input', (e)=>{
  var c = this.selectionStart,
      r = /[^0-9]/gi,
      v = yearSelection.value;
  if(r.test(v)) {
    yearSelection.value = v.replace(r, '');
    c--;
  }

  /* Insert Search Lookup? */

})

/** Main Javascript */

