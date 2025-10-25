import React from 'react';
import { Modal, Steps, Typography, Progress, Spin } from 'antd';
import { 
  LoadingOutlined, 
  RobotOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined,
  EditOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface AIProcessingStep {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'wait' | 'process' | 'finish' | 'error';
}

interface AIProcessingModalProps {
  open: boolean;
  currentStep: number;
  steps: AIProcessingStep[];
  processingTime: number;
  onCancel?: () => void;
}

const AIProcessingModal: React.FC<AIProcessingModalProps> = ({
  open,
  currentStep,
  steps,
  processingTime,
  onCancel,
}) => {
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} วินาที`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} นาที ${remainingSeconds} วินาที`;
  };

  const currentStepData = steps[currentStep];
  const progressPercent = Math.min(((currentStep + 1) / steps.length) * 100, 100);

  return (
    <Modal
      open={open}
      centered
      closable={false}
      footer={null}
      width={600}
      maskClosable={false}
      height={"95vh"}
    
      styles={{
        content: {
          padding: '40px 32px',
          borderRadius: '16px',
        },
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <RobotOutlined 
            style={{ 
              fontSize: '48px', 
              color: '#1890ff',
              marginBottom: '16px',
              display: 'block'
            }} 
          />
          <Title level={3} style={{ margin: 0, marginBottom: '8px' }}>
            กำลังประมวลผลด้วย AI
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            กรุณารอสักครู่ ระบบกำลังสรุปและปรับแต่งคำอธิบาย
          </Text>
        </div>

        {/* Progress Overview */}
        <div style={{ marginBottom: '32px' }}>
          <Progress
            percent={progressPercent}
            strokeColor={{
              '0%': '#87d068',
              '100%': '#1890ff',
            }}
            trailColor="#f5f5f5"
            strokeWidth={8}
            showInfo={false}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '8px',
            fontSize: '14px',
            color: '#666'
          }}>
            <span>ขั้นที่ {currentStep + 1} จาก {steps.length}</span>
            <span>{formatTime(processingTime)}</span>
          </div>
        </div>

        {/* Current Step Animation */}
        {currentStepData && (
          <div style={{
            background: 'linear-gradient(135deg, #f6f9fc 0%, #e9f4ff 100%)',
            border: '2px solid #1890ff',
            borderRadius: '16px',
            padding: '32px 24px',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Animation */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(24, 144, 255, 0.1) 50%, transparent 100%)',
              animation: 'shimmer 2s infinite linear',
              zIndex: 0
            }} />
            
            <style jsx>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
              }
              
              @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-5px); }
                60% { transform: translateY(-3px); }
              }
            `}</style>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                fontSize: '40px', 
                marginBottom: '16px',
                color: '#1890ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #1890ff, #52c41a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(24, 144, 255, 0.3)'
                }}>
                  <Spin 
                    indicator={<LoadingOutlined style={{ fontSize: 28, color: 'white' }} />} 
                  />
                </div>
              </div>
              <Title level={3} style={{ 
                margin: 0, 
                marginBottom: '12px', 
                color: '#1890ff',
                textAlign: 'center'
              }}>
                {currentStepData.title}
              </Title>
              <Text style={{ 
                fontSize: '16px', 
                color: '#666',
                display: 'block',
                textAlign: 'center',
                lineHeight: '1.5'
              }}>
                {currentStepData.description}
              </Text>
            </div>
          </div>
        )}
      </div>

      {/* Steps Progress */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        marginBottom: '16px'
      }}>
        <Steps
          direction="vertical"
          size="default"
          current={currentStep}
          items={steps.map((step, index) => ({
            title: <span style={{ 
              color: index < currentStep ? '#52c41a' :
                     index === currentStep ? '#1890ff' : '#8c8c8c',
              fontWeight: index === currentStep ? 'bold' : 'normal',
              fontSize: '16px'
            }}>
              {step.title}
            </span>,
            description: <span style={{ 
              color: index < currentStep ? '#73d13d' :
                     index === currentStep ? '#69c0ff' : '#d9d9d9',
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              {step.description}
              {index < currentStep && (
                <span style={{ 
                  color: '#52c41a', 
                  marginLeft: '8px',
                  fontSize: '12px'
                }}>
                  ✓ เสร็จสิ้น
                </span>
              )}
            </span>,
            icon: <div style={{
              fontSize: '18px',
              color: index < currentStep ? '#52c41a' : 
                     index === currentStep ? '#1890ff' : '#d9d9d9',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: index < currentStep ? '#f6ffed' :
                         index === currentStep ? '#e6f7ff' : '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${index < currentStep ? '#52c41a' : 
                                  index === currentStep ? '#1890ff' : '#d9d9d9'}`,
              transition: 'all 0.3s ease'
            }}>
              {index < currentStep ? '✓' : (
                index === currentStep ? (
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 14, color: '#1890ff' }} />} />
                ) : step.icon
              )}
            </div>
          }))}
        />
      </div>

      {/* Footer Info */}
      <div style={{ 
        textAlign: 'center', 
        padding: '20px 16px',
        background: 'linear-gradient(135deg, #f6f9fc 0%, #e9f4ff 100%)',
        borderRadius: '12px',
        border: '1px solid #e6f7ff'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <RobotOutlined style={{ 
            fontSize: '18px', 
            color: '#1890ff',
            animation: 'pulse 2s infinite'
          }} />
          <Text style={{ 
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#1890ff'
          }}>
            AI กำลังทำงาน
          </Text>
        </div>
        <Text type="secondary" style={{ 
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.4'
        }}>
          กรุณารอสักครุ่ ระบบกำลังวิเคราะห์และปรับปรุงเนื้อหาให้ดีขึ้น
        </Text>
      </div>
    </Modal>
  );
};

export default AIProcessingModal;