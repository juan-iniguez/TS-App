import express from "express";
const router = express.Router();
import { verifyToken, apiAuthCheck } from '../../auth/verifyToken';
router.use(verifyToken);
router.use(apiAuthCheck);



router.get("/tsp", (req:any,res,next)=>{
    res.render("pages/settings/tsp", req.user)
})

router.get("/rates", (req:any,res,next)=>{
    res.render("pages/settings/rates", req.user)
})

module.exports = router;