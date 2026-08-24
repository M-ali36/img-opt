import UserDashboard from "@/components/_User/Dashboard";

export const runtime = 'edge';
const User = props => {
    return (
        <>
            <UserDashboard />
        </>
    );
};

export default User;