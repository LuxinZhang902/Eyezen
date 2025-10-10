import React from 'react';
interface LoginModalProps {
    isVisible: boolean;
    onClose: () => void;
    onLogin: (email: string, password: string) => void;
    onSignup: (email: string, password: string, name: string) => void;
}
declare const LoginModal: React.FC<LoginModalProps>;
export default LoginModal;
