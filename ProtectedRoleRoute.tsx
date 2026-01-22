import { Redirect, Route, RouteProps } from 'react-router';
import { useAppSelector } from './hooks/loginHooks';


interface ProtectedRoleRouteProps extends RouteProps {
  roles: string[];
}

export const ProtectedRoleRoute: React.FC<ProtectedRoleRouteProps> = ({ component: Component, roles, ...rest }) => {
  const { isLoggedIn, userrol } = useAppSelector((state) => state.login);

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!isLoggedIn) {
          return <Redirect to={`/login`} />;
        }
        
        if (!roles.includes(userrol)) {
          return <Redirect to="/home" />;
        }
        return Component ? <Component {...props} /> : null;
      }}
    />
  );
}