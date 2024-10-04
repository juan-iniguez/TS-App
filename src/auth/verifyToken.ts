import jwt from 'jsonwebtoken';

export const verifyToken = (req:any, res:any, next:any) => {

    let action = ()=>{   
        req.user = undefined;
        next()
    }

    // console.log(req);
    const token = req.headers['cookie'];
    if (!token) {
        // return res.status(401).json({ error: 'Unauthorized' });
        // Middleware for JWT validation
        console.log("HMM",token);
        return action();
    }

    // console.log("HELLO",token.split('XSRF-TOKEN=')[1])

    jwt.verify(token.split('XSRF-TOKEN=')[1], process.env.JWT_SECRET!, (err:any, decoded:any) => {
        if (err) {
        // return res.status(401).json({ error: 'Unauthorized' });
            return action();
        }
        req.user = decoded;
        next();
    });
};

export const apiAuthCheck = (req:any, res:any, next:any) => {
    console.warn("HERES THE USER")
    console.log(req.user);
    if(!req.user){res.redirect('/login')}else{
        next();
    }
};