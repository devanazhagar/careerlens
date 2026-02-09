import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowRight, ArrowLeft, KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        setIsLoading(true);
        try {
            const response = await axios.post('http://127.0.0.1:3000/careerlens/resetotp', { email });
            if (response.data.success) {
                setMessage({ text: response.data.message, type: 'success' });
                setTimeout(() => {
                    setStep(2);
                    setMessage({ text: '', type: '' });
                }, 1500);
            } else {
                setMessage({ text: response.data.message, type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setMessage({ text: "Failed to send OTP", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        if (newPassword !== confirmPassword) {
            setMessage({ text: "Passwords do not match", type: 'error' });
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.post('http://127.0.0.1:3000/careerlens/resetpassword', {
                email,
                otp: otp.join(''),
                password: newPassword
            });
            if (response.data.success) {
                setMessage({ text: response.data.message, type: 'success' });
                setTimeout(() => navigate('/login'), 1500);
            } else {
                setMessage({ text: response.data.message, type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setMessage({ text: "Failed to reset password", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const inputClasses = "w-full pl-10 pr-4 py-3 bg-[#00002E] border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#F2B42D] focus:border-transparent outline-none text-white placeholder-gray-500 transition-all duration-300";
    const iconClasses = "h-5 w-5 text-gray-400 group-focus-within:text-[#F2B42D] transition-colors";

    return (
        <AuthLayout
            title={step === 1 ? "Reset Password" : "Verify & Reset"}
            subtitle={step === 1 ? "Enter your email to receive recovery instructions" : "Enter OTP and set your new password"}
        >
            {step === 1 ? (
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className={iconClasses} />
                        </div>
                        <input
                            type="email"
                            required
                            className={inputClasses}
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-[#F2B42D] to-[#DD785E] text-[#00002E] font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(242,180,45,0.4)] transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Sending...' : 'Send OTP'} <ArrowRight className="h-5 w-5" />
                    </button>
                </form>
            ) : (
                <form onSubmit={handleResetSubmit} className="space-y-6">
                    {/* OTP Grid */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Enter OTP</label>
                        <div className="flex justify-between gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-12 text-center bg-[#00002E] border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#F2B42D] focus:border-transparent outline-none text-white text-xl font-bold transition-all"
                                />
                            ))}
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className={iconClasses} />
                        </div>
                        <input
                            type="password"
                            required
                            className={inputClasses}
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>

                    {/* Confirm Password */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CheckCircle2 className={iconClasses} />
                        </div>
                        <input
                            type="password"
                            required
                            className={inputClasses}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-[#F2B42D] to-[#DD785E] text-[#00002E] font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(242,180,45,0.4)] transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'} <KeyRound className="h-5 w-5" />
                    </button>
                </form>
            )}

            <div className="text-center mt-6">
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300 text-sm"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                </Link>
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;
