interface ColorAdjustModalProps {
    isVisible: boolean;
    onClose: () => void;
    onApply?: (settings: {
        brightness: number;
        color: string;
        tintOpacity: number;
    }) => void;
}
export default function ColorAdjustModal({ isVisible, onClose, onApply }: ColorAdjustModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
