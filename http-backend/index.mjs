import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cors from 'cors'
const app = express();
app.use(express.json())
app.use(cors())
import { prisma } from './prisma/client.js'
import { middleware } from './middleware.mjs';
const JWT_SECRET = "grins";
app.post("/signup",async (req,res)=>{
    const data = req.body;
    const result = data;
    console.log("signup");
    console.log(result);
    if(result){
        try{
            const type = data.type;
            if(type==undefined){
                if(!result.data.password) return;
                result.data.password = await bcrypt.hash(result.data.password,5); 
                const dbRes = await prisma.user.create({
                    data:result
                })
                res.send({
                    msg:dbRes
                })
            }else{
                const dbRes = await prisma.user.create({
                    data:{
                        name:data.name,
                        email:data.email,
                        type:data.type,
                        photo:data.photo
                    }
                })
                const token = jwt.sign({
                    email:dbRes.email,
                    id:dbRes.id
                },JWT_SECRET)
                console.log(token)
                //@ts-ignore
                dbRes.token = token;
                res.send({
                    msg:dbRes
                })
            }

        }catch(e){
            res.status(205).send({
                msg:e
            })
        }
    }else{
        res.status(205).send({
            msg:result.error
        })
    }
})
app.post("/signin",async  (req,res)=>{
    const data1 = req.body;
    const result = {
        data:""
    }
    result.data = data1;

    if(result){
        try{
            const resdb = await prisma.user.findUnique({
                where:{
                    email:result.data.email
                }
            })
            console.log(resdb);
            if(resdb==null){
                res.status(205).send({
                    msg:"User not found"
                })
                console.log("return") 
                return;
            }
            if(resdb.type=="provider"){
                const token = jwt.sign({
                    email:resdb.email,
                    id:resdb.id
                },JWT_SECRET)
                console.log(token);
                res.send({
                    msg:{
                        token:token,
                        userId:resdb.id,
                        name:resdb.name,
                        email:resdb.email
                    }
                })
                console.log("return") 
                return;
            }
            if(!result.data.password){
                console.log("return") 
                return;
            } 
            if(!resdb.password){
                console.log("return") 
                return;
            }
            const passResult = await bcrypt.compare(result.data.password,resdb.password);
            if(passResult){
                const token = jwt.sign({
                    email:resdb.email,
                    id:resdb.id
                },JWT_SECRET)
                res.send({
                    msg:{
                        token:token,
                        userId:resdb.id,
                        name:resdb.name,
                        email:resdb.email
                    }
                })
                console.log("return");
                return
            }else{
                res.status(205).send({
                    msg:"login failed"
                })
                console.log("return");
                return
            }
        }catch(e){
            res.status(205).send({
                msg:e
            })
            console.log("return");
            return
        }
    }else{
        res.status(205).send({
            msg:"failed"
        })
        console.log("return");
        return;
    }
})


app.post("/data",middleware,async (req,res)=>{
    console.log("data");
    res.json({
        balance: 12450.75,
        monthlyIncome: 5000,
        monthlyExpenses: 3200,
        savings: 1800,
        budgets: [
          { category: 'Housing', amount: 1500, spent: 1450, color: 'bg-blue-500' },
          { category: 'Food', amount: 600, spent: 520, color: 'bg-green-500' },
          { category: 'Transport', amount: 400, spent: 385, color: 'bg-yellow-500' },
          { category: 'Entertainment', amount: 300, spent: 250, color: 'bg-purple-500' }
        ],
        recentTransactions: [
          { id: 1, description: 'Grocery Store', amount: -120.50, date: '2024-03-15', type: 'expense' },
          { id: 2, description: 'Salary Deposit', amount: 5000.00, date: '2024-03-14', type: 'income' },
          { id: 3, description: 'Restaurant', amount: -85.20, date: '2024-03-13', type: 'expense' },
          { id: 4, description: 'Utilities', amount: -200.00, date: '2024-03-12', type: 'expense' }
        ]
    })
})

app.listen(3001,()=>{
    console.log("done")
})