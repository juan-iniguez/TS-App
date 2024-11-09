
let invInput = document.getElementById('inv-field');

function ERROR_HANDLE(error){

}

function sendReq(){
  
  axios.post(`/api/apl/inv/${invInput.value}`, {
    peek: true,
  })
  .then(response=>{
    console.warn(response?.data);
    if(response.data?.status === "OK"){
      console.log('YAY!')
      window.location.href = window.location.origin + `/upload/details/${response.data.invoice_number}`
    }else if(response.data?.error){
      console.error(response.data.error);
    }
  })
  .catch(err=>{
    console.error(err);
  })

}