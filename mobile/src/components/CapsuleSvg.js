import React from 'react';
import Svg, { Path, G, Rect, Circle } from 'react-native-svg';

export default function CapsuleSvg({ size = 38, ...props }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      {...props}
    >
      <G transform="rotate(45 256 256)">
        {/* Shadow/Background */}
        <Rect x="136" y="216" width="240" height="100" rx="50" fill="#000000" opacity="0.1" transform="translate(10, 10)" />

        {/* Left Half (White) */}
        <Path d="M136 216 h 120 v 100 h -120 a 50 50 0 0 1 -50 -50 v 0 a 50 50 0 0 1 50 -50 z" fill="#FFFFFF" />

        {/* Right Half (red) */}
        <Path d="M256 216 h 120 a 50 50 0 0 1 50 50 v 0 a 50 50 0 0 1 -50 50 h -120 v -100 z" fill="#f32323ff" />

        {/* Highlight for volume effect */}
        <Path d="M140 230 h 232" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" opacity="0.4" />

        {/* Division Line */}
        <Path d="M256 216 v 100" stroke="#CBD5E1" strokeWidth="4" />
      </G>

      {/* Decorative Plus */}
      <G opacity="0.9">
        <Circle cx="130" cy="130" r="24" fill="#FFFFFF" opacity="0.2" />
        <Path d="M130 115 v 30" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
        <Path d="M115 130 h 30" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
      </G>
    </Svg>
  );
}
