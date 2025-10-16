import React, { useEffect, useMemo, useState } from 'react';

interface ColorAdjustModalProps {
  isVisible: boolean;
  onClose: () => void;
  onApply?: (settings: { brightness: number; color: string; tintOpacity: number }) => void;
}

const PRESET_COLORS = [
  { name: 'Warm Amber (Best)', value: '#FFB74D', recommendation: true },
  { name: 'Soft Green', value: '#A5D6A7', recommendation: false },
  { name: 'Sepia', value: '#F5E0B3', recommendation: false },
  { name: 'Cool Gray', value: '#ECEFF1', recommendation: false }
];

export default function ColorAdjustModal({ isVisible, onClose, onApply }: ColorAdjustModalProps) {
  const [brightness, setBrightness] = useState<number>(1);
  const [tintColor, setTintColor] = useState<string>(PRESET_COLORS[0].value);
  const [tintOpacity, setTintOpacity] = useState<number>(0.25);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await chrome.storage?.local.get(['eyezen_color_settings']);
        const saved = result?.eyezen_color_settings;
        if (saved) {
          const normalizedBrightness = normalizeBrightness(saved.brightness);
          const normalizedOpacity = normalizeOpacity(saved.tintOpacity);
          setBrightness(normalizedBrightness);
          setTintColor(typeof saved.color === 'string' ? saved.color : PRESET_COLORS[0].value);
          setTintOpacity(normalizedOpacity);
        }
      } catch (_) {
        // no-op
      }
    };
    if (isVisible) load();
  }, [isVisible]);

  const overlayStyle = useMemo(() => ({
    backgroundColor: `${hexToRgba(tintColor, tintOpacity)}`,
    filter: `brightness(${brightness})`,
    transition: 'all 200ms ease'
  }), [tintColor, tintOpacity, brightness]);

  const handleApply = async () => {
    try {
      await chrome.storage?.local.set({
        eyezen_color_settings: { brightness, color: tintColor, tintOpacity }
      });
    } catch (_) {}
    onApply?.({ brightness, color: tintColor, tintOpacity });
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-[320px] max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>🎨</span>
            <h3 className="text-sm font-semibold">Adjust Screen Color</h3>
          </div>
          <button onClick={onClose} className="text-white/90 hover:text-white">✖️</button>
        </div>

        <div className="p-3 space-y-3 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Brightness</label>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={brightness}
              onChange={(e) => setBrightness(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">{Math.round(brightness * 100)}%</div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Protective Color</label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setTintColor(c.value)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs ${tintColor === c.value ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'}`}
                >
                  <span className="flex items-center space-x-2">
                    <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: c.value }} />
                    <span>{c.name}</span>
                  </span>
                  {c.recommendation && (
                    <span className="text-amber-600 font-semibold">Best</span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Tint Strength</label>
              <input
                type="range"
                min={0}
                max={0.6}
                step={0.05}
                value={tintOpacity}
                onChange={(e) => setTintOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Preview</label>
            <div className="border rounded-xl overflow-hidden">
              <div className="relative h-24 bg-gray-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs text-gray-700 px-3 py-1 bg-white/70 rounded">Sample text and UI preview</div>
                </div>
                <div className="absolute inset-0" style={overlayStyle} />
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              Note: Applying color to the entire screen may require system or browser settings.
            </p>
          </div>

          <div className="flex space-x-2 pt-2">
            <button onClick={onClose} className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">Cancel</button>
            <button onClick={handleApply} className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

function normalizeBrightness(value: any) {
  if (typeof value !== 'number' || isNaN(value)) return 1;
  // Accept either decimal (0.5–1.5) or percent (50–150)
  const normalized = value > 10 ? value / 100 : value;
  return clamp(normalized, 0.5, 1.5);
}

function normalizeOpacity(value: any) {
  if (typeof value !== 'number' || isNaN(value)) return 0.25;
  // Accept either decimal (0–1) or percent (0–100)
  const normalized = value > 1 ? value / 100 : value;
  return clamp(normalized, 0, 0.6);
}