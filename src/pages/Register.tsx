// src/pages/Register.tsx
import React, { useState, useEffect } from 'react';
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
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    membership_plan_id: ''
  });
  const [currentStep, setCurrentStep] = useState<Step>(Step.PersonalData);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Generar código de membresía
  const generateMembershipCode = (): string => {
    return `OC-${Date.now()}`;
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
      if (!formData.password) {
        setErrorMessage('Por favor ingresa una contraseña.');
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

      setSuccessMessage(`¡Registro exitoso! Tu código de membresía es: ${membership_code}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
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
            <h2 className="text-xl font-bold mb-4 text-green-700">Datos Personales</h2>
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
              <label className="block mb-1 font-medium">Teléfono (opcional)</label>
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
            <h2 className="text-xl font-bold mb-4 text-green-700">Credenciales</h2>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Contraseña</label>
              <input
                type="password"
                name="password"
                className="border rounded w-full p-2 focus:border-green-500"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </>
        );
      case Step.SelectPlan:
        return (
          <>
            <h2 className="text-xl font-bold mb-4 text-green-700">Selecciona un Plan</h2>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Plan de Membresía</label>
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
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
            {formData.membership_plan_id && (
              <div className="text-sm bg-green-50 border border-green-200 p-3 rounded mt-2">
                {membershipPlans
                  .filter((p) => p.id === formData.membership_plan_id)
                  .map((p) => (
                    <div key={p.id}>
                      <p><strong>Descripción:</strong> {p.description}</p>
                      <p><strong>Precio:</strong> ${p.price}</p>
                      <p><strong>Duración:</strong> {p.duration_months} meses</p>
                      <p><strong>Meses gratis:</strong> {p.free_months}</p>
                      {p.subscription_fee > 0 ? (
                        <p><strong>Cuota de suscripción:</strong> ${p.subscription_fee}</p>
                      ) : (
                        <p><strong>Inscripción gratis</strong></p>
                      )}
                    </div>
                  ))
                }
              </div>
            )}
          </>
        );
      case Step.Confirm:
        return (
          <>
            <h2 className="text-xl font-bold mb-4 text-green-700">Confirmar Datos</h2>
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <p><strong>Nombre:</strong> {formData.name}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Teléfono:</strong> {formData.phone || 'No especificado'}</p>
              <p><strong>Plan seleccionado:</strong>
                {
                  membershipPlans.find((p) => p.id === formData.membership_plan_id)
                    ?.name
                }
              </p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-green-700 text-center mb-4">
          Registro de Cliente
        </h1>
        <StepIndicator />

        {errorMessage && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-4">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 mb-4">
            {successMessage}
          </div>
        )}

        <div className="bg-white rounded shadow p-6 mb-4">
          {renderStep()}
        </div>

        <div className="flex justify-between">
          {currentStep > Step.PersonalData && currentStep <= Step.Confirm && (
            <button
              onClick={prevStep}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Anterior
            </button>
          )}
          {currentStep < Step.Confirm && (
            <button
              onClick={handleNext}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-auto"
            >
              Siguiente
            </button>
          )}
          {currentStep === Step.Confirm && (
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-auto"
            >
              Finalizar Registro
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
