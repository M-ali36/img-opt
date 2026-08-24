import UserSettings from "@/components/_User/SettingsPage";
export const runtime = 'edge';
const page = props => {
    return (
        <>
            <UserSettings />
        </>
    );
};

export default page;