import axios from 'axios';

// Cached Token
/**
 * (SCOPE, {time, token})
 */
let token_now = new Map();

export const oauth = {
  getTokenInv: getTokenInv,
}

function getTokenInv(scope:string){
  return new Promise((resolve,reject)=>{
      if(token_now.get(scope) === undefined){token_now.set(scope, {token:"", time:0})}
      if((token_now.get(scope).time + 300000) > Date.now()){
        resolve(token_now.get(scope).token);
      }
      let params = new URLSearchParams();
      params.append('grant_type','client_credentials')
      params.append('client_id',process.env.APL_CLIENT_ID!)
      params.append('client_secret',process.env.APL_CLIENT_SECRET!)
      params.append('scope', scope)
    
      axios.post('https://auth.cma-cgm.com/as/token.oauth2', params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
      }).then(response=>{
        token_now.set(scope,{token:response.data["access_token"], time: Date.now()});
        resolve(response.data["access_token"])
        // console.log(response.data["access_token"]);
      }).catch(err=>{
        reject(err);
        console.error(err);
      })
  })
}