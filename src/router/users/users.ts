import express from "express";
const router = express.Router();
import { verifyToken, apiAuthCheck } from '../../auth/verifyToken';
router.use(verifyToken);
router.use(apiAuthCheck);

router.get('/management',(req:any,res:any,next)=>{
    res.render('pages/userManagement', req.user);
})

module.exports = router;
