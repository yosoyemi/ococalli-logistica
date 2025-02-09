// src/components/Navbar.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../services/supabase';
import { Bars3Icon, XMarkIcon, HomeIcon, WrenchIcon } from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName] = useState(''); // puedes usar un estado y fetch de la tabla 'users' si lo deseas

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
    <nav className="bg-white shadow-md">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link to="/" className="flex items-center mx-auto md:ml-32">
          <img src="/ococalli.png" alt="Cocoalli" className="h-16 w-auto" />
        </Link>
        <div className="hidden md:flex flex-1 justify-center space-x-8">
          <Link
            to="/"
            className="text-gray-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 shadow-md flex items-center space-x-2"
          >
            <HomeIcon className="h-5 w-5" aria-hidden="true" />
            <span>Inicio</span>
          </Link>
          <Link
            to="/admin"
            className="text-gray-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 shadow-md flex items-center space-x-2"
          >
            <WrenchIcon className="h-5 w-5" aria-hidden="true" />
            <span>Admin Panel</span>
          </Link>
        </div>

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

        {/* Menú móvil */}
        <div className="md:hidden flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="text-gray-800 focus:outline-none"
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Sidebar móvil */}
      <div
        className={`fixed inset-0 z-40 flex ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } transition-transform duration-300 ease-in-out mobile-menu ${
          mobileMenuOpen ? 'open' : ''
        }`}
      >
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-25"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl ml-auto">
              <div className="absolute top-0 left-0 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:bg-gray-600 close-button"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <XMarkIcon className="h-6 w-6 text-gray-800" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <nav className="mt-5 px-2 space-y-1">
                  <Link
                    to="/"
                    className="block text-gray-800 px-3 py-2 rounded-md text-base font-medium hover:bg-gray-200 flex items-center space-x-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <HomeIcon className="h-5 w-5" aria-hidden="true" />
                    <span>Inicio</span>
                  </Link>
                  <Link
                    to="/admin"
                    className="block text-gray-800 px-3 py-2 rounded-md text-base font-medium hover:bg-gray-200 flex items-center space-x-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <WrenchIcon className="h-5 w-5" aria-hidden="true" />
                    <span>Admin Panel</span>
                  </Link>
                  {session ? (
                    <>
                      <span className="block text-gray-800 px-3 py-2 rounded-md text-base font-medium">
                        {userName || session.user.email}
                      </span>
                      <button
                        onClick={async () => {
                          await supabase.auth.signOut();
                          window.location.href = '/';
                        }}
                        className="block text-gray-800 px-3 py-2 rounded-md text-base font-medium hover:bg-gray-200 w-full text-left"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className="block text-gray-800 px-3 py-2 rounded-md text-base font-medium hover:bg-gray-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login Admin
                    </Link>
                  )}
                </nav>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
