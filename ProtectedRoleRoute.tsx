import { Redirect, Route, RouteProps } from 'react-router';
import { useAppSelector } from './hooks/loginHooks';

// Map role IDs to role codes
const ROLE_ID_TO_CODE: Record<string, string> = {
  '1': 'ADM',  // Administrador
  '2': 'SUP',  // Supervisor
  '3': 'USR',  // Usuario
  '4': 'VIS',  // Visitante
};

interface ProtectedRoleRouteProps extends RouteProps {
  roles: string[];
}

export const ProtectedRoleRoute: React.FC<ProtectedRoleRouteProps> = ({ component: Component, roles, ...rest }) => {
  const { isLoggedIn, userrol } = useAppSelector((state) => state.login);

  // Convert userrol to role code if it's a number/ID
  const getRoleCode = (role: string | number): string => {
    const roleStr = String(role);
    return ROLE_ID_TO_CODE[roleStr] || roleStr;
  };

  const userRoleCode = getRoleCode(userrol);
  
  console.log('[ProtectedRoute] isLoggedIn:', isLoggedIn);
  console.log('[ProtectedRoute] userrol (raw):', userrol);
  console.log('[ProtectedRoute] userRoleCode:', userRoleCode);
  console.log('[ProtectedRoute] allowed roles:', roles);
  console.log('[ProtectedRoute] has access:', roles.includes(userRoleCode));

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!isLoggedIn) {
          console.log('[ProtectedRoute] Not logged in, redirecting to login');
          return <Redirect to={`/login`} />;
        }
        
        // Check if user's role is in the allowed roles
        const hasAccess = roles.includes(userRoleCode) || roles.includes(userrol);
        
        if (!hasAccess) {
          console.log('[ProtectedRoute] No access, redirecting to home');
          // If trying to access home without permission, just allow it for logged in users
          if (rest.path === '/home') {
            return Component ? <Component {...props} /> : null;
          }
          return <Redirect to="/home" />;
        }
        
        return Component ? <Component {...props} /> : null;
      }}
    />
  );
}