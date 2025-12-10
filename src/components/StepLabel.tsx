'use client';

import { Box, Stepper, Step, StepLabel as MuiStepLabel, StepConnector, stepConnectorClasses, styled, Typography } from '@mui/material';
import { StepIconProps } from '@mui/material/StepIcon';
import CheckIcon from '@mui/icons-material/Check';

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 22,
    },
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            borderColor: '#141371',
            opacity: 1,
        },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            borderColor: '#141371',
            opacity: 1,
        },
    },
    [`& .${stepConnectorClasses.line}`]: {
        height: 3,
        border: 0,
        backgroundColor: '#eaeaf0',
        borderRadius: 1,
        transition: 'all 0.3s ease',
    },
}));

const CustomStepIconRoot = styled('div')<{ ownerState: { active?: boolean; completed?: boolean } }>(
    ({ theme, ownerState }) => ({
        backgroundColor: '#fff',
        zIndex: 1,
        color: '#9e9e9e',
        width: 40,
        height: 40,
        display: 'flex',
        borderRadius: '50%',
        justifyContent: 'center',
        alignItems: 'center',
        border: '2px solid #eaeaf0',
        transition: 'all 0.3s ease',
        cursor: 'default',

        ...(ownerState.active && {
            borderColor: '#141371',
            color: '#141371',
            backgroundColor: '#fff',
            boxShadow: '0 4px 10px 0 rgba(20, 19, 113, 0.25)',
            transform: 'scale(1.1)',
        }),

        ...(ownerState.completed && {
            borderColor: '#141371',
            backgroundColor: '#141371',
            color: '#fff',
        }),
    }),
);

function CustomStepIcon(props: StepIconProps) {
    const { active, completed, className } = props;

    return (
        <CustomStepIconRoot ownerState={{ active, completed }} className={className}>
            {completed ? (
                <CheckIcon sx={{ fontSize: 20 }} />
            ) : (
                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: 14 }}>
                    {props.icon}
                </Typography>
            )}
        </CustomStepIconRoot>
    );
}

interface StepLabelProps {
    steps: string[];
    activeStep?: number;
    onStepClick?: (index: number) => void;
}

export default function StepLabel({ steps, activeStep = 0, onStepClick }: StepLabelProps) {
    return (
        <Box sx={{ width: '100%', overflowX: 'auto', px: 1, py: 2 }}>
            <Stepper alternativeLabel nonLinear activeStep={activeStep} connector={<ColorlibConnector />}>
                {steps.map((label, index) => {
                    const isClickable = onStepClick && index <= activeStep;

                    return (
                        <Step key={label} completed={index < activeStep}>
                            <MuiStepLabel
                                StepIconComponent={CustomStepIcon}
                                onClick={() => {
                                    if (isClickable && onStepClick) {
                                        onStepClick(index);
                                    }
                                }}
                                sx={{
                                    cursor: isClickable ? 'pointer' : 'default',
                                    '& .MuiStepLabel-label': {
                                        mt: 1,
                                        fontSize: '0.875rem',
                                        fontWeight: index === activeStep ? 700 : 500,
                                        color: index <= activeStep ? '#1e293b' : '#94a3b8',
                                        transition: 'color 0.3s ease',
                                    },
                                    '&:hover .MuiStepLabel-label': {
                                        color: isClickable ? '#141371' : undefined,
                                    }
                                }}
                            >
                                {label}
                            </MuiStepLabel>
                        </Step>
                    );
                })}
            </Stepper>
        </Box>
    );
}