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
                res.send({
                    msg:{
                        token:token,
                        userId:resdb.id,
                        name:resdb.name,
                        email:resdb.email
                    }
                })
                return;
            }
            if(!result.data.password){
                return;
            } 
            if(!resdb.password){
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
app.post("/data", middleware, async (req, res) => {
    const { balance, monthlyIncome, monthlyExpenses, AdminId } = req.body;

    try {
        const dbResData = await prisma.data.create({
            data: {
                balance,
                monthlyIncome,
                monthlyExpenses,
                AdminId
            }
        });

        res.json({
            msg: "Data saved successfully",
            data: dbResData
        });
    } catch (e) {
        res.status(500).json({
            msg: "Error saving data",
            error: e.message
        });
    }
});

app.post("/expenses", middleware, async (req, res) => {
    const expenses = req.body.expenses.map(expense => ({
        amount: parseInt(expense.amount),
        color: expense.color,
        spent: parseInt(expense.spent),
        category: expense.category,
        adminId: req.id
    }));

    try {
        const dbResExpenses = await prisma.expense.createMany({
            data: expenses
        });

        res.json({
            msg: "Expenses saved successfully",
            expenses: dbResExpenses
        });
    } catch (e) {
        res.status(500).json({
            msg: "Error saving expenses",
            error: e.message
        });
    }
});

app.post("/transactions", middleware, async (req, res) => {
    const transactions = req.body.transactions.map(transaction => ({
        description: transaction.description,
        amount: parseFloat(transaction.amount), // Change amount to float
        date: new Date(transaction.date).toISOString(), // Ensure date is in ISO-8601 format
        type: transaction.type,
        adminId: req.id
    }));
    try {
        const dbResTransactions = await prisma.transaction.createMany({
            data: transactions
        });

        res.json({
            msg: "Transactions saved successfully",
            transactions: dbResTransactions
        });
    } catch (e) {
        res.status(500).json({
            msg: "Error saving transactions",
            error: e.message
        });
    }
});


app.get("/data", middleware, async (req, res) => {
    try {
        const data = await prisma.data.findMany({
            where: {
                AdminId: req.id
            }
        });
        res.json(data[0]);
    } catch (e) {
        res.status(500).json({
            msg: "Error fetching data",
            error: e.message
        });
    }
});

app.get("/expenses", middleware, async (req, res) => {
    try {
        const expenses = await prisma.expense.findMany({
            where: {
                adminId: req.id
            }
        });
        res.json(expenses);
    } catch (e) {
        res.status(500).json({
            msg: "Error fetching expenses",
            error: e.message
        });
    }
});

app.get("/transactions", middleware, async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                adminId: req.id
            }
        });
        res.json(transactions);
    } catch (e) {
        res.status(500).json({
            msg: "Error fetching transactions",
            error: e.message
        });
    }
});
app.put("/data/:id", middleware, async (req, res) => {
    try {
      const { balance, monthlyIncome, monthlyExpenses, savings } = req.body;
      
      // Validate the numbers
      const validatedData = {
        balance: Number(balance) || 0,
        monthlyIncome: Number(monthlyIncome) || 0,
        monthlyExpenses: Number(monthlyExpenses) || 0,
        savings: Number(savings) || 0
      };
  
      const updatedData = await prisma.userData.update({
        where: {
          id: parseInt(req.params.id)
        },
        data: validatedData
      });
  
      res.json({
        msg: "Data updated successfully",
        data: updatedData
      });
    } catch (e) {
      res.status(500).json({
        msg: "Error updating data",
        error: e.message
      });
    }
  });

app.put("/expenses/:id", middleware, async (req, res) => {
    const { id } = req.params;
    req.body.amount = parseInt(req.body.amount);
    req.body.spent = parseInt(req.body.spent);
    const { category, amount, spent, color, adminId } = req.body;


    try {
        const dbResExpense = await prisma.expense.update({
            where: { id: id },
            data: {
                category,
                amount,
                spent,
                color,
                adminId
            }
        });

        res.json({
            msg: "Expense updated successfully",
            expense: dbResExpense
        });
    } catch (e) {
        res.status(500).json({
            msg: "Error updating expense",
            error: e.message
        });
    }
});
// Add this new endpoint after your existing endpoints
app.get("/user-data", middleware, async (req, res) => {
    try {
        const userData = await prisma.user.findUnique({
            where: {
                id: req.id
            },
            include: {
                data: true,
                expenses: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                trans: {
                    orderBy: {
                        date: 'desc'
                    }
                }
            }
        });

        if (!userData) {
            return res.status(404).json({
                msg: "User not found"
            });
        }

        // Convert string numbers to actual numbers for financial data
        const financialData = userData.data ? {
            balance: parseFloat(userData.data.balance) || 0,
            monthlyIncome: parseFloat(userData.data.monthlyIncome) || 0,
            monthlyExpenses: parseFloat(userData.data.monthlyExpenses) || 0,
            AdminId: userData.data.AdminId
        } : null;

        // Format expenses to ensure consistent number types
        const formattedExpenses = userData.expenses.map(expense => ({
            ...expense,
            amount: Number(expense.amount),
            spent: Number(expense.spent)
        }));

        // Format transactions to ensure consistent number types
        const formattedTransactions = userData.trans.map(transaction => ({
            ...transaction,
            amount: Number(transaction.amount)
        }));

        res.json({
            user: {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                photo: userData.photo
            },
            data: financialData,
            expenses: formattedExpenses,
            transactions: formattedTransactions
        });

    } catch (e) {
        console.error("Error in /user-data:", e);
        res.status(500).json({
            msg: "Error fetching user data",
            error: e.message
        });
    }
});

app.put("/transactions/:id", middleware, async (req, res) => {
    const { id } = req.params;
    const { description, amount, date, type, adminId } = req.body;

    try {
        const dbResTransaction = await prisma.transaction.update({
            where: { id: parseInt(id) },
            data: {
                description,
                amount,
                date,
                type,
                adminId
            }
        });

        res.json({
            msg: "Transaction updated successfully",
            transaction: dbResTransaction
        });
    } catch (e) {
        res.status(500).json({
            msg: "Error updating transaction",
            error: e.message
        });
    }
});



app.listen(3001,()=>{
    console.log("done")
})
