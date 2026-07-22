import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';

export default function XRaySvg({ size = 38, ...props }) {
  const outline = "#2D415A";
  const skin = "#FAD3AC";
  const machineBase = "#D4DAE8";
  const machineAccent = "#9EA7BA";
  const gown = "#E1EAFC";
  const beam = "#FFF1C1";
  const ecg = "#1BA2E5";
  const hair = "#3D4F66";

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      {...props}
    >
      {/* Left Machine Column */}
      <Rect x="40" y="140" width="40" height="340" rx="10" fill={machineBase} stroke={outline} strokeWidth="12" />
      <Rect x="80" y="170" width="25" height="200" rx="10" fill={machineAccent} stroke={outline} strokeWidth="12" />

      {/* Beam */}
      <Path d="M190 180 L390 140 L390 340 L190 320 Z" fill={beam} />
      
      {/* ECG Line */}
      <Path d="M190 250 L220 250 L240 190 L270 310 L300 230 L320 270 L340 250 L390 250" stroke={ecg} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />

      {/* Right Machine Columns */}
      <Rect x="400" y="110" width="40" height="370" rx="15" fill={machineBase} stroke={outline} strokeWidth="12" />
      
      {/* Scanner parts connecting to beam */}
      <Rect x="350" y="150" width="100" height="40" rx="10" fill={machineBase} stroke={outline} strokeWidth="12" />
      <Rect x="350" y="290" width="100" height="40" rx="10" fill={machineBase} stroke={outline} strokeWidth="12" />
      
      <Rect x="380" y="190" width="20" height="100" fill={machineAccent} stroke={outline} strokeWidth="12" />
      <Rect x="440" y="170" width="40" height="140" rx="15" fill={machineBase} stroke={outline} strokeWidth="12" />
      
      <Rect x="370" y="460" width="100" height="20" rx="10" fill={machineBase} stroke={outline} strokeWidth="12" />

      {/* Person */}
      {/* Legs */}
      <Rect x="135" y="360" width="24" height="110" fill={skin} stroke={outline} strokeWidth="12" />
      <Path d="M129 460 Q165 450 175 470 L129 470 Z" fill={skin} stroke={outline} strokeWidth="12" strokeLinejoin="round" />

      {/* Gown */}
      <Rect x="115" y="170" width="70" height="200" rx="10" fill={gown} stroke={outline} strokeWidth="12" />

      {/* Neck & Head */}
      <Rect x="145" y="130" width="25" height="40" fill={skin} stroke={outline} strokeWidth="12" />
      <Circle cx="165" cy="115" r="30" fill={skin} stroke={outline} strokeWidth="12" />
      
      {/* Nose */}
      <Path d="M190 115 L200 120 L190 128" fill={skin} stroke={outline} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Hair */}
      <Path d="M130 110 C130 90 150 70 175 75 C190 80 185 110 185 110 L160 115 C140 130 130 130 130 110 Z" fill={hair} stroke={outline} strokeWidth="10" strokeLinejoin="round" />

      {/* Arm */}
      <Rect x="140" y="230" width="25" height="90" rx="12" fill={skin} stroke={outline} strokeWidth="12" />
      {/* Sleeve */}
      <Rect x="130" y="170" width="45" height="70" rx="8" fill={gown} stroke={outline} strokeWidth="12" />

      {/* Base Line */}
      <Path d="M20 480 L492 480" stroke={outline} strokeWidth="12" strokeLinecap="round" />

    </Svg>
  );
}
