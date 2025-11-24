'use client';

import React from 'react';
import { Box, Stepper, Step, StepLabel as MuiStepLabel, StepConnector, stepConnectorClasses, styled } from '@mui/material';
import { StepIconProps } from '@mui/material/StepIcon';

const ColorlibConnector = styled(StepConnector)(() => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 15 },
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: { borderColor: '#141371' },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: { borderColor: '#141371' },
    },
    [`& .${stepConnectorClasses.line}`]: {
        borderColor: '#e0e0e0', borderTopWidth: 2, borderRadius: 1,
    },
}));

const CustomStepIcon = (props: StepIconProps) => {
    const { active = false, completed = false, icon } = props;
    return (
        <Box
            sx={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: (active || completed) ? '#141371' : 'white',
                border: (active || completed) ? 'none' : '1px solid #ccc',
                color: (active || completed) ? 'white' : '#999',
                fontWeight: 'bold', fontSize: 14, zIndex: 1,
            }}
        >
            {icon}
        </Box>
    );
};

interface StepLabelProps {
    steps: string[];
    activeStep?: number;
    onStepClick?: (index: number) => void;
}

export default function StepLabel({ steps, activeStep = 0, onStepClick }: StepLabelProps) {
    return (
        <Box sx={{ width: '100%', mb: 1, overflowX: 'auto' }}>
            <Stepper alternativeLabel nonLinear activeStep={activeStep} connector={<ColorlibConnector />}>
                {steps.map((label, index) => (
                    <Step key={label} completed={index < activeStep}>
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