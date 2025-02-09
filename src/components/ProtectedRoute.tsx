import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import supabase from '../services/supabase';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedEmails: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedEmails,
}) => {
  const [loading, setLoading] = useState(true);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      // Obtener la sesión actual de Supabase Auth
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSessionEmail(session?.user?.email || null);
      setLoading(false);
    };

    getSession();

    // Escuchar cambios de autenticación (login / logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    // Mostrar un loader mientras se verifica la sesión
    return <div className="p-4">Cargando...</div>;
  }

  // Verifica si el correo actual está en la lista permitida
  if (!sessionEmail || !allowedEmails.includes(sessionEmail)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
