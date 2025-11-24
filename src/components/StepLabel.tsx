'use client';

import React from 'react';
import {
    Box,
    Stepper,
    Step,
    StepLabel as MuiStepLabel,
    StepConnector,
    stepConnectorClasses,
    styled
} from '@mui/material';
import { StepIconProps } from '@mui/material/StepIcon';

// ... (ส่วน Styles และ CustomStepIcon เหมือนเดิม ไม่ต้องแก้) ...
// เพื่อความกระชับ ผมขอละส่วน Styles ไว้ ถ้าของเดิมมีอยู่แล้วใช้ต่อได้เลยครับ
const ColorlibConnector = styled(StepConnector)(() => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 15 },
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: { borderColor: '#141371' },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: { borderColor: '#141371' },
    },
    [`& .${stepConnectorClasses.line}`]: {
        borderColor: '#e0e0e0', borderTopWidth: 2, borderStyle: 'dotted', borderRadius: 1,
    },
}));

const CustomStepIcon = (props: StepIconProps) => {
    // เพิ่ม completed เพื่อให้สีเปลี่ยนเมื่อผ่านไปแล้ว
    const { active = false, completed = false, icon } = props;
    return (
        <Box
            sx={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                // เปลี่ยนสีถ้าเป็น active หรือ completed
                bgcolor: (active || completed) ? '#141371' : 'white',
                border: (active || completed) ? 'none' : '1px solid #ccc',
                color: (active || completed) ? 'white' : '#999',
                fontWeight: 'bold', fontSize: 14, zIndex: 1,
                cursor: 'pointer' // เพิ่ม cursor pointer ที่ icon ด้วย
            }}
        >
            {icon}
        </Box>
    );
};

// 👇 1. เพิ่ม onStepClick ใน Interface
interface StepLabelProps {
    steps: string[];
    activeStep?: number;
    onStepClick?: (index: number) => void;
}

export default function StepLabel({ steps, activeStep = 0, onStepClick }: StepLabelProps) {
    return (
        <Box sx={{ width: '100%', mb: 5, overflowX: 'auto' }}>
            {/* 👇 2. ใส่ nonLinear เพื่อให้กดข้ามขั้นตอนได้ */}
            <Stepper alternativeLabel nonLinear activeStep={activeStep} connector={<ColorlibConnector />}>
                {steps.map((label, index) => (
                    <Step key={label} completed={index < activeStep}>
                        {/* 👇 3. ใส่ onClick ที่ MuiStepLabel */}
                        <MuiStepLabel
                            onClick={() => onStepClick && onStepClick(index)}
                            slots={{ stepIcon: CustomStepIcon }}
                            slotProps={{ stepIcon: { icon: index + 1 } }}
                            sx={{ 
                                cursor: 'pointer',
                                '&:hover .MuiStepLabel-label': { color: '#141371' } 
                            }}
                        >
                            {label}
                        </MuiStepLabel>
                    </Step>
                ))}
            </Stepper>
        </Box>
    );
}