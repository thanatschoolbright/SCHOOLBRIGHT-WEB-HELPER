//** Functionality: Logo header component for authentication pages
import {Typography} from "antd";

const {Title} = Typography;

export default function LogoHeader() {
    return (
        <Title level={3} style={{textAlign: 'center', marginBottom: 24}}>เข้าสู่ระบบ</Title>
    );
}
