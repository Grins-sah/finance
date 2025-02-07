"use client"
import React, { useEffect, useState } from 'react';
import { signIn,signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { 
  Wallet, 
  PieChart, 
  TrendingUp, 
  DollarSign,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  Target
} from 'lucide-react';
import { RecoilBridge, useRecoilValue } from 'recoil';
import { userData, userDataAtom } from '../atoms/financeAtom';
import { headers } from 'next/headers';



function StatCard({ title, amount, icon: Icon, trend }) {
    
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="ml-3 text-gray-600 font-medium">{title}</h3>
        </div>

      
      </div>
      <p className="text-2xl font-bold text-black">₹{amount.toLocaleString()}</p>
    </div>
  );
}

function BudgetProgress({ category, amount, spent, color }) {
  const percentage = (spent / amount) * 100;
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-600">{category}</span>
        <span className="text-sm font-medium text-gray-600">
          ${spent} / ${amount}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}


function MainHeader({financialData}){
  
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <StatCard 
    title="Total Balance" 
    amount={financialData.balance} 
    icon={DollarSign}
  />
  <StatCard 
    title="Monthly Income" 
    amount={financialData.monthlyIncome} 
    icon={TrendingUp}
  />
  <StatCard 
    title="Monthly Expenses" 
    amount={financialData.monthlyExpenses} 
    icon={CreditCard}
  />
  <StatCard 
    title="Total Savings" 
    amount={financialData.savings} 
    icon={Target}
  />
</div>
}

function TransactionItem({ description, amount, date, type }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center">
        {type === 'income' ? (
          <ArrowUpCircle className="w-8 h-8 text-green-500" />
        ) : (
          <ArrowDownCircle className="w-8 h-8 text-red-500" />
        )}
        <div className="ml-4">
          <p className="font-medium text-gray-900">{description}</p>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
      </div>
      <span className={`font-medium ${type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
        {type === 'income' ? '+' : '-'}${Math.abs(amount).toLocaleString()}
      </span>
    </div>
  );
}
function Home() {
  const session = useSession();
  const [financialData,setData] = useState({
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
});
  const token = localStorage.getItem("token");
  useEffect(()=>{

    async function fetch(){
      console.log("start")
      console.log(token);
      const res = await axios.post(`http://localhost:3001/data`,{},{
        headers:{
          token:token
        }
      })
    console.log("end")
    console.log(res);
    setData(res.data);

    }
  fetch();
  
  },[])
  console.log(session.data?.user?.image)
    
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="w-8 h-8 text-blue-600" />
              <h1 onClick={()=>{
                window.open("http://localhost:3000/","_self")
              }} className="ml-3 text-2xl font-bold text-gray-900 cursor-pointer">Financial Dashboard</h1>
            </div>
            <div className='flex'>
              <button className="px-4 py-2 text-black rounded-lg  transition-colors">
                details
              </button>
              <button className="px-4 py-2 text-black rounded-lg  transition-colors">
                Profile
              </button>
              <button onClick={()=>{
                  signOut()
                }
              } className="px-4 py-2 text-black rounded-lg  transition-colors">
                SignOut
              </button>
              
              <img className='h-12 w-12' src={session.data?.user?.image} alt="" />

            </div>
 
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className='text-black text-2xl font-bold'>Welcome Back,</div>
        <MainHeader financialData={financialData}/>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget Section */}
          <div className="lg:col-span-2">
            <div className="bg-white  rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Budget Overview</h2>
                <PieChart className="w-6 h-6 text-gray-400" />
              </div>
              <div className="space-y-6">
                {financialData.budgets.map((budget, index) => (
                  <BudgetProgress key={index} {...budget} />
                ))}
              </div>

            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-5 "
                onClick={()=>{
                    window.open("http://localhost:3000/transactions","_self")
                }}
            >
              + Add Transaction
            </button>
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Transactions</h2>
              <div className="space-y-4">
                {financialData.recentTransactions.map((transaction) => (
                  <TransactionItem key={transaction.id} {...transaction} />
                ))}
              </div>
              <button className="w-full mt-6 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                View All Transactions
              </button>
            </div>
          </div>
          <div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;