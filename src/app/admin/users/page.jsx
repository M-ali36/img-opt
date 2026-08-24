import UsersPage from "@/components/_Admin/UserList";

export const runtime = 'edge';
const Users = props => {
    return (
        <>
          <UsersPage />  
        </>
    );
};

export default Users;