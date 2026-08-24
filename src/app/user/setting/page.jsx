import UserSettings from "@/components/_User/SettingsPage";
export const runtime = 'nodejs';
const page = props => {
    return (
        <>
            <UserSettings />
        </>
    );
};

export default page;