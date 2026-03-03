import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner = ({ size = 24, className = "" }) => {
    return (
        <Loader2
            size={size}
            className={`animate-spin text-[#ea580c] ${className}`}
        />
    );
};

export const FullPageSpinner = ({ message = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full h-full text-slate-400">
        <Spinner size={32} className="mb-4" />
        <p className="text-sm font-medium">{message}</p>
    </div>
);

export default Spinner;
