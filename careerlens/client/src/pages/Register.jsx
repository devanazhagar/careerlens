import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, ArrowRight, BadgeCheck } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

const Register = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState({ text: '', type: '' });
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        userId: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        if (formData.password !== formData.confirmPassword) {
            setMessage({ text: "Passwords do not match", type: 'error' });
            return;
        }

        try {
            const payload = {
                Name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                userID: formData.userId,
                phone: formData.phone,
                password: formData.password
            };

            const response = await axios.post('http://127.0.0.1:3000/careerlens/reg', payload);

            if (response.data.success) {
                setMessage({ text: response.data.message, type: 'success' });
                if (response.data.token) localStorage.setItem('token', response.data.token);
                if (response.data.userdata) localStorage.setItem('user', JSON.stringify(response.data.userdata));
                setTimeout(() => navigate('/path'), 1500);
            } else {
                setMessage({ text: response.data.message, type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setMessage({ text: "Registration failed. Please try again.", type: 'error' });
        }
    };

    const inputClasses = "w-full pl-10 pr-4 py-3 bg-[#00002E] border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#F2B42D] focus:border-transparent outline-none text-white placeholder-gray-500 transition-all duration-300";
    const iconClasses = "h-5 w-5 text-gray-400 group-focus-within:text-[#F2B42D] transition-colors";

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Start your journey toward a meaningful career"
            className="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className={iconClasses} />
                    </div>
                    <input
                        className={inputClasses}
                        placeholder="First Name"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Last Name */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className={iconClasses} />
                    </div>
                    <input
                        className={inputClasses}
                        placeholder="Last Name"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Email */}
                <div className="relative group md:col-span-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className={iconClasses} />
                    </div>
                    <input
                        className={inputClasses}
                        placeholder="Work Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* User ID */}
                <div className="relative group md:col-span-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BadgeCheck className={iconClasses} />
                    </div>
                    <input
                        className={inputClasses}
                        placeholder="Username / User ID"
                        type="text"
                        name="userId"
                        value={formData.userId}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Phone */}
                <div className="relative group md:col-span-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className={iconClasses} />
                    </div>
                    <input
                        className={inputClasses}
                        placeholder="Phone Number"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Password */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className={iconClasses} />
                    </div>
                    <input
                        className={inputClasses}
                        placeholder="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Confirm Password */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className={iconClasses} />
                    </div>
                    <input
                        className={inputClasses}
                        placeholder="Confirm Password"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                </div>

                {message.text && (
                    <div className={`md:col-span-2 p-3 rounded-lg text-sm text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {message.text}
                    </div>
                )}

                <div className="md:col-span-2 mt-2">
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#F2B42D] to-[#DD785E] text-[#00002E] font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(242,180,45,0.4)] transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        Create Account <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            </form>
            <div className="text-center mt-6">
                <p className="text-gray-400 text-sm">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="text-[#48A8E2] hover:text-[#59ABA9] font-medium transition-colors duration-300 hover:underline"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default Register;