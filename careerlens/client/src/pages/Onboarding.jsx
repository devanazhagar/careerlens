import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, MapPin, Smartphone, Mail, Briefcase, GraduationCap,
    BookOpen, ChevronRight, CheckCircle, ArrowLeft
} from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundShapes from '../components/BackgroundShapes';
import FloatingTags from '../components/FloatingTags';
import './Onboarding.css';

const Onboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // ... (rest of the code)

    return (
        <div className="onboarding-container relative">
            <BackgroundShapes />
            <FloatingTags />

            {/* Branding */}
            <div className="absolute top-6 left-6 z-20">
                <Logo />
            </div>

            {renderStepIndicator()}

            <div className="onboarding-content">
                {step === 1 && renderStep1_Identity()}
                {step === 2 && renderStep2_Persona()}
                {step === 3 && renderStep3_Specifics()}
                {step === 4 && renderStep4_Confirmation()}
            </div>

            <div className="onboarding-footer">
                <button className="primary-btn" onClick={handleNext}>
                    {step === totalSteps ? 'Get Started' : 'Continue'}
                </button>
                {step > 1 && (
                    <button className="secondary-btn" onClick={handleBack}>
                        Back
                    </button>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
