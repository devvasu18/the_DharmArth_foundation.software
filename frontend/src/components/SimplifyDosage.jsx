import React from 'react';
import { Sun, Moon, Sunrise, Sunset, Coffee, Utensils, Droplet, Info, ShieldAlert } from 'lucide-react';
import './SimplifyDosage.css';

const SimplifyDosage = ({ 
    time, 
    foodRelation, 
    intakeMethod, 
    frequency, 
    additionalNotes 
}) => {

    const getSentences = () => {
        let instructions = [];

        // 1. When and Frequency
        let timePhrase = time ? time.toLowerCase().trim() : '';
        let freqPhrase = frequency ? frequency.toLowerCase().trim() : '';
        let foodPhrase = foodRelation ? foodRelation.toLowerCase().trim() : '';
        
        let sentence1 = 'Take this medicine';
        if (freqPhrase) {
            sentence1 += ` ${freqPhrase}`;
        }
        if (timePhrase) {
            const timeArr = timePhrase.split(',').map(t => t.trim()).filter(Boolean);
            if (timeArr.length > 0) {
                // If it's a single time, we can say "in the morning", "at night" etc.
                if (timeArr.length === 1) {
                    const t = timeArr[0];
                    if (t.includes('morning')) sentence1 += ' in the morning';
                    else if (t.includes('afternoon')) sentence1 += ' in the afternoon';
                    else if (t.includes('evening')) sentence1 += ' in the evening';
                    else if (t.includes('night')) sentence1 += ' at night';
                    else if (t.includes('breakfast')) sentence1 += ' during breakfast';
                    else sentence1 += ` at ${t}`;
                } else {
                    // Multiples: "in the morning and evening"
                    const formattedTimes = timeArr.map(t => {
                        if (t === 'night') return 'night';
                        return t;
                    });
                    const joinedTimes = formattedTimes.join(' and ');
                    sentence1 += ` (at ${joinedTimes})`;
                }
            }
        }
        
        if (foodPhrase) {
            if (foodPhrase.includes('before')) sentence1 += ' before eating food';
            else if (foodPhrase.includes('after')) sentence1 += ' after eating food';
            else if (foodPhrase.includes('empty')) sentence1 += ' on an empty stomach';
            else sentence1 += ` ${foodPhrase}`;
        }
        
        sentence1 += '.';
        instructions.push(sentence1);

        // 2. How to take
        if (intakeMethod) {
            let intakePhrase = intakeMethod.toLowerCase().trim();
            if (intakePhrase.includes('water')) {
                instructions.push('Drink it with a full glass of water.');
            } else if (intakePhrase.includes('milk')) {
                instructions.push('Drink it with a glass of milk.');
            } else if (intakePhrase.includes('dry')) {
                instructions.push('Chew or swallow it normally without water.');
            } else {
                instructions.push(`Take it ${intakePhrase}.`);
            }
        }

        return instructions;
    };

    const instructions = getSentences();

    const getTimeIcon = (timeStr) => {
        if (!timeStr) return <Clock size={20} className="icon time-icon" />;
        const t = timeStr.toLowerCase();
        if (t.includes('morning') || t.includes('breakfast')) return <Sunrise size={20} className="icon time-icon" />;
        if (t.includes('afternoon')) return <Sun size={20} className="icon time-icon" />;
        if (t.includes('evening')) return <Sunset size={20} className="icon time-icon" />;
        if (t.includes('night')) return <Moon size={20} className="icon time-icon" />;
        return <Clock size={20} className="icon time-icon" />;
    };

    const getFoodIcon = (foodStr) => {
        if (!foodStr) return <Utensils size={20} className="icon food-icon" />;
        if (foodStr.toLowerCase().includes('empty')) return <Coffee size={20} className="icon food-icon" />;
        return <Utensils size={20} className="icon food-icon" />;
    };

    return (
        <div className="friendly-dosage-card">
            <div className="dosage-header">
                <h3>How to Take This Medicine</h3>
            </div>
            
            <div className="dosage-instructions-list">
                {instructions.map((inst, idx) => (
                    <div key={idx} className="instruction-row">
                        <div className="instruction-bullet"></div>
                        <p>{inst}</p>
                    </div>
                ))}
            </div>

            <div className="dosage-icons-row">
                {time && (
                    <div className="dosage-badge">
                        {getTimeIcon(time)}
                        <span style={{textTransform: 'capitalize'}}>{time.split(',').join(' & ')}</span>
                    </div>
                )}
                {foodRelation && (
                    <div className="dosage-badge">
                        {getFoodIcon(foodRelation)}
                        <span>{foodRelation.replace('food', '').trim()}</span>
                    </div>
                )}
                {intakeMethod && (
                    <div className="dosage-badge">
                        <Droplet size={20} className="icon intake-icon" />
                        <span>{intakeMethod}</span>
                    </div>
                )}
            </div>

            {additionalNotes && (
                <div className="additional-notes-box">
                    <Info size={16} />
                    <p>{additionalNotes}</p>
                </div>
            )}
        </div>
    );
};

export default SimplifyDosage;
