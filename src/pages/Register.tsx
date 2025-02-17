import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  // IMPORTANTE
import supabase from '../services/supabase';

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_months: number;
  free_months: number;
  subscription_fee: number;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  membership_plan_id: string;
}

// Pasos del formulario
enum Step {
  PersonalData = 1,
  Credentials,
  SelectPlan,
  Confirm,
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    membership_plan_id: ''
  });
  const [currentStep, setCurrentStep] = useState<Step>(Step.PersonalData);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('membership_plans')
          .select('*');
        if (error) throw error;
        setMembershipPlans(data as MembershipPlan[]);
      } catch (err: any) {
        console.error(err.message);
      }
    };
    fetchPlans();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const validateStep = (): boolean => {
    setErrorMessage('');
    setSuccessMessage('');

    if (currentStep === Step.PersonalData) {
      if (!formData.name || !formData.email) {
        setErrorMessage('Por favor completa nombre y email.');
        return false;
      }
    } else if (currentStep === Step.Credentials) {
      if (!formData.password || !formData.confirmPassword) {
        setErrorMessage('Por favor ingresa la contraseña y confirmala.');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('Las contraseñas no coinciden.');
        return false;
      }
    } else if (currentStep === Step.SelectPlan) {
      if (!formData.membership_plan_id) {
        setErrorMessage('Por favor selecciona un plan de membresía.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) nextStep();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const membership_code = generateMembershipCode();

    try {
      const { error } = await supabase
        .from('customers')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            membership_plan_id: formData.membership_plan_id,
            membership_code
          }
        ])
        .single();

      if (error) throw error;

      setSuccessMessage(
        `¡Registro exitoso! Tu código de membresía es: ${membership_code}`
      );

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message);
      setIsSubmitting(false);
    }
  };

  const generateMembershipCode = (): string => {
    return `OC-${Date.now().toString().slice(-5)}`;
  };

  const StepIndicator = () => {
    const totalSteps = 4;
    const current = currentStep;
    const percentage = Math.round((current / totalSteps) * 100);

    const stepsLabels = ['Datos', 'Credenciales', 'Plan', 'Confirmar'];

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {stepsLabels.map((label, idx) => {
            const stepNumber = idx + 1;
            const isActive = stepNumber <= current;
            return (
              <div key={label} className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 flex items-center justify-center rounded-full
                    ${isActive ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}
                  `}
                >
                  {stepNumber}
                </div>
                <span className="text-xs mt-1">{label}</span>
              </div>
            );
          })}
        </div>
        <div className="w-full bg-gray-200 h-2 rounded">
          <div
            className="bg-green-600 h-2 rounded"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case Step.PersonalData:
        return (
          <>
            <h2 className="text-xl font-bold mb-4 text-green-700">
              Datos Personales
            </h2>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Nombre</label>
              <input
                type="text"
                name="name"
                className="border rounded w-full p-2 focus:border-green-500"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                name="email"
                className="border rounded w-full p-2 focus:border-green-500"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Teléfono (opcional)
              </label>
              <input
                type="text"
                name="phone"
                className="border rounded w-full p-2 focus:border-green-500"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </>
        );
      case Step.Credentials:
        return (
          <>
            <h2 className="text-xl font-bold mb-4 text-green-700">
              Credenciales
            </h2>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="border rounded w-full p-2 focus:border-green-500"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2"
                >
                  <i
                    className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-500`}
                  ></i>
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Confirmar Contraseña</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="border rounded w-full p-2 focus:border-green-500"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-2"
                >
                  <i
                    className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-500`}
                  ></i>
                </button>
              </div>
            </div>
          </>
        );
      case Step.SelectPlan:
        return (
          <>
            <h2 className="text-xl font-bold mb-4 text-green-700">
              Selecciona un Plan
            </h2>
            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Plan de Membresía
              </label>
              <select
                name="membership_plan_id"
                className="border rounded w-full p-2 focus:border-green-500"
                value={formData.membership_plan_id}
                onChange={handleChange}
                required
              >
                <option value="">Elige una opción</option>
                {membershipPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.price} / mes
                  </option>
                ))}
              </select>
            </div>
          </>
        );
      case Step.Confirm:
        return (
          <>
            <h2 className="text-xl font-bold mb-4 text-green-700">Confirmar</h2>
            <div className="mb-4">
              <p>
                Nombre: {formData.name}
              </p>
              <p>
                Correo: {formData.email}
              </p>
              <p>
                Plan de Membresía:{' '}
                {membershipPlans.find(
                  (plan) => plan.id === formData.membership_plan_id
                )?.name || 'No seleccionado'}
              </p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <StepIndicator />
      {errorMessage && (
        <div className="mb-4 text-red-600">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="mb-4 text-green-600">{successMessage}</div>
      )}
      {renderStep()}
      <div className="flex justify-between mt-6">
        {currentStep > 1 && (
          <button
            onClick={prevStep}
            className="bg-gray-500 text-white py-2 px-4 rounded"
          >
            Atrás
          </button>
        )}
        <div>
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="bg-green-600 text-white py-2 px-4 rounded"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white py-2 px-4 rounded"
            >
              Confirmar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
