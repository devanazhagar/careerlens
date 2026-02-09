import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

const Login = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState({ text: '', type: '' });
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        try {
            const response = await axios.post('http://127.0.0.1:3000/careerlens/login', {
                identifier: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                setMessage({ text: response.data.message, type: 'success' });
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.userdata));

                setTimeout(() => {
                    if (response.data.hasProfile) {
                        navigate('/dashboard');
                    } else {
                        navigate('/path');
                    }
                }, 1500);
            } else {
                setMessage({ text: response.data.message, type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setMessage({ text: "Login failed. Please check your credentials.", type: 'error' });
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Enter your details to access your account"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#F2B42D] transition-colors" />
                    </div>
                    <input
                        type="email"
                        name="email"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#00002E] border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#F2B42D] focus:border-transparent outline-none text-white placeholder-gray-500 transition-all duration-300"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                {/* Password Input */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#F2B42D] transition-colors" />
                    </div>
                    <input
                        type="password"
                        name="password"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#00002E] border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#F2B42D] focus:border-transparent outline-none text-white placeholder-gray-500 transition-all duration-300"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                    <Link
                        to="/forgot-password"
                        className="text-sm text-[#48A8E2] hover:text-[#59ABA9] transition-colors duration-300 hover:underline"
                    >
                        Forgot Password?
                    </Link>
                </div>

                {message.text && (
                    <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {message.text}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#F2B42D] to-[#DD785E] text-[#00002E] font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(242,180,45,0.4)] transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
                >
                    Sign In <ArrowRight className="h-5 w-5" />
                </button>

                {/* Footer Link */}
                <div className="text-center mt-6">
                    <p className="text-gray-400 text-sm">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="text-[#48A8E2] hover:text-[#59ABA9] font-medium transition-colors duration-300 hover:underline"
                        >
                            Sign Up
                        </Link>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
};

export default Login;
