import React from 'react';
import Svg, { Path, G, Rect, Circle } from 'react-native-svg';

export default function CapsuleSvg({ size = 38, color = '#FFFFFF', ...props }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      {...props}
    >
      {/* Capsule Group rotated and translated */}
      <G transform="translate(210, 210) rotate(45)">
        {/* Outer Outline */}
        <Rect
          x="-65"
          y="-140"
          width="130"
          height="280"
          rx="65"
          stroke={color}
          strokeWidth="20"
          fill="none"
        />
        
        {/* Middle Divider Line */}
        <Path
          d="M -65,0 H 65"
          stroke={color}
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Solid Fill for the top-right half (top half before rotation) */}
        <Path
          d="M -48,-22 H 48 V -75 A 48,48 0 0,0 -48,-75 Z"
          fill={color}
        />
        
        {/* Highlight Groove in the top-left cap */}
        <Path
          d="M -36,-84 A 36,36 0 0,1 -12,-108"
          stroke="#2b9ebb"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
      </G>
      
      {/* Round Pill at bottom-right */}
      <Circle
        cx="350"
        cy="350"
        r="75"
        fill={color}
      />
      
      {/* Divider line/gap for the pill */}
      <Path
        d="M 265,350 H 435"
        stroke="#2b9ebb"
        strokeWidth="18"
        strokeLinecap="round"
      />
    </Svg>
  );
}
