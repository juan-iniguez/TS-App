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
        // console.log(res);
        if(res.status == 200){window.location.href = '/'}
    })
    .catch(err=>{
        console.error(err.message, err.response.status);
    })
}