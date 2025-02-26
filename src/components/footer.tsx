import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 text-gray-800 py-10 px-6 text-center shadow-md">
      <div className="container mx-auto flex flex-col items-center">
        <img 
          src="/edge.jpeg" 
          alt="Icon" 
          className="w-32 h-20 mb-4 shadow-md transition-transform transform hover:scale-105" 
        />
        <p className="text-sm text-gray-600">&copy; 2025 Ococalli. Todos los derechos reservados.</p>
        <p className="text-sm text-gray-600 mt-1">
          Desarrollado por <strong className="text-gray-800">Headers</strong>
        </p>
        <a
          href="{*/Link*/}"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 mt-3 transition-all"
        >
          Conoce más sobre nosotros
        </a>
      </div>
    </footer>
  );
};

export default Footer;
