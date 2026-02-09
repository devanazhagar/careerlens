const express = require('express')
const UserModels = require('../models/user.js')
const bcrypt = require('bcryptjs')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const transport = require('../database/nodemailer.js')



const register = async (req, res) => {
    const { Name, email, password, userID, phone } = req.body
    if (!Name || !email || !password || !userID || !phone) {
        res.json({
            success: false,
            message: "all fields to be filled"
        })
    }
    try {
        const existingUser = await UserModels.findOne({ email })
        if (existingUser) {
            res.json({
                success: false,
                message: "email already exist"
            })
        }
        const existingPhone = await UserModels.findOne({ phone })
        if (existingPhone) {
            return res.json({
                success: false,
                message: "phone number already exist"
            })
        }

        const hashedpassword = await bcrypt.hash(password, 10)
        const newuser = new UserModels({ Name, email, password: hashedpassword, userID, phone })
        await newuser.save()
        const token = jwt.sign({ id: newuser._id }, process.env.JWT_PASS)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.SECURE === 'production',
            sameSite: process.env.SECURE === 'production' ? 'none' : 'strict',


        })
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8" />
        <title>Welcome to CareerLens</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
            @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .animate-card { animation: fadeIn 0.8s ease-out forwards; }
            body { cursor: default; }
        </style>
        </head>
        <body style="background-color:#00002E;padding:0;margin:0;font-family:'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;color:#FFFFFF;">
            <div style="background: radial-gradient(circle at top left, #D7425E 0%, transparent 50%), radial-gradient(circle at bottom right, #48A8E2 0%, transparent 50%); min-height: 100vh; padding: 40px 20px;">
                <div class="animate-card" style="
                    background: rgba(0, 0, 46, 0.85);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    max-width: 500px;
                    margin: 0 auto;
                    padding: 40px;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                ">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #F2B42D; font-size: 32px; margin: 0; font-weight: 700; letter-spacing: 1px;">CareerLens</h1>
                        <p style="color: #48A8E2; font-size: 14px; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px;">Welcome Aboard</p>
                    </div>

                    <div style="color: #E2E8F0; line-height: 1.6; font-size: 16px;">
                        <p style="margin-bottom: 20px;">Hi <strong style="color: #FFF;">${newuser.Name}</strong>,</p>
                        <p style="margin-bottom: 20px;">
                            We're thrilled to have you! Your account associated with <span style="color: #F2B42D;">${newuser.email}</span> has been successfully created.
                        </p>
                        <p style="margin-bottom: 10px; font-size: 14px; color: #94A3B8;">Your Account ID:</p>
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; font-family: monospace; color: #59ABA9; margin-bottom: 20px;">
                            ${newuser.userID}
                        </div>
                        
                        <p style="margin-bottom: 10px; font-size: 14px; color: #94A3B8;">Your Password:</p>
                        <div style="
                            padding: 20px;
                            font-size: 24px;
                            color: #F2B42D;
                            font-weight: 700;
                            text-align: center;
                            background: rgba(0, 0, 0, 0.2);
                            border-radius: 12px;
                            border: 1px dashed rgba(242, 180, 45, 0.3);
                            margin-bottom: 30px;
                        ">
                            ${password}
                        </div>
                        
                        <p style="font-size: 14px; color: #DD785E; text-align: center;">
                            Please keep this information safe and do not share it.
                        </p>
                    </div>

                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; font-size: 12px; color: #555;">
                        <p>&copy; 2025 CareerLens. AI-Assisted Career Analysis.</p>
                        <p>Automated Message. Do Not Reply.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        const mail = {
            from: process.env.SENDER_EMAIL,
            to: newuser.email,
            subject: "Signed Up Successfully",
            text: `Your account has been successfully created for the account associated ${newuser.email}.\n
                Account id : ${newuser.userID}`,
            html,// <-- html template,
            attachments: fs.existsSync(logoPath) ? [
                {
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'logo@jrr'
                }
            ] : []
        };




        await newuser.save();
        await transport.sendMail(mail);



        return res.json({ success: true, message: "Signed up successfully", token, userdata: { id: newuser._id, Name: newuser.Name, email: newuser.email, userID: newuser.userID } })


    } catch (e) {
        console.error(e)
        res.json({
            success: false,
            message: "failed in registration"
        })
    }
}
const login = async (req, res) => {
    const { identifier, password } = req.body
    if (!identifier || !password) {
        res.json({
            success: false,
            message: "all fields to be filled"
        })
    }
    try {
        let existingUser;
        if (identifier.includes('@')) {
            existingUser = await UserModels.findOne({ email: identifier })
        } else {
            existingUser = await UserModels.findOne({ userID: identifier })
        }
        if (existingUser) {
            if (await bcrypt.compare(password, existingUser.password)) {
                const token = jwt.sign({ id: existingUser._id }, process.env.JWT_PASS, { expiresIn: '7d' })
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.SECURE === 'production',
                    sameSite: process.env.SECURE === 'production' ? 'none' : 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000

                })

                // Check if profile exists
                const Student = require('../models/student');
                const CollegeStudent = require('../models/collegeStudent');
                const IndustryWorker = require('../models/industryWorker');
                const CareerReport = require('../models/CareerReport');
                const Assessment = require('../models/assessment');
                const ResumeReport = require('../models/ResumeReport');
                const Task = require('../models/Task');
                const HabitPlan = require('../models/HabitPlan');

                const hasStudent = await Student.findOne({ userID: existingUser._id });
                const hasCollege = await CollegeStudent.findOne({ userID: existingUser._id });
                const hasWorker = await IndustryWorker.findOne({ userID: existingUser._id });

                const hasProfile = !!(hasStudent || hasCollege || hasWorker);

                return res.json({
                    success: true,
                    message: "logged in successfully",
                    hasProfile,
                    token,
                    userdata: {
                        id: existingUser._id,
                        Name: existingUser.Name,
                        email: existingUser.email,
                        userID: existingUser.userID
                    }
                })
            }
            else {
                res.json({
                    success: false,
                    message: "invalid password"
                })
            }
        } else {
            res.json({
                success: false,
                message: "invalid email or userID"
            })
        }
    }
    catch (e) {
        res.json({
            success: false,
            message: "failed to login"
        })
    }
}
const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.SECURE === 'production',
            sameSite: process.env.SECURE === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000

        })
        res.json({ success: true, message: "your account has been logged out , login again to continue" })
    } catch (e) {
        res.json({
            success: false,
            message: "failed to logout"
        })
    }
}



const isauth = async (req, res) => {
    try {
        return res.json({
            success: true
        })
    } catch (e) {
        res.json({
            success: false,
            message: e.message
        })

    }
}
const path = require('path');
const fs = require('fs');

// before sending mail
const logoPath = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'logo.png');
if (!fs.existsSync(logoPath)) {
    console.warn('Logo file not found at', logoPath);
    // Option A: omit attachment and send without logo
    // Option B: fallback to an absolute public URL if available
}
const Resetpasswordotp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.json({
            success: false,
            message: "email is required"
        });
    }
    try {
        const user = await UserModels.findOne({ email });
        if (!user) {
            return res.json({
                success: false,
                message: "email is not found"
            });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        user.ResetOTPexpireAt = Date.now() + 24 * 60 * 60 * 1000;
        user.ResetOTP = otp;

        // --- HTML Email Template ---
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8" />
        <title>Reset Password - CareerLens</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
            @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            .animate-card { animation: fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        </style>
        </head>
        <body style="background-color:#00002E;padding:0;margin:0;font-family:'Outfit', 'Segoe UI', sans-serif;color:#FFFFFF;">
            <div style="background: radial-gradient(circle at center, #D7425E33 0%, transparent 60%), linear-gradient(135deg, #00002E 0%, #050540 100%); min-height: 100vh; padding: 40px 20px;">
                <div class="animate-card" style="
                    background: rgba(0, 0, 46, 0.9);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    max-width: 480px;
                    margin: 0 auto;
                    padding: 40px;
                    border-radius: 20px;
                    border: 1px solid rgba(72, 168, 226, 0.2);
                    box-shadow: 0 0 40px rgba(242, 180, 45, 0.1);
                ">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="color: #FFFFFF; font-size: 26px; margin: 0; font-weight: 600;">Reset Password</h1>
                        <div style="height: 3px; width: 60px; background: #F2B42D; margin: 15px auto; border-radius: 2px;"></div>
                    </div>

                    <div style="color: #CBD5E1; line-height: 1.6; font-size: 16px; text-align: center;">
                        <p>Hi ${user.Name},</p>
                        <p>You requested to reset your password. Use the following One-Time Password (OTP) to proceed.</p>
                        
                        <div style="
                            margin: 30px 0;
                            padding: 20px;
                            font-size: 36px;
                            color: #F2B42D;
                            font-weight: 800;
                            letter-spacing: 8px;
                            background: rgba(255, 255, 255, 0.05);
                            border-radius: 12px;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                        ">
                            ${otp}
                        </div>

                        <p style="font-size: 14px; color: #94A3B8;">
                            This OTP is valid for 24 hours. If you didn't request this, please ignore this email.
                        </p>
                    </div>

                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; font-size: 12px; color: #475569;">
                        &copy; 2025 CareerLens
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        const mail = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Reset password",
            text: `Your OTP for password reset is: ${otp}\n\nDo not share this code. If you didn't request this, ignore this email.`,
            html,// <-- html template,
            attachments: fs.existsSync(logoPath) ? [
                {
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'logo@jrr'
                }
            ] : []
        };




        await user.save();
        await transport.sendMail(mail);
        return res.json({
            success: true,
            message: "Otp to reset your password sent to your email successfully"
        });
    } catch (e) {
        return res.json({
            success: false,
            message: e.message
        });
    }
};

const resetpassword = async (req, res) => {
    const { email, otp, password } = req.body
    if (!email || !otp || !password) {
        return res.json({
            success: false,
            message: "all fileds are required"
        })
    }
    console.log("reset pass route hit")
    try {
        const user = await UserModels.findOne({ email })
        if (!user) {
            console.log("sending res")
            return res.json({
                success: false,
                message: "user not found"
            })
        }
        if (otp !== user.ResetOTP) {
            console.log("sending res")
            return res.json({
                success: false,
                message: "invalid otp"
            })
        }
        if (user.ResetOTPexpireAt >= Date.now() && otp === user.ResetOTP) {
            user.password = await bcrypt.hash(password, 10)
            user.ResetOTP = ''
            user.ResetOTPexpireAt = 0
            await user.save()
            console.log("sending res")
            const html = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8" />
        <title>Password Reset Successful - CareerLens</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
            @keyframes slideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        </style>
        </head>
        <body style="background-color:#00002E;padding:0;margin:0;font-family:'Outfit', 'Segoe UI', sans-serif;color:#FFFFFF;">
            <div style="background: linear-gradient(180deg, #00002E 0%, #0D1B2A 100%); min-height: 100vh; padding: 40px 20px;">
                <!-- Decorative Blur Element -->
                <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100%; height: 300px; background: radial-gradient(ellipse at top, rgba(72,168,226,0.2), transparent 70%); pointer-events: none;"></div>
                
                <div style="
                    position: relative;
                    background: rgba(5, 5, 64, 0.8);
                    border: 1px solid #48A8E2;
                    max-width: 450px;
                    margin: 0 auto;
                    padding: 50px 30px;
                    border-radius: 24px;
                    text-align: center;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.6);
                ">
                    <div style="
                        width: 60px; height: 60px; 
                        background: #59ABA9; 
                        border-radius: 50%; 
                        margin: 0 auto 20px auto; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        box-shadow: 0 0 20px rgba(89, 171, 169, 0.4);
                    ">
                        <span style="font-size: 30px; color: white;">✓</span>
                    </div>

                    <h1 style="color: #FFFFFF; font-size: 24px; margin-bottom: 10px;">Success!</h1>
                    <p style="color: #48A8E2; margin-bottom: 30px; font-size: 16px;">Your password has been reset.</p>

                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; margin-bottom: 30px; text-align: left;">
                        <p style="color: #CBD5E1; margin: 5px 0;">Account: <span style="color: #FFF;">${user.email}</span></p>
                        <p style="color: #CBD5E1; margin: 5px 0;">ID: <span style="color: #FFF;">${user.userID}</span></p>
                    </div>

                    <div style="font-size: 18px; color: #F2B42D; font-weight: bold; margin-bottom: 30px; border-bottom: 1px dashed #555; padding-bottom: 20px;">
                        New Password: <span style="color: #FFF;">${password}</span>
                    </div>

                    <p style="color: #94A3B8; font-size: 14px;">
                        If you didn't initiate this change, please contact support immediately.
                    </p>
                    
                    <div style="margin-top: 40px; font-size: 12px; color: #555;">
                        CareerLens Security Team
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

            const mail = {
                from: process.env.SENDER_EMAIL,
                to: user.email,
                subject: "Reset password successful",
                text: `Your account password has been successfully reset for the account associated ${user.email}.\n
               Account id : ${user.userID}`,
                html,// <-- html template,
                attachments: fs.existsSync(logoPath) ? [
                    {
                        filename: 'logo.png',
                        path: logoPath,
                        cid: 'logo@jrr'
                    }
                ] : []
            };




            await user.save();
            await transport.sendMail(mail);

            return res.json(({
                success: true,
                message: "password reset successful"
            }))
        } else {
            console.log("sending res")
            return res.json({
                success: false,
                message: "otp expired"
            })
        }
    } catch (e) {
        return res.json({
            success: false,
            message: e.message
        })
    }
}
const userdata = async (req, res) => {
    try {
        const { userID } = req.body;
        const user = await UserModels.findById(userID);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Fetch detailed profile info
        const Student = require('../models/student');
        const CollegeStudent = require('../models/collegeStudent');
        const IndustryWorker = require('../models/industryWorker');
        const CareerReport = require('../models/CareerReport');
        const Assessment = require('../models/assessment');
        const ResumeReport = require('../models/ResumeReport');
        const Task = require('../models/Task');
        const HabitPlan = require('../models/HabitPlan');

        let profile = await Student.findOne({ userID });
        let status = 'User';
        let profileDetails = {};
        let targetRole = 'Career Explorer';

        if (profile) {
            status = 'Student';
            profileDetails = profile.toObject();
            targetRole = profile.interestedDegree || 'Student';
        } else {
            profile = await CollegeStudent.findOne({ userID });
            if (profile) {
                status = 'College Student';
                profileDetails = profile.toObject();
                targetRole = (profile.interestedrole && profile.interestedrole.length > 0)
                    ? profile.interestedrole[0]
                    : (profile.interestedField && profile.interestedField.length > 0 ? profile.interestedField[0] : 'Engineer');
            } else {
                profile = await IndustryWorker.findOne({ userID });
                if (profile) {
                    status = 'Professional';
                    profileDetails = profile.toObject();
                    targetRole = profile.intentrole || (profile.interestedRole && profile.interestedRole.length > 0 ? profile.interestedRole[0] : 'Professional');
                }
            }
        }

        // AGGREGATE STATS
        const stats = {
            reports: {
                career: 0,
                skill: 0,
                resume: 0,
                social: 0
            },
            tasks: {
                total: 0,
                completed: 0,
                pending: []
            },
            habits: {
                streak: 0,
                todayCompleted: false
            }
        };

        // Check Reports
        const career = await CareerReport.findOne({ userID });
        if (career) {
            if (career.careerAnalysis?.html) stats.reports.career = 1;
            if (career.socialAnalysis?.html) stats.reports.social = 1;
        }

        const skill = await Assessment.findOne({ userID }).sort({ createdAt: -1 });
        if (skill && skill.finalReport) stats.reports.skill = 1;

        const resume = await ResumeReport.findOne({ userID }).sort({ generatedAt: -1 });
        if (resume) stats.reports.resume = 1;

        // Tasks
        const tasks = await Task.find({ userID }).sort({ createdAt: -1 });
        stats.tasks.total = tasks.length;
        stats.tasks.completed = tasks.filter(t => t.status === 'completed').length;
        stats.tasks.pending = tasks.filter(t => t.status === 'pending').slice(0, 3);

        // Habits
        const now = new Date();
        const habitPlan = await HabitPlan.findOne({
            userID,
            month: now.getMonth() + 1,
            year: now.getFullYear()
        });
        if (habitPlan && habitPlan.tasks.length > 0) {
            const dayIdx = now.getDate() - 1;
            stats.habits.todayCompleted = habitPlan.tasks.some(t => t.completions[dayIdx]);

            // Calculate streak (simplistic current month only for now)
            let streak = 0;
            for (let d = dayIdx; d >= 0; d--) {
                const dayDone = habitPlan.tasks.some(t => t.completions[d]);
                if (dayDone) streak++;
                else if (d < dayIdx) break; // Allow gap only if it's today and not done yet
            }
            stats.habits.streak = streak;
        }

        // Readiness calculation
        // 1. Foundation (20%): 5% per core report
        const foundationScore = (stats.reports.career + stats.reports.skill + stats.reports.resume + stats.reports.social) * 5;

        // 2. Aptitude (30%): Scaled version of skill assessment score
        const skillScore = skill && skill.finalReport?.overallScore ? (skill.finalReport.overallScore / 100) * 30 : 0;

        // 3. Execution (30%): Task completion ratio
        const taskScore = stats.tasks.total > 0 ? (stats.tasks.completed / stats.tasks.total) * 30 : 0;

        // 4. Consistency (20%): Habit streak (capped at 10 days for max bonus)
        const habitScore = Math.min((stats.habits.streak / 10) * 20, 20);

        const readinessValue = Math.round(foundationScore + skillScore + taskScore + habitScore);

        // Standardize Profile Photo URL (Robust Healing)
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        let photoPath = profileDetails.profilePhoto || '';

        if (photoPath && !photoPath.startsWith('http')) {
            // Normalize slashes
            photoPath = photoPath.replace(/\\/g, '/');
            // If it contains 'uploads/', extract from there to the end
            if (photoPath.includes('uploads/')) {
                photoPath = photoPath.substring(photoPath.indexOf('uploads/'));
            } else {
                // If it's just a filename or path without 'uploads', prepend it
                const parts = photoPath.split('/');
                photoPath = 'uploads/' + parts[parts.length - 1];
            }
        }

        const photoUrl = photoPath ? `${baseUrl}/${photoPath}` : '';

        res.json({
            success: true,
            userdata: {
                id: user._id,
                Name: user.Name,
                email: user.email,
                userID: user.userID,
                status: status,
                targetRole: targetRole,
                ...profileDetails,
                profilePhoto: photoUrl, // Final full URL
                stats: stats,
                readiness: readinessValue,
                userLinkedinProfileUrl: user.userLinkedinProfileUrl // Include this field
            }
        });
    } catch (e) {
        console.error("Userdata Fetch Error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
}
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userID = req.body.userID; // Injected by userauth middleware

    if (!currentPassword || !newPassword) {
        return res.json({
            success: false,
            message: "All fields are required"
        });
    }

    try {
        const user = await UserModels.findById(userID);
        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.json({
                success: false,
                message: "Incorrect current password"
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (e) {
        console.error("Change password error:", e);
        res.json({
            success: false,
            message: "Failed to change password"
        });
    }
};

const sendverifyotp = async (req, res) => {
    return res.json({
        success: false,
        message: "Account verification not implemented yet."
    });
}

const verifyaccount = async (req, res) => {
    return res.json({
        success: false,
        message: "Account verification not implemented yet."
    });
}

const updateLinkedinUrl = async (req, res) => {
    const { userID, linkedinUrl } = req.body;

    if (!linkedinUrl) {
        return res.status(400).json({
            success: false,
            message: "LinkedIn URL is required"
        });
    }

    try {
        const user = await UserModels.findById(userID);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.userLinkedinProfileUrl = linkedinUrl;
        await user.save();

        res.json({
            success: true,
            message: "LinkedIn profile URL saved successfully",
            linkedinUrl: user.userLinkedinProfileUrl
        });
    } catch (e) {
        console.error("Update LinkedIn URL Error:", e);
        res.status(500).json({
            success: false,
            message: "Failed to update LinkedIn profile URL"
        });
    }
}

const saveLinkedinCredentials = async (req, res) => {
    const { userID, sub, accessToken } = req.body;

    if (!sub || !accessToken) {
        return res.status(400).json({
            success: false,
            message: "LinkedIn sub and access token are required"
        });
    }

    try {
        const user = await UserModels.findById(userID);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Explicitly clear old credentials before saving new ones
        user.linkedinSub = '';
        user.linkedinAccessToken = '';

        // Save new credentials
        user.linkedinSub = sub;
        user.linkedinAccessToken = accessToken;
        await user.save();

        res.json({
            success: true,
            message: "LinkedIn credentials saved successfully"
        });
    } catch (e) {
        console.error("Save LinkedIn Credentials Error:", e);
        res.status(500).json({
            success: false,
            message: "Failed to save LinkedIn credentials"
        });
    }
}

module.exports = { register, login, logout, isauth, Resetpasswordotp, resetpassword, userdata, changePassword, sendverifyotp, verifyaccount, updateLinkedinUrl, saveLinkedinCredentials }