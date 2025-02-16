"use client"
import React, { useEffect, useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { incomeAtom } from '../atoms';
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
import { useAtomValue, useSetAtom } from 'jotai';

function Alert({ message }) {
  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
      <p className="font-bold">Warning</p>
      <p>{message}</p>
    </div>
  );
}

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
      <div>
        <p className="text-2xl font-bold text-black">₹{amount.toLocaleString()}</p>
        {title === "Total Balance" && amount === 0 && (
          <p className="text-sm text-gray-500 mt-1">
            Balance will be updated after the first month of use
          </p>
        )}
      </div>
    </div>
  );
}
function TransactionModal({ transactions, onClose, onUpdate, Budget, setBudget }) {
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0], // Set default date to today
    type: 'income'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction({ ...newTransaction, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      // Format the transaction data
      const transactionToSubmit = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
        date: new Date(newTransaction.date).toISOString()
      };

      // Add transaction
      await axios.post(`http://localhost:3001/transactions`, 
        { transactions: [transactionToSubmit] },
        { headers: { token: token } }
      );

      // If it's an expense, update the corresponding budget
      if (transactionToSubmit.type === 'expense') {
        const budget = Budget.find(b => b.category === transactionToSubmit.category);
        if (budget) {
          const updatedBudget = {
            ...budget,
            spent: budget.spent + Math.abs(transactionToSubmit.amount)
          };

          await axios.put(`http://localhost:3001/expenses/${budget.id}`, 
            updatedBudget,
            { headers: { token: token } }
          );

          // Update local budget state
          const newBudgets = Budget.map(b => 
            b.id === budget.id ? updatedBudget : b
          );
          setBudget(newBudgets);
        }
      }

      // Fetch updated transactions
      const resTrans = await axios.get('http://localhost:3001/transactions', {
        headers: { token: token }
      });

      // Update transactions in parent component
      onUpdate(prev => ({
        ...prev,
        recentTransactions: resTrans.data
      }));

      onClose();
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Error adding transaction. Please try again.");
    }
  };


  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full">
        <h2 className="text-xl font-bold mb-4">All Transactions</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto mb-6 border-b">
          {transactions?.map((transaction) => (
            <TransactionItem key={transaction.id} {...transaction} />
          ))}
        </div>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700">Description</label>
              <input
                type="text"
                name="description"
                value={newTransaction.description}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Amount</label>
              <input
                type="number"
                name="amount"
                value={newTransaction.amount}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                value={newTransaction.date}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Type</label>
              <select
                name="type"
                value={newTransaction.type}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            {newTransaction.type === 'expense' && (
              <div className="mb-4">
                <label className="block text-gray-700">Category</label>
                <select
                  name="category"
                  value={newTransaction.category}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select a category</option>
                  {Budget.map((budget) => (
                    <option key={budget.id} value={budget.category}>
                      {budget.category}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded-lg mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Add Transaction
            </button>
          </div>
        </form>
      </div>
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`http://localhost:3001/expenses/${budget.id}`, {
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
  const remainingAmount = budget.amount - budget.spent;
  const isWarning = remainingAmount <= (budget.amount * 0.25); // Show warning if only 25% budget is remaining

  return (
    <div className="mb-4">
      {isWarning && <Alert message={`You have only ₹${remainingAmount} left in your ${budget.category} budget.`} />}
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-600">{budget.category}</span>
        <span className="text-sm font-medium text-gray-600">
          ₹{budget.spent} / ₹{budget.amount}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div
          className={`h-2 rounded-full ${budget.color}`}
          style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: budget.color }}
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


function MainHeader({ financialData, onUpdate ,Budget}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    balance: financialData.balance,
    monthlyIncome: financialData.monthlyIncome,
    monthlyExpenses: financialData.monthlyExpenses
  });

  useEffect(() => {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const monthlyTransactions = financialData.recentTransactions.filter(transaction => 
      new Date(transaction.date) >= firstDayOfMonth
    );

    // Calculate income (positive transactions)
    const calculatedIncome = monthlyTransactions
      .filter(transaction => transaction.type === 'income')
      .reduce((sum, transaction) => sum + Math.abs(parseFloat(transaction.amount)), 0);

    // Calculate expenses (negative transactions + budget spent)
    const transactionExpenses = monthlyTransactions
      .filter(transaction => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + Math.abs(parseFloat(transaction.amount)), 0);

    // Calculate total budget spent this month
    const budgetExpenses = Budget.reduce((sum, budget) => sum + budget.spent, 0);

    const totalExpenses = transactionExpenses + budgetExpenses;

    console.log('Monthly Income:', calculatedIncome);
    console.log('Monthly Expenses:', totalExpenses);

    setFormData(prev => ({
      ...prev,
      monthlyIncome: calculatedIncome,
      monthlyExpenses: totalExpenses
    }));
  }, [financialData.recentTransactions, Budget]);

  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
          amount={formData.monthlyIncome}
          icon={TrendingUp}
        />
        <StatCard
          title="Monthly Expenses"
          amount={formData.monthlyExpenses}
          icon={CreditCard}
        />
        <StatCard
          title="Total Savings"
          amount={formData.monthlyIncome - formData.monthlyExpenses}
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
        {type === 'income' ? '+' : '-'}₹{Math.abs(amount).toLocaleString()}
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
    recentTransactions: []
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
  const [isViewAllTransactionsModalOpen, setIsViewAllTransactionsModalOpen] = useState(false); 
  const handleCloseTransactionModal = () => {
    setIsViewAllTransactionsModalOpen(false);
  };

  const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: 0,
    spent: 0,
    color: ''
  });
  const token = localStorage.getItem("token");
  useEffect(() => {
    async function handleMonthEnd() {
      const currentDate = new Date();
      const storedMonth = localStorage.getItem('lastSavingsUpdateMonth');
      const currentMonth = currentDate.getMonth();
  
      if (storedMonth !== currentMonth.toString()) {
        try {
          // Calculate savings (only if both values are numbers)
          const monthlySavings = Number(data.monthlyIncome) - Number(data.monthlyExpenses);
          const newBalance = Number(data.balance) + monthlySavings;
  
          // Ensure the balance is valid before updating
          if (!isNaN(newBalance) && isFinite(newBalance)) {
            // Update balance in database
            const res = await axios.put(`http://localhost:3001/data/${data.AdminId}`, {
              balance: newBalance,
              monthlyIncome: data.monthlyIncome,
              monthlyExpenses: data.monthlyExpenses,
              savings: monthlySavings
            }, {
              headers: { token: token }
            });
  
            // Update local state
            setData(prev => ({
              ...prev,
              balance: newBalance
            }));
  
            // Store current month
            localStorage.setItem('lastSavingsUpdateMonth', currentMonth.toString());
  
            // Show success message
            alert(`Monthly savings of ₹${monthlySavings} added to balance!`);
          } else {
            console.error("Invalid balance calculation:", {
              currentBalance: data.balance,
              monthlySavings,
              newBalance
            });
          }
        } catch (error) {
          console.error("Error updating balance with savings:", error);
        }
      }
    }
  
    handleMonthEnd();
  }, [data.monthlyIncome, data.monthlyExpenses, data.balance, data.AdminId, token]);
  useEffect(() => {
    async function resetBudgets() {
      const currentDate = new Date();
      const storedMonth = localStorage.getItem('lastBudgetResetMonth');
      const currentMonth = currentDate.getMonth();

      // Check if we need to reset budgets
      if (storedMonth !== currentMonth.toString()) {
        try {
          // Reset spent amount for all budgets
          const updatedBudgets = Budget.map(budget => ({
            ...budget,
            spent: 0
          }));

          // Update each budget in the database
          for (const budget of updatedBudgets) {
            await axios.put(`http://localhost:3001/expenses/${budget.id}`, 
              {
                ...budget,
                spent: 0
              },
              {
                headers: { token: token }
              }
            );
          }

          // Update local state
          setBudget(updatedBudgets);
          
          // Store current month
          localStorage.setItem('lastBudgetResetMonth', currentMonth.toString());
        } catch (error) {
          console.error("Error resetting budgets:", error);
        }
      }
    }

    resetBudgets();
  }, [Budget, token]);
  useEffect(() => {
    async function fetch() {
      try {
        console.log("start")
        console.log(token);
        const res = await axios.get(`http://localhost:3001/data`, {
          headers: {
            token: token
          }
        });
        
        const rebBudget = await axios.get('http://localhost:3001/expenses', {
          headers: {
            token: token
          }
        });
        
        const resTrans = await axios.get('http://localhost:3001/transactions', {
          headers: {
            token: token
          }
        });
  
        setBudget(rebBudget.data);
        setData(prev => ({
          ...prev,
          balance: Number(res.data.balance) || 0,
          monthlyExpenses: Number(res.data.monthlyExpenses) || 0,
          monthlyIncome: Number(res.data.monthlyIncome) || 0,
          recentTransactions: resTrans.data,
          AdminId: res.data.AdminId
        }));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetch();
  }, [token]);

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
              <button className='px-4 py-2 text-black rounded-lg transition-colors' onClick={()=>{
                window.open("http://localhost:3000/analysis","_self");
              }}>
                Analysis
              </button>
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
              <img className='h-12 w-12' src={session.data?.user?.image} alt={session.data?.user?.image} />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className='text-black text-2xl font-bold'>Welcome Back,</div>
        <MainHeader financialData={data} onUpdate={setData} Budget = {Budget} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Budget Overview</h2>
                <PieChart className="w-6 h-6 text-gray-400" />
              </div>
              <div className="space-y-6 max-h-96 overflow-y-auto mx-1" >
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
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {console.log(data)}
                {
                data.recentTransactions?.map((transaction) => (
                  <TransactionItem key={transaction.id} {...transaction} />
                ))}
              </div>
              <button className="w-full mt-6 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={()=>{
                setIsViewAllTransactionsModalOpen(true)
              }
                
              }>
                View All Transactions
              </button>
            </div>
          </div>
        </div>
      </main>
      {isViewAllTransactionsModalOpen && (
  <TransactionModal
    transactions={data.recentTransactions || []}
    onClose={handleCloseTransactionModal}
    onUpdate={setData}
    Budget={Budget}
    setBudget={setBudget}
  />
)}
    </div>
  );
}

export default Home;