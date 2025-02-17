import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../services/supabase';

const Navbar: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName] = useState('');

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto p-4 flex items-center relative">
          {/* Logo */}
          <Link
            to="/"
            /* 
               - En móvil: position absolute y centrado.
               - A partir de md: se revierte a 'static' y se quita el transform.
            */
            className="
              absolute left-1/2 transform -translate-x-1/2
              md:static md:transform-none
            "
          >
            <img src="/ococalli.png" alt="Cocoalli" className="h-16 w-auto" />
          </Link>

          {/* Menú de escritorio (oculto en móvil) */}
          <div className="hidden md:flex flex-1 justify-center space-x-8">
            <Link
              to="/"
              className="text-gray-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 shadow-md"
            >
              Inicio
            </Link>
            <Link
              to="/admin"
              className="text-gray-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 shadow-md"
            >
              Admin Panel
            </Link>
          </div>

          {/* Controles de usuario (ocultos en móvil) */}
          <div className="hidden md:flex items-center space-x-4 ml-auto">
            {session ? (
              <>
                <span className="text-gray-800 text-sm font-medium">
                  {userName || session.user.email}
                </span>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  }}
                  className="text-gray-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 shadow-md"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-gray-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 shadow-md"
              >
                Iniciar sesión
              </Link>
            )}
          </div>

          {/* Botón Hamburger (visible solo en móvil) */}
          <div className="md:hidden ml-auto">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-800 p-2 rounded-md hover:bg-gray-200 shadow-md"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar en móvil (ejemplo) */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-xl
          transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          transition-transform duration-300 ease-in-out z-50
        `}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Logo dentro de sidebar (opcional) */}
          <div className="mb-4">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <img
                src="/ococalli.png"
                alt="Cocoalli"
                className="h-16 w-auto mx-auto"
              />
            </Link>
          </div>

          {/* Links */}
          <nav className="flex-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 shadow-md mb-2"
            >
              Inicio
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 shadow-md"
            >
              Admin Panel
            </Link>
          </nav>

          {/* Controles de usuario en móvil */}
          <div className="mt-auto">
            {session ? (
              <>
                <span className="text-gray-800 text-sm font-medium block mb-2">
                  {userName || session.user.email}
                </span>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  }}
                  className="w-full text-left text-gray-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 shadow-md"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left text-gray-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 shadow-md"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Overlay para cerrar sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
