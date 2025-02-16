"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { Pie, PieChart, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Wallet } from 'lucide-react'
import { useSession, signOut } from "next-auth/react"

export default function Analysis() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    balance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savings: 0,
    recentTransactions: [],
    AdminId: null
  });

  const [Budget, setBudget] = useState<Array<{
    category: string,
    amount: number,
    spent: number,
    color: string
  }>>([]);

  const token = localStorage.getItem("token");
  const session = useSession();

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [resData, resBudget, resTrans] = await Promise.all([
          axios.get(`http://localhost:3001/data`, { headers: { token } }),
          axios.get('http://localhost:3001/expenses', { headers: { token } }),
          axios.get('http://localhost:3001/transactions', { headers: { token } })
        ]);

        setBudget(resBudget.data);
        setData({
          balance: Number(resData.data.balance) || 0,
          monthlyExpenses: Number(resData.data.monthlyExpenses) || 0,
          monthlyIncome: Number(resData.data.monthlyIncome) || 0,
          savings: Number(resData.data.savings) || 0,
          recentTransactions: resTrans.data || [],
          AdminId: resData.data.AdminId
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (token) fetchData();
  }, [token]);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthTransactions = data.recentTransactions.filter(transaction => {
    const transDate = new Date(transaction.date);
    return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear;
  });

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || '0')), 0);

  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || '0')), 0);

  const totalSavings = monthlyIncome - monthlyExpenses;

  const transactionAmounts = currentMonthTransactions
    .map(t => Math.abs(parseFloat(t.amount || '0')))
    .filter(amount => !isNaN(amount));

  const mean = transactionAmounts.length > 0
    ? transactionAmounts.reduce((sum, amount) => sum + amount, 0) / transactionAmounts.length
    : 0;

  const sortedAmounts = [...transactionAmounts].sort((a, b) => a - b);
  const median = transactionAmounts.length > 0
    ? transactionAmounts.length % 2 === 0
      ? (sortedAmounts[transactionAmounts.length / 2 - 1] + sortedAmounts[transactionAmounts.length / 2]) / 2
      : sortedAmounts[Math.floor(transactionAmounts.length / 2)]
    : 0;

  const frequencyMap = transactionAmounts.reduce((acc, amount) => {
    acc[amount] = (acc[amount] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const maxFrequency = Math.max(...Object.values(frequencyMap), 0);
  const modes = Object.entries(frequencyMap)
    .filter(([_, freq]) => freq === maxFrequency)
    .map(([amount]) => Number(amount));

  const q1Index = Math.floor(sortedAmounts.length * 0.25);
  const q3Index = Math.floor(sortedAmounts.length * 0.75);
  const q1 = sortedAmounts[q1Index] || 0;
  const q3 = sortedAmounts[q3Index] || 0;
  const iqr = q3 - q1;
  const outliers = sortedAmounts.filter(
    amount => amount < q1 - 1.5 * iqr || amount > q3 + 1.5 * iqr
  );

  const pieData = [
    { name: 'Balance', value: Math.max(0, Number(data.balance)) },
    { name: 'Income', value: Math.max(0, monthlyIncome) },
    { name: 'Expenses', value: Math.max(0, monthlyExpenses) },
    { name: 'Savings', value: Math.max(0, totalSavings) }
  ].filter(item => item.value > 0);

  const categorySpending = data.recentTransactions.reduce((acc, transaction) => {
    if (transaction.type === 'expense') {
      const category = transaction.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + Math.abs(parseFloat(transaction.amount || '0'));
    }
    return acc;
  }, {} as Record<string, number>);

  const budgetBarData = Budget.map(budget => ({
    category: budget.category,
    allocated: budget.amount,
    spent: budget.spent,
    remaining: Math.max(0, budget.amount - budget.spent)
  }));

  const barData = Object.entries(categorySpending)
    .map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2))
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 20);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <p className="text-xl">Loading...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="w-8 h-8 text-blue-600" />
              <h1 onClick={() => window.open("http://localhost:3000/", "_self")} 
                  className="ml-3 text-2xl font-bold text-gray-900 cursor-pointer">
                Financial Dashboard
              </h1>
            </div>
            <div className='flex gap-4 items-center'>
              <button onClick={() => window.open("http://localhost:3000/dashboard", "_self")}
                      className="px-4 py-2 text-black rounded-lg transition-colors hover:bg-gray-100">
                Dashboard
              </button>
              <button onClick={async () => {
                await signOut();
                window.open("http://localhost:3000/", "_self");
              }} className="px-4 py-2 text-black rounded-lg transition-colors hover:bg-gray-100">
                Sign Out
              </button>
              {session.data?.user?.image && (
                <img className='h-12 w-12 rounded-full' 
                     src={session.data.user.image} 
                     alt="Profile" />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className='text-black text-2xl font-bold mb-8'>Financial Analysis</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className='text-black text-xl font-bold mb-4'>Financial Overview</h2>
            <div className="flex justify-center  ">
              <PieChart width={400} height={400}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, value}) => `${name}: ₹${value.toLocaleString()}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                <Legend />
              </PieChart>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className='text-black text-xl font-bold mb-4'>Monthly Statistics</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{Number(data.balance).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-gray-600">Monthly Income</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{monthlyIncome.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-gray-600">Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{monthlyExpenses.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-gray-600">Monthly Savings</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{totalSavings.toLocaleString()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <p className="text-gray-600">Mean Transaction</p>
                  <p className="text-xl font-bold text-indigo-600">
                    ₹{mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg">
                  <p className="text-gray-600">Median Transaction</p>
                  <p className="text-xl font-bold text-pink-600">
                    ₹{median.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              {modes.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-gray-600">Most Common Transaction{modes.length > 1 ? 's' : ''}</p>
                  <p className="text-xl font-bold text-amber-600">
                    {modes.map(mode => `₹${mode.toLocaleString()}`).join(', ')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Occurred {maxFrequency} time{maxFrequency > 1 ? 's' : ''}
                  </p>
                </div>
              )}
              {outliers.length > 0 && (
                <div className="p-4 bg-rose-50 rounded-lg">
                  <p className="text-gray-600">Unusual Transactions</p>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {outliers.map((value, index) => (
                      <div key={index} className="text-sm font-medium text-rose-600 mb-1">
                        ₹{value.toLocaleString()}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {outliers.length} unusual transaction{outliers.length > 1 ? 's' : ''} detected
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className='text-black text-xl font-bold'>Top Spending Categories</h2>
              <div className="text-sm text-gray-500">
                Showing top 20 categories
              </div>
            </div>
            {barData.length > 0 ? (
              <div className="overflow-x-auto">
                <BarChart
                  width={1000}
                  height={400}
                  data={barData}
                  margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="category"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="amount" name="Amount">
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No transaction data available</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className='text-black text-xl font-bold'>Budget Overview</h2>
              <div className="text-sm text-gray-500">
                Budget Allocation vs Spending
              </div>
            </div>
            {budgetBarData.length > 0 ? (
              <div className="overflow-x-auto">
                <BarChart
                  width={1000}
                  height={400}
                  data={budgetBarData}
                  margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="category"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="allocated" name="Allocated" fill="#8884d8" />
                  <Bar dataKey="spent" name="Spent" fill="#82ca9d" />
                  <Bar dataKey="remaining" name="Remaining" fill="#ffc658" />
                </BarChart>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No budget data available</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}