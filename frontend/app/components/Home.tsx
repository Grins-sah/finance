"use client"
import React, { useEffect, useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
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

function BudgetProgress({ budget, onUpdate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: budget.category,
    amount: budget.amount,
    spent: budget.spent,
    color: budget.color
  });
  console.log(budget);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`http://localhost:3001/expenses/${budget.id}`,{
        category: formData.category,
        amount: parseInt(formData.amount),
        spent: parseInt(formData.spent),
        color: formData.color
      }, {
        headers: {
          token: token
        }
      });
      const data = await axios.get('http://localhost:3001/expenses', {
        headers: {
          token: token
        }
      });
      onUpdate(data.data);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating budget:", error);
    }
  };

  const percentage = (budget.spent / budget.amount) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-600">{budget.category}</span>
        <span className="text-sm font-medium text-gray-600">
        ₹{budget.spent} / ₹{budget.amount}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div
          className={`h-2 rounded-full ${budget.color}`}
          style={{ width: `${Math.min(percentage, 100)}%`,backgroundColor: budget.color }}
        ></div>
      </div>
      <button
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => setIsModalOpen(true)}
      >
        Update Budget
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Update Budget</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Spent</label>
                <input
                  type="number"
                  name="spent"
                  value={formData.spent}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded-lg mr-2"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



function MainHeader({ financialData, onUpdate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    balance: financialData.balance,
    monthlyIncome: financialData.monthlyIncome,
    monthlyExpenses: financialData.monthlyExpenses
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`http://localhost:3001/data/${financialData.AdminId}`, formData, {
        headers: {
          token: token
        }
      });
      onUpdate(res.data.data);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          amount={financialData.monthlyIncome - financialData.monthlyExpenses}
          icon={Target}
        />
      </div>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => setIsModalOpen(true)}
      >
        Update Financial Data
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Update Financial Data</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">Balance</label>
                <input
                  type="number"
                  name="balance"
                  value={formData.balance}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Monthly Income</label>
                <input
                  type="number"
                  name="monthlyIncome"
                  value={formData.monthlyIncome}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Monthly Expenses</label>
                <input
                  type="number"
                  name="monthlyExpenses"
                  value={formData.monthlyExpenses}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded-lg mr-2"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
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
  const [data, setData] = useState({
    balance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savings: 0,
  });
  const [Budget, setBudget] = useState<[{
    category: string,
    amount: number,
    spent: number,
    color: string
  }]>([{
    category: '',
    amount: 0,
    spent: 0,
    color: ''
  }]);
  const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: 0,
    spent: 0,
    color: ''
  });
  const token = localStorage.getItem("token");
  useEffect(() => {

    async function fetch() {
      console.log("start")
      console.log(token);
      const res: {
        data: {
          balance: number,
          monthlyIncome: number,
          monthlyExpenses: number,
          savings: number
        }
      } = await axios.get(`http://localhost:3001/data`, {
        headers: {
          token: token
        }
      })
      const rebBudget = await axios.get('http://localhost:3001/expenses',{
        headers: {
          token: token
        }
      })
      console.log("end")
      console.log(res.data);
      setBudget(rebBudget.data);
      setData(res.data);

    }
    fetch();

  }, [])
  const handleUpdate = (updatedData) => {
    setBudget(updatedData);
  };

  const handleAddBudgetInputChange = (e) => {
    const { name, value } = e.target;
    setNewBudget({ ...newBudget, [name]: value });
  };

  const handleAddBudgetSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`http://localhost:3001/expenses`, { expenses: [newBudget] }, {
        headers: {
          token: token
        }
      });
      const data = await axios.get('http://localhost:3001/expenses', {
        headers: {
          token: token
        }
      });
      setBudget(data.data);
      setIsAddBudgetModalOpen(false);
    } catch (error) {
      console.error("Error adding budget:", error);
    }
  };

  console.log(session.data?.user?.image)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="w-8 h-8 text-blue-600" />
              <h1 onClick={() => {
                window.open("http://localhost:3000/", "_self")
              }} className="ml-3 text-2xl font-bold text-gray-900 cursor-pointer">Financial Dashboard</h1>
            </div>
            <div className='flex'>
              <button className="px-4 py-2 text-black rounded-lg transition-colors">
                details
              </button>
              <button className="px-4 py-2 text-black rounded-lg transition-colors">
                Profile
              </button>
              <button onClick={async () => {
                await signOut()
                window.open("http://localhost:3000/", "_self")
              }} className="px-4 py-2 text-black rounded-lg transition-colors">
                SignOut
              </button>
              <img className='h-12 w-12' src={session.data?.user?.image} alt="" />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className='text-black text-2xl font-bold'>Welcome Back,</div>
        <MainHeader financialData={data} onUpdate={setData} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Budget Overview</h2>
                <PieChart className="w-6 h-6 text-gray-400" />
              </div>
              <div className="space-y-6">
                {Budget.map((budget, index) => (
                  <BudgetProgress key={index} budget={budget} onUpdate={setBudget} />
                ))}
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-5"
              onClick={() => setIsAddBudgetModalOpen(true)}
            >
              + Add Budget
            </button>
          </div>
          {isAddBudgetModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Add Budget</h2>
                <form onSubmit={handleAddBudgetSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700">Category</label>
                    <input
                      type="text"
                      name="category"
                      value={newBudget.category}
                      onChange={handleAddBudgetInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">Amount</label>
                    <input
                      type="number"
                      name="amount"
                      value={newBudget.amount}
                      onChange={handleAddBudgetInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">Spent</label>
                    <input
                      type="number"
                      name="spent"
                      value={newBudget.spent}
                      onChange={handleAddBudgetInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">Color</label>
                    <input
                      type="text"
                      name="color"
                      value={newBudget.color}
                      onChange={handleAddBudgetInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-300 rounded-lg mr-2"
                      onClick={() => setIsAddBudgetModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Transactions</h2>
              <div className="space-y-4">
                {data.recentTransactions?.map((transaction) => (
                  <TransactionItem key={transaction.id} {...transaction} />
                ))}
              </div>
              <button className="w-full mt-6 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                View All Transactions
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;