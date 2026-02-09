import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';
import BackgroundShapes from '../components/BackgroundShapes';
import { Upload, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

const STEPS = [
    { num: 1, title: 'Personal Details' },
    { num: 2, title: 'Academic / Professional' },
    { num: 3, title: 'Interests & Goals' },
    { num: 4, title: 'Additional Info' }
];

const UserDetails = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const type = searchParams.get('type');

    // Form State
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({});
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!type) {
            navigate('/path');
        }
    }, [type, navigate]);

    const handleInputChange = (e) => {
        const { name, value, type: inputType, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: inputType === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const maxSteps = type === 'professional' ? 3 : 4;
    const nextStep = () => setStep(prev => Math.min(prev + 1, maxSteps));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            // 1. Skip Certs Flag for College (handled via details)
            if (key === 'certifications') {
                if (type === 'school') data.append(key, formData[key]);
                return;
            }

            // 2. Identify Simple Array Fields
            let simpleArrays = [];
            if (type === 'college') {
                simpleArrays = ['interestedField', 'passion', 'interestedCompany', 'skills', 'interestedrole'];
            } else if (type === 'professional') {
                simpleArrays = ['skills', 'interestedRole'];
            } else if (type === 'school') {
                simpleArrays = ['hobbies'];
            }

            if (simpleArrays.includes(key)) {
                if (typeof formData[key] === 'string' && formData[key].includes(',')) {
                    data.append(key, JSON.stringify(formData[key].split(',').map(s => s.trim())));
                } else {
                    data.append(key, JSON.stringify(formData[key] ? [formData[key]] : []));
                }
            }
            // 3. Complex Object Arrays (College)
            else if (key === 'projects' && type === 'college') {
                if (formData[key]) {
                    data.append(key, JSON.stringify([{ title: "Student Project", description: formData[key], link: "" }]));
                }
            }
            else if (key === 'experience') {
                if (type === 'college') {
                    if (formData[key]) {
                        data.append(key, JSON.stringify([{ company: "N/A", role: "N/A", duration: "", description: formData[key] }]));
                    }
                } else {
                    data.append(key, formData[key]);
                }
            }
            else if (key === 'certificationsDetails') {
                if (type === 'college' && formData[key]) {
                    data.append('certifications', JSON.stringify([{ name: formData[key], issuer: "Self Reported", date: new Date() }]));
                }
            }
            // 4. Default
            else {
                data.append(key, formData[key]);
            }
        });

        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && storedUser.id) {
            data.append('userID', storedUser.id);
        } else {
            data.append('userID', 'demo_user_' + Date.now());
        }

        data.append('status', type === 'school' ? 'student' : type === 'college' ? 'collegeStudent' : 'industryWorker');

        if (file) {
            data.append('profilePhoto', file);
        }

        try {
            let endpoint = '';
            if (type === 'school') endpoint = 'http://127.0.0.1:3000/careerlens/student/add';
            if (type === 'college') endpoint = 'http://127.0.0.1:3000/careerlens/collegestudent/register';
            if (type === 'professional') endpoint = 'http://127.0.0.1:3000/careerlens/industryworker/create';

            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            };

            await axios.post(endpoint, data, config);
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            setMessage(error.response?.data?.message || 'Error saving details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderField = (label, name, type = "text", placeholder = "", required = true) => (
        <div className="flex flex-col gap-2">
            <label className="text-gray-300 text-sm font-medium">{label}</label>
            {type === "textarea" ? (
                <textarea
                    name={name}
                    value={formData[name] || ''}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-[#F2B42D] focus:ring-0 transition-all outline-none min-h-[80px]"
                    placeholder={placeholder}
                    onChange={handleInputChange}
                    required={required}
                />
            ) : (
                <input
                    name={name}
                    type={type}
                    value={formData[name] || ''}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-[#F2B42D] focus:ring-0 transition-all outline-none"
                    placeholder={placeholder}
                    onChange={handleInputChange}
                    required={required}
                />
            )}
        </div>
    );

    const renderSelect = (label, name, options, required = true) => (
        <div className="flex flex-col gap-2">
            <label className="text-gray-300 text-sm font-medium">{label}</label>
            <select
                name={name}
                value={formData[name] || ''}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-[#F2B42D] focus:ring-0 transition-all outline-none cursor-pointer"
                onChange={handleInputChange}
                required={required}
            >
                <option value="" disabled>Select {label}</option>
                {options.map(opt => (
                    <option key={opt.val} value={opt.val} className="bg-[#00002E]">{opt.label}</option>
                ))}
            </select>
        </div>
    );

    const renderConditionalField = (label, mainName, detailName, options) => (
        <div className="flex flex-col gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
            {renderSelect(label, mainName, options)}
            {formData[mainName] === 'yes' && (
                <div className="animate-fade-in ml-4 pl-4 border-l-2 border-[#F2B42D]">
                    {renderField(`Details about ${label}`, detailName, "textarea", "Please provide more details...", true)}
                </div>
            )}
        </div>
    );

    const renderStep1_Personal = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-32 h-32 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-[#F2B42D] transition-all">
                    {file ? (
                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#F2B42D]" />
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
                </div>
                <span className="text-sm text-gray-400 mt-2">Upload Profile Photo</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField("Date of Birth", "dob", "date")}
                {type !== 'professional' && renderField("Language Preference", "languagePreference", "text", "e.g. English")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField("Pincode", "pincode")}
                {renderField("City", "city")}
            </div>
            {renderField("Address", "address")}
        </div>
    );

    const renderStep2_Academic = () => (
        <div className="space-y-6 animate-fade-in">
            {type === 'school' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderField("School Name", "schoolName", "text", "e.g. Delhi Public School")}
                        {renderSelect("Education Board", "board", [
                            { val: "cbse", label: "CBSE" }, { val: "icse", label: "ICSE" }, { val: "state", label: "State Board" }, { val: "ib", label: "IB" }
                        ])}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderField("Standard / Class", "standard", "text", "e.g. 10th, 12th")}
                        {renderField("Subject / Stream", "subject", "text", "e.g. PCM, Commerce")}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderSelect("English Proficiency", "englishProficiency", [
                            { val: "beginner", label: "Beginner" }, { val: "intermediate", label: "Intermediate" }, { val: "fluent", label: "Fluent" }
                        ])}
                        {renderField("Last Exam Percentage", "lastExamPercentage", "text", "e.g. 90%")}
                    </div>
                    {renderField("Current Grade", "currentGrade", "text", "e.g. A1")}
                </>
            )}
            {type === 'college' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderField("College Name", "collegeName")}
                        {renderField("Current Degree", "degree", "text", "e.g. B.Tech")}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderField("Academic Year", "academicYear", "text", "e.g. 2023-2027")}
                        {renderField("CGPA", "cgpa", "text", "e.g. 8.5")}
                    </div>
                    {renderSelect("English Proficiency", "englishProficiency", [
                        { val: "beginner", label: "Beginner" }, { val: "intermediate", label: "Intermediate" }, { val: "fluent", label: "Fluent" }
                    ])}
                </>
            )}
            {type === 'professional' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderField("Company Name", "companyName")}
                        {renderField("Current Role", "role")}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderField("Work Location", "workLocation")}
                        {renderField("Domain", "domain", "text", "e.g. Fintech")}
                    </div>
                    {renderField("Total Experience", "experience", "text", "e.g. 3 Years")}
                    {renderField("Highest Education", "education", "text", "e.g. B.Tech")}
                </>
            )}
        </div>
    );

    const renderStep3_Interests = () => (
        <div className="space-y-6 animate-fade-in">
            {type === 'school' && (
                <>
                    {renderField("Interested Degree", "interestedDegree", "text", "e.g. B.Tech CS")}
                    {renderField("Interested Colleges", "interestedCollege", "text", "e.g. IIT Bombay")}
                    {renderField("Passion", "passion", "text", "e.g. Coding, Music")}
                    {renderField("Hobbies", "hobbies", "text", "e.g. Reading, Gaming")}
                </>
            )}
            {type === 'college' && (
                <>
                    {renderField("Interested Field/Domain", "interestedField", "text", "e.g. AI")}
                    {renderField("Interested Role", "interestedrole", "text", "e.g. Data Scientist")}
                    {renderField("Interested Company", "interestedCompany", "text", "e.g. Google")}
                    {renderField("Career Intent Timeline", "careerIntentTimeline", "text", "e.g. Job immediately after graduation")}
                    {renderField("Skills", "skills", "text", "e.g. Python, Java")}
                    {renderField("Projects", "projects", "textarea", "Describe your projects...")}
                    {renderField("Experience / Internships", "experience", "textarea", "Describe your experience...")}
                </>
            )}
            {type === 'professional' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderField("Current CTC", "currentCTC", "text", "e.g. 10 LPA")}
                        {renderField("Expected CTC", "expectedCTC", "text", "e.g. 15 LPA")}
                    </div>
                    {renderSelect("Looking to Switch Role?", "roleswitch", [{ val: "yes", label: "Yes" }, { val: "no", label: "No" }])}
                    {renderField("Target Role / Intent", "intentrole", "text", "e.g. Product Manager")}
                    {renderField("Interested Role", "interestedRole", "text", "e.g. Tech Lead", false)}
                    {renderField("Skills", "skills", "text", "e.g. React, Node.js")}
                    {/* Note: 'interestedRole' distinct from 'intentrole' in schema? Assuming one is array, one string. Keeping simpler mapping for now. */}
                </>
            )}
        </div>
    );

    const renderStep4_Extras = () => (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-[#F2B42D] font-bold text-lg mb-4">Additional Information</h3>
            <p className="text-gray-400 text-sm mb-6">Help us understand your background better.</p>

            {/* Common Extras Logic - applied generally but schema fields might vary. 
                Focusing on School fields as requested, but logic is re-usable. 
                Ideally backend schemas for College/Pro should handle these too. 
                Using "details" suffix for text inputs. 
            */}

            {/* School Only Fields */}
            {type === 'school' && (
                <>
                    {renderConditionalField("Online Courses?", "onlineCourses", "onlineCoursesDetails", [{ val: "yes", label: "Yes" }, { val: "no", label: "No" }])}
                    {renderConditionalField("Competitions?", "competitions", "competitionsDetails", [{ val: "yes", label: "Yes" }, { val: "no", label: "No" }])}
                    {renderConditionalField("Tech Exposure?", "techExposure", "techExposureDetails", [{ val: "yes", label: "Yes" }, { val: "no", label: "No" }])}
                    {renderSelect("Parental Influence?", "parentalInfluence", [{ val: "yes", label: "Yes" }, { val: "no", label: "No" }])}
                </>
            )}

            {/* School and College Fields */}
            {(type === 'school' || type === 'college') && (
                renderConditionalField("Certifications?", "certifications", "certificationsDetails", [{ val: "yes", label: "Yes" }, { val: "no", label: "No" }])
            )}
        </div>
    );

    return (
        <div className="bg-[#00002E] min-h-screen font-display text-white relative overflow-x-hidden">
            <BackgroundShapes />

            {/* Header */}
            <div className="absolute top-6 left-6 z-20">
                <Logo />
            </div>

            <main className="relative z-10 flex flex-col items-center justify-center py-20 px-4">
                <div className="w-full max-w-4xl">
                    <div className="text-center mb-10">
                        <p className="text-[#F2B42D] font-bold tracking-widest uppercase text-xs mb-2">Step {step} of {maxSteps}</p>
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">
                            {STEPS[step - 1].title}
                        </h1>
                        {/* Stepper Indicator */}
                        <div className="flex items-center justify-center gap-2 mt-6">
                            {STEPS.slice(0, maxSteps).map((s) => (
                                <div key={s.num} className={`h-1.5 rounded-full transition-all duration-300 ${s.num <= step ? 'w-8 bg-[#F2B42D]' : 'w-4 bg-white/10'}`} />
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden transition-all duration-500">
                        {message && (
                            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200">
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>

                            <div className="min-h-[400px]">
                                {step === 1 && renderStep1_Personal()}
                                {step === 2 && renderStep2_Academic()}
                                {step === 3 && renderStep3_Interests()}
                                {step === 4 && renderStep4_Extras()}
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-between pt-8 border-t border-white/10 mt-8">
                                {step > 1 ? (
                                    <button type="button" onClick={prevStep} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                                        <ChevronLeft size={20} /> Back
                                    </button>
                                ) : (
                                    <button type="button" onClick={() => navigate('/path')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                                        <ChevronLeft size={20} /> Change Path
                                    </button>
                                )}

                                {step < maxSteps ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-all"
                                    >
                                        Next <ChevronRight size={20} />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center gap-2 bg-[#F2B42D] hover:bg-[#d97706] text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-[#F2B42D]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Saving...' : 'Finish'}
                                        {!loading && <CheckCircle size={20} />}
                                    </button>
                                )}
                            </div>

                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserDetails;
