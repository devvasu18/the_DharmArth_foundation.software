import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  Ellipse,
  G
} from 'react-native-svg';

export default function DoctorSvg({ size = 38, ...props }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      {...props}
    >
      {/* Background Circle to give it a clean avatar look */}
      <Circle cx="256" cy="256" r="240" fill="#E0F2FE" />

      {/* Face & Head Group */}
      <G>
        {/* Ears */}
        <Path d="M165 210 C165 190, 186 195, 186 215 C186 235, 165 230, 165 210 Z" fill="#FCD0B4" />
        <Path d="M347 210 C347 190, 326 195, 326 215 C326 235, 347 230, 347 210 Z" fill="#FCD0B4" />

        {/* Neck */}
        <Path d="M220 280 L220 350 H292 L292 280 Z" fill="#ECA985" />

        {/* Face */}
        <Path d="M185 180 C185 270, 205 310, 256 310 C307 310, 327 270, 327 180 C327 150, 185 150, 185 180 Z" fill="#FCD0B4" />
      </G>

      {/* Hair */}
      <G>
        {/* Back Hair */}
        <Path d="M178 180 C170 170, 172 130, 195 105 C215 85, 275 80, 310 100 C335 120, 342 160, 334 180 C330 150, 305 130, 256 130 C207 130, 182 150, 178 180 Z" fill="#1A1A1A" />
        {/* Main Swept Hair */}
        <Path d="M176 160 C170 130, 190 90, 230 75 C270 60, 320 70, 340 100 C350 115, 345 140, 340 155 C330 120, 280 110, 240 120 C200 130, 185 145, 176 160 Z" fill="#2D2D2D" />
        {/* Hair Strands/Details */}
        <Path d="M210 120 C240 110, 290 115, 335 145 C325 130, 280 125, 245 130 C210 135, 195 145, 195 145 Z" fill="#1A1A1A" />
      </G>

      {/* Face Details */}
      <G>
        {/* Eyebrows */}
        <Path d="M200 162 Q220 147 240 157" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" fill="none" />
        <Path d="M312 162 Q292 147 272 157" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" fill="none" />

        {/* Eyes */}
        <Ellipse cx="220" cy="188" rx="7" ry="9" fill="#1A1A1A" />
        <Circle cx="218" cy="185" r="2.5" fill="#FFFFFF" />
        
        <Ellipse cx="292" cy="188" rx="7" ry="9" fill="#1A1A1A" />
        <Circle cx="290" cy="185" r="2.5" fill="#FFFFFF" />

        {/* Nose */}
        <Path d="M256 188 C256 188 246 220 256 220" stroke="#ECA985" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <Path d="M251 218 Q256 223 261 218" stroke="#ECA985" strokeWidth="4.5" strokeLinecap="round" fill="none" />

        {/* Smile */}
        <Path d="M232 248 Q256 268 280 248" stroke="#B76E59" strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* Glasses */}
        <Rect x="190" y="168" width="55" height="42" rx="14" stroke="#1A1A1A" strokeWidth="7" fill="none" />
        <Rect x="267" y="168" width="55" height="42" rx="14" stroke="#1A1A1A" strokeWidth="7" fill="none" />
        <Path d="M245 183 H267" stroke="#1A1A1A" strokeWidth="7" strokeLinecap="round" />
        <Path d="M190 183 Q176 179 168 178" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" />
        <Path d="M322 183 Q336 179 344 178" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" />
      </G>

      {/* Body & Clothing */}
      <G>
        {/* Lab Coat / Torso Base */}
        <Path d="M110 400 C110 345 160 315 256 315 C352 315 402 345 402 400 L412 512 H100 L110 400 Z" fill="#FFFFFF" />
        
        {/* Blue Shirt Opening */}
        <Path d="M210 315 L256 395 L302 315 Z" fill="#BAD8FF" />
        
        {/* Shirt Collars */}
        <Path d="M210 315 L238 360 L256 350 Z" fill="#9CC3F2" />
        <Path d="M302 315 L274 360 L256 350 Z" fill="#9CC3F2" />

        {/* Dark Blue Tie */}
        <Path d="M248 350 H264 L260 365 H252 Z" fill="#1D3557" />
        <Path d="M252 365 H260 L266 430 L256 445 L246 430 Z" fill="#1D3557" />
        <Path d="M254 365 H258 L262 425 L256 438 L250 425 Z" fill="#2A4B7C" />

        {/* Coat Lapels */}
        <Path d="M210 315 L170 345 L210 435 L256 455" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M302 315 L342 345 L302 435 L256 455" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Chest Pocket */}
        <Path d="M295 385 H335 V435 C335 440 295 440 295 435 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />

        {/* Folded Arms */}
        {/* Under Arm */}
        <Path d="M105 450 C115 435 240 430 260 430 C270 430 270 480 260 495 L105 495 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3.5" />
        {/* Over Arm */}
        <Path d="M407 450 C397 435 272 430 252 430 C242 430 242 480 252 495 L407 495 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3.5" />
        
        {/* Blue Shirt Cuffs peeking out */}
        <Rect x="125" y="445" width="8" height="15" rx="2" fill="#BAD8FF" transform="rotate(-15 125 445)" />
        <Rect x="375" y="445" width="8" height="15" rx="2" fill="#BAD8FF" transform="rotate(15 375 445)" />
      </G>

      {/* Stethoscope */}
      <G>
        {/* Tubing around neck and shoulders */}
        <Path d="M195 320 C170 350 150 400 150 435 C150 470 175 480 190 480 C205 480 215 460 215 440" fill="none" stroke="#475569" strokeWidth="12" strokeLinecap="round" />
        <Path d="M317 320 C342 350 362 400 362 435" fill="none" stroke="#475569" strokeWidth="12" strokeLinecap="round" />
        
        {/* Metal Diaphragm/Chestpiece */}
        <Circle cx="215" cy="440" r="22" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="4" />
        <Circle cx="215" cy="440" r="12" fill="#475569" />
      </G>
    </Svg>
  );
}
