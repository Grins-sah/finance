"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { Pie, PieChart, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Wallet } from 'lucide-react'
import { useSession } from "next-auth/react"

export default function Analysis() {
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
  const token = localStorage.getItem("token");
  const session = useSession();

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
      setData((data) => {
        data.balance = res.data.balance;
        data.monthlyExpenses = res.data.monthlyExpenses;
        data.monthlyIncome = res.data.monthlyIncome;
        data.savings = res.data.savings;
        data.recentTransactions = resTrans.data;
        return data;
      });
    }
    fetch();
  }, [token]);

  // Format data for Pie Chart
  const pieData = [
    { name: 'Balance', value: parseInt(data.balance) },
    { name: 'Monthly Income', value: parseInt(data.monthlyIncome) },
    { name: 'Monthly Expenses', value: parseInt(data.monthlyExpenses) },
    { name: 'Savings', value: parseInt(data.monthlyIncome) - parseInt(data.monthlyExpenses) }
  ];

  // Format data for Bar Chart
  const barData = data.recentTransactions.map(transaction => ({
    category: transaction.category,
    amount: parseFloat(transaction.amount)
  }));

  // Calculate statistical insights
  const totalTransactions = data.recentTransactions.length;
  const totalAmountSpent = data.recentTransactions.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
  const averageTransactionAmount = totalTransactions > 0 ? (totalAmountSpent / totalTransactions).toFixed(2) : 0;

  // Calculate mean, median, mode, and outliers
  const amounts = data.recentTransactions.map(transaction => parseFloat(transaction.amount));
  const mean = (totalAmountSpent / totalTransactions).toFixed(2);

  const median = (arr => {
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);
  })(amounts);

  const mode = (arr => {
    const frequency = {};
    let maxFreq = 0;
    let modes = [];
    arr.forEach(value => {
      frequency[value] = (frequency[value] || 0) + 1;
      if (frequency[value] > maxFreq) {
        maxFreq = frequency[value];
        modes = [value];
      } else if (frequency[value] === maxFreq) {
        modes.push(value);
      }
    });
    return modes.length === arr.length ? "No mode" : modes.join(', ');
  })(amounts);

  const outliers = (arr => {
    const sorted = arr.slice().sort((a, b) => a - b);
    const q1 = sorted[Math.floor((sorted.length / 4))];
    const q3 = sorted[Math.ceil((sorted.length * (3 / 4))) - 1];
    const iqr = q3 - q1;
    const lowerBound = q1 - (iqr * 1.5);
    const upperBound = q3 + (iqr * 1.5);
    return sorted.filter(x => x < lowerBound || x > upperBound);
  })(amounts);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  console.log("Pie Data:", pieData); // Debugging information
  console.log("Bar Data:", barData); // Debugging information

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
              <button className='px-4 py-2 text-black rounded-lg transition-colors' onClick={() => {
                window.open("http://localhost:3000/analysis", "_self");
              }}>
                Analysis
              </button>
              <button onClick={()=>{
                window.open("http://localhost:3000/dashboard","_self");
              }} className="px-4 py-2 text-black rounded-lg transition-colors">
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
        <h1 className='text-black text-2xl font-bold'>Financial Analysis</h1>
        <div className="flex">
        <div>
        <PieChart width={730} height={400}>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={150}
            fill="#8884d8"
            label
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
        <h2 className='text-black text-xl font-bold mt-8'>Transaction Insights</h2>
        <BarChart width={730} height={250} data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="amount" fill="#8884d8" />
        </BarChart>
        </div>
        <div className="mt-8">
          <h3 className='text-black text-lg font-bold'>Statistical Insights</h3>
          <p>Total Transactions: {totalTransactions}</p>
          <p>Total Amount Spent: ₹{totalAmountSpent.toFixed(2)}</p>
          <p>Average Transaction Amount: ₹{averageTransactionAmount}</p>
          <p>Mean Transaction Amount: ₹{mean}</p>
          <p>Median Transaction Amount: ₹{median}</p>
          <p>Mode Transaction Amount: ₹{mode}</p>
          <p>Outliers: {outliers.length > 0 ? outliers.join(', ') : 'None'}</p>
        </div>
        </div>
      </main>
    </div>
  );
}