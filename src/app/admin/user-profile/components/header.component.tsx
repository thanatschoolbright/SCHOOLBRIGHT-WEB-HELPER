import { ReloadOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";
import { HeaderBar } from "@components/typhography/header-bar-component";

interface HeaderProps {
  title: string;
  subtitle: string;
  refreshLabel: string;
  onRefresh: () => void;
}

export const HeaderSection = ({ title, subtitle, refreshLabel, onRefresh }: HeaderProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <HeaderBar title={title} subTitle={subtitle} icon={<UserOutlined />} color="none" />
    <Space>
      <Button
        type="primary"
        icon={<ReloadOutlined />}
        onClick={onRefresh}
        className="shadow-sm transition-all duration-200 hover:shadow-lg"
      >
        {refreshLabel}
      </Button>
    </Space>
  </div>
);
