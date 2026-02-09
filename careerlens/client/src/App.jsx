import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import CustomCursor from './components/CustomCursor'
import Path from './pages/Path'
import ResumeAnalyzer from './pages/ResumeAnalyzer'
import SkillAnalyzer from './pages/SkillAnalyzer'
import UserDetails from './pages/UserDetails'
import Dashboard from './pages/Dashboard'
import Analysis from './pages/Analysis'
import HabitTracker from './pages/HabitTracker'
import Tasks from './pages/Tasks'
import CareerGuide from './pages/CareerGuide'
import Opening from './pages/opening'
import MainLayout from './components/MainLayout'

const App = () => {
  return (
    <div>
      <CustomCursor />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/onboarding' element={<Onboarding />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/opening' element={<MainLayout><Opening /></MainLayout>} />

        {/* Protected Routes with MainLayout */}
        <Route path='/path' element={<Path />} />
        <Route path='/details' element={<UserDetails />} />
        <Route path='/resume-analyzer' element={<MainLayout><ResumeAnalyzer /></MainLayout>} />
        <Route path='/skill-analysis' element={<MainLayout><SkillAnalyzer /></MainLayout>} />
        <Route path='/dashboard' element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path='/analysis' element={<MainLayout><Analysis /></MainLayout>} />
        <Route path='/habit-tracker' element={<MainLayout><HabitTracker /></MainLayout>} />
        <Route path='/tasks' element={<MainLayout><Tasks /></MainLayout>} />
        <Route path='/career-guide' element={<MainLayout><CareerGuide /></MainLayout>} />
      </Routes>
    </div>
  )
}

export default App