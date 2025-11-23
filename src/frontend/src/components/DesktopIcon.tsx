import { useState } from 'react';
import { Monitor, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

interface DesktopIconProps {
  isAuthenticated: boolean;
  onDoubleClick: () => void;
}

export default function DesktopIcon({ isAuthenticated, onDoubleClick }: DesktopIconProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2 cursor-pointer select-none"
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      style={{ userSelect: 'none' }}
    >
      {/* Icon Container */}
      <div
        className={`w-16 h-16 bg-[#C0C0C0] bevel flex items-center justify-center ${
          isPressed ? 'bevel-pressed' : ''
        }`}
        style={{
          border: '3px solid',
          borderTopColor: 'white',
          borderLeftColor: 'white',
          borderBottomColor: '#808080',
          borderRightColor: '#808080',
        }}
      >
        {isAuthenticated ? (
          <Monitor className="text-[#000080]" size={32} />
        ) : (
          <Terminal className="text-[#000080]" size={32} />
        )}
      </div>
      
      {/* Label */}
      <div 
        className="text-xs font-bold text-white text-center px-1 bg-[#000080]"
        style={{
          border: '2px solid',
          borderTopColor: 'white',
          borderLeftColor: 'white',
          borderBottomColor: '#808080',
          borderRightColor: '#808080',
        }}
      >
        ACCESS_TERMINAL
      </div>
    </motion.div>
  );
}

