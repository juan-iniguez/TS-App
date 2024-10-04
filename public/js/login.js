const userEmail = document.getElementById('user-email');
const userPassword = document.getElementById('user-password');

function login(){
    // POST - API get JWT token.
    let userSubmission = {
        email: userEmail.value,
        password: userPassword.value,
    }

    axios.post('/api/login',userSubmission)
    .then(res=>{
        if(res.status == 200){window.location.href = '/'}
        console.log(res.status);
    })
    .catch(err=>{
        console.error(err.message, err.response.status);
    })
}