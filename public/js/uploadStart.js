
let invInput = document.getElementById('inv-field');
let errorCont = document.getElementsByTagName('error')[0];

invInput.addEventListener('keyup',invInputAction);

function invInputAction(e){
  char_san()
  ERROR_CLEAR();
}

function char_san(){
  let regexp = /^[A-Za-z0-9]*$/;
  if(!regexp.test(invInput.value)){
    invInput.value = invInput.value.slice(0, invInput.value.length-1);
  }



}

function validateInput(){
  return invInput.value?invInput.value:ERROR_HANDLE({status:404,msg:"Please enter an Invoice Number"});
}

function ERROR_HANDLE(error){
  console.error(error.status, error.msg);

  let status = errorCont.children[1].children[0];
  let msg = errorCont.children[1].children[1];

  status.innerText = error.status;
  msg.innerText = error.msg;

  errorCont.classList.contains('hidden')?errorCont.classList.toggle('hidden'):{};
}

function ERROR_CLEAR(){
  errorCont.classList.contains('hidden')?{}:errorCont.classList.toggle('hidden');
}

function sendReq(){
  
  if(invInput.value == ""){
    ERROR_HANDLE({status:"Missing Invoice Number", msg:"Please type an Invoice Number"})
    return;
  }

  axios.post(`/api/apl/inv/${invInput.value}`, {
    peek: true,
  })
  .then(response=>{
    console.warn(response?.data);
    if(response.data?.status === "OK"){
      console.log('YAY!')
      window.location.href = window.location.origin + `/upload/details/${response.data.invoice_number}`
    }else{
      let err = {
        status: response.data?.reason,
        msg: response.data?.description,
      }
      ERROR_HANDLE(err)
    }
  })
  .catch(err=>{
    ERROR_HANDLE({status:"Something went wrong...", msg:err});
    console.error(err);
  })

}

function showAPIOption(){
  let apiOption = document.getElementById("api-option");
  let section_options = document.getElementById("options");

  apiOption.hidden = false;
  section_options.hidden = true;


}