import jwt from 'jsonwebtoken'
const JWT_SECRET = "grins";
export function middleware (req,res,next){
    console.log(req.headers);
    if(!req.headers.token){
        res.send({
            msg:"Token not present"
        })
        return ;
    }
    const token= req.headers.token;

    try{
        const data = jwt.verify(token,JWT_SECRET)
        if(typeof data === 'object'){
            req.email = data.email;
            req.id = data.id
            next();
        }
    }catch(e){
        res.send({
            msg:e
        })
        return;
    }
}