"use client"
import { signIn, useSession } from "next-auth/react";
import { 
  Wallet,
  LineChart,
  PiggyBank,
  Target,
  ArrowRight
} from 'lucide-react';
import Home from "./components/Home";
function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="p-3 bg-blue-50 rounded-lg w-fit">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
    </div>
  );
}

export default function Dashboard(){
  const session  = useSession();
  console.log(session)
  if(session.data){
    window.open("http://localhost:3000/dashboard","_self")
  }
  else{
    return<div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
    {/* Navigation */}
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Wallet className="w-8 h-8 text-blue-600" />
            <span className="ml-3 text-xl font-bold text-gray-900">FinanceFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium" onClick={()=>{
              if(!session.data){
                signIn();
              }
            }} >
              SignIn/SignUp
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Hero Section */}
    <header className="pt-20 pb-16 text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Take Control of Your <span className="text-blue-600">Financial Future</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Track your spending, set budgets, and achieve your financial goals with our comprehensive personal finance dashboard.
        </p>
        <button 
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
        >
          Get Started <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </header>

    {/* Features Section */}
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything you need to manage your finances
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={LineChart}
            title="Expense Tracking"
            description="Automatically categorize and track your expenses to understand your spending habits."
          />
          <FeatureCard
            icon={PiggyBank}
            title="Smart Budgeting"
            description="Create custom budgets and get real-time alerts when you're approaching your limits."
          />
          <FeatureCard
            icon={Target}
            title="Goal Setting"
            description="Set and track financial goals with personalized recommendations and insights."
          />
        </div>
      </div>
    </section>
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">1M+</div>
            <div className="text-gray-600">Active Users</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">$10B+</div>
            <div className="text-gray-600">Transactions Tracked</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
            <div className="text-gray-600">Customer Satisfaction</div>
          </div>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Wallet className="w-6 h-6 text-blue-600" />
            <span className="ml-2 text-lg font-semibold text-gray-900">FinanceFlow</span>
          </div>
          <div className="text-gray-600">© 2024 FinanceFlow. All rights reserved.</div>
        </div>
      </div>
    </footer>
  </div>
  }
}