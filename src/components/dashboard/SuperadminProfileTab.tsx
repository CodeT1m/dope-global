import ProfileTab from "./ProfileTab";

interface SuperadminProfileTabProps {
  userId: string;
}

const SuperadminProfileTab = ({ userId }: SuperadminProfileTabProps) => {
  return <ProfileTab userId={userId} />;
};

export default SuperadminProfileTab;